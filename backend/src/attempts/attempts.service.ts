import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { rawToScaled } from '../utils/iig-scale';

const PART_MINUTES: Record<number, number> = {
    1: 6, 2: 25, 3: 30, 4: 30, 5: 30, 6: 16, 7: 54,
};

@Injectable()
export class AttemptsService {
    constructor(private prisma: PrismaService) { }

    async getExams() {
        return this.prisma.exam.findMany({
            where: { isActive: true },
            select: { id: true, title: true, description: true },
        });
    }

    // Sửa hàm createAttempt
    async createAttempt(userId: string, examId: string, selectedParts: number[], customTime?: number) {
        const isFullExam = selectedParts.length === 7;

        let timeLimitSec: number;

        if (isFullExam) {
            // Full exam: mặc định 120 phút, hoặc dùng custom nếu có
            timeLimitSec = (customTime == 0 ? 120 : customTime!) * 60;
        } else {
            // Thi theo part: BẮT BUỘC phải có customTimeMinutes
            if (!customTime || customTime <= 0) {
                throw new BadRequestException('Vui lòng nhập thời gian làm bài khi thi theo part');
            }
            timeLimitSec = customTime * 60;
        }

        return this.prisma.examAttempt.create({
            data: { userId, examId, selectedParts, timeLimitSec },
        });
    }

    async getQuestions(attemptId: string, userId: string) {

        const attempt = await this.prisma.examAttempt.findUnique({ where: { id: attemptId } });
        if (!attempt) throw new NotFoundException('Không tìm thấy bài thi');
        if (attempt.userId !== userId) throw new ForbiddenException();

        const sqs = await this.prisma.subQuestion.findMany({
            where: {
                question: {
                    part: { examId: attempt.examId, partNumber: { in: attempt.selectedParts } },
                },
            },
            include: {
                question: {
                    select: {
                        partId: true, isGrouped: true, imageUrl: true, audioUrl: true,
                        part: { select: { partNumber: true } },
                    },
                },
            },
            orderBy: [
                { question: { part: { partNumber: 'asc' } } },
                { question: { questionOrder: 'asc' } },
                { subOrder: 'asc' },
            ],
        });

        // QUAN TRỌNG: KHÔNG trả correctAnswer và explanation khi đang thi
        return {
            timeLimitSec: attempt.timeLimitSec,
            questions: sqs.map(sq => ({
                id: sq.id,
                subOrder: sq.subOrder,
                questionText: sq.questionText,
                optionA: sq.optionA,
                optionB: sq.optionB,
                optionC: sq.optionC,
                optionD: sq.optionD,
                partNumber: sq.question.part.partNumber,
                isGrouped: sq.question.isGrouped,
                imageUrl: sq.question.imageUrl,
                audioUrl: sq.question.audioUrl,
            })),
        };
    }

    async saveAnswer(userId: string, attemptId: string, subQuestionId: string, chosenAnswer: string, partNumber: number) {
        const attempt = await this.prisma.examAttempt.findFirst({
            where: { id: attemptId, userId, status: 'IN_PROGRESS' },
        });
        if (!attempt) throw new ForbiddenException('Bài thi không hợp lệ');

        return this.prisma.userAnswer.upsert({
            where: { attemptId_subQuestionId: { attemptId, subQuestionId } },
            update: { chosenAnswer, answeredAt: new Date() },
            create: { attemptId, subQuestionId, chosenAnswer, partNumber },
        });
    }

    async submitAttempt(attemptId: string, userId: string) {
    const attempt = await this.prisma.examAttempt.findFirst({
      where: { id: attemptId, userId, status: 'IN_PROGRESS' },
    });
    if (!attempt) throw new NotFoundException('Bài thi không tồn tại');

    // 1. Lấy toàn bộ câu hỏi thuộc các Part đã chọn của đề này
    const allSubQuestions = await this.prisma.subQuestion.findMany({
      where: {
        question: {
          part: { examId: attempt.examId, partNumber: { in: attempt.selectedParts } },
        },
      },
      select: {
        id: true,
        question: { select: { part: { select: { partNumber: true } } } },
      },
    });

    // 2. Lấy danh sách các câu user đã khoanh đáp án
    const existingAnswers = await this.prisma.userAnswer.findMany({
      where: { attemptId },
    });
    const answeredSet = new Set(existingAnswers.map(a => a.subQuestionId));

    // 3. Lọc ra các câu bỏ trống và điền null vào DB
    const missingAnswers = allSubQuestions
      .filter(sq => !answeredSet.has(sq.id))
      .map(sq => ({
        attemptId,
        subQuestionId: sq.id,
        partNumber: sq.question.part.partNumber,
        chosenAnswer: null, // Trạng thái bỏ qua
        isCorrect: false,   // Bỏ trống tính là sai
      }));

    if (missingAnswers.length > 0) {
      await this.prisma.userAnswer.createMany({ data: missingAnswers });
    }

    // 4. Truy vấn lại toàn bộ câu trả lời (gồm cả câu đã khoanh + câu bỏ trống) để chấm điểm
    const finalAnswers = await this.prisma.userAnswer.findMany({
      where: { attemptId },
      include: { subQuestion: { select: { correctAnswer: true } } },
    });

    let lC = 0, lT = 0, rC = 0, rT = 0;
    await Promise.all(finalAnswers.map(a => {
      const isCorrect = a.chosenAnswer === a.subQuestion.correctAnswer;
      if (a.partNumber <= 4) { lT++; if (isCorrect) lC++; }
      else { rT++; if (isCorrect) rC++; }
      return this.prisma.userAnswer.update({ where: { id: a.id }, data: { isCorrect } });
    }));

    const listeningScore = rawToScaled(lC, lT, 'L');
    const readingScore = rawToScaled(rC, rT, 'R');

    // Tạo bản ghi chờ phân tích AI
    return this.prisma.examAttempt.update({
      where: { id: attemptId },
      data: {
        status: 'COMPLETED', submittedAt: new Date(),
        listeningScore, readingScore,
        totalScore: listeningScore + readingScore,
        correctCount: lC + rC, totalCount: lT + rT,

      },
    });
  }
    async getResult(attemptId: string, userId: string) {
        const attempt = await this.prisma.examAttempt.findFirst({
            where: { id: attemptId, userId, status: 'COMPLETED' },
            include: { exam: { select: { title: true } } },
        });
        if (!attempt) throw new NotFoundException('Không tìm thấy kết quả');

        const rows = await this.prisma.userAnswer.groupBy({
            by: ['partNumber'], where: { attemptId }, _count: { id: true },
        });
        const correctRows = await this.prisma.userAnswer.groupBy({
            by: ['partNumber'], where: { attemptId, isCorrect: true }, _count: { id: true },
        });
        const cMap: Record<number, number> = {};
        correctRows.forEach(r => { cMap[r.partNumber] = r._count.id; });

        return {
            ...attempt,
            partBreakdown: rows.map(r => ({
                partNumber: r.partNumber,
                total: r._count.id,
                correct: cMap[r.partNumber] ?? 0,
                accuracy: Math.round(((cMap[r.partNumber] ?? 0) / r._count.id) * 100),
            })).sort((a, b) => a.partNumber - b.partNumber),
        };
    }

    async getReview(attemptId: string, userId: string) {
        const attempt = await this.prisma.examAttempt.findFirst({
            where: { id: attemptId, userId, status: 'COMPLETED' },
        });
        if (!attempt) throw new ForbiddenException();

        return this.prisma.userAnswer.findMany({
            where: { attemptId },
            include: {
                subQuestion: {
                    select: {
                        id: true, subOrder: true, questionText: true,
                        optionA: true, optionB: true, optionC: true, optionD: true,
                        correctAnswer: true, explanation: true,  // Trả về sau khi COMPLETED
                        question: {
                            select: {
                                isGrouped: true, imageUrl: true, audioUrl: true,
                                part: { select: { partNumber: true } },
                            },
                        },
                    },
                },
            },
            orderBy: [{ partNumber: 'asc' }, { subQuestion: { subOrder: 'asc' } }],
        });
    }

    async getHistory(userId: string) {
        return this.prisma.examAttempt.findMany({
            where: { userId, status: 'COMPLETED' },
            include: { exam: { select: { title: true } } },
            orderBy: { submittedAt: 'desc' },
        });
    }
}