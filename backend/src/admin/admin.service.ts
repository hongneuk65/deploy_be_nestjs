import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// sourceId của Part/Question/SubQuestion là Int @unique toàn DB.
// Mỗi đề chiếm 1 "khoang" 1_000_000 số: examIndex * OFFSET + id_local
// => tối đa 999 đề, không bao giờ trùng sourceId giữa các đề.
const SOURCE_ID_OFFSET = 1_000_000;

// Map section.id trong file JSON -> partNumber (1-7). Cố định theo format đề ETS.
const ID_TO_PART: Record<number, number> = {
    121: 1,
    120: 2,
    122: 3,
    146: 4,
    183: 5,
    184: 6,
    185: 7,
};

@Injectable()
export class AdminService {
    constructor(private prisma: PrismaService) { }

    // ─── Stats ────────────────────────────────────────────────────────────────
    async getStats() {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const [users, attemptsToday, exams, missingExplanation] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.examAttempt.count({
                where: { createdAt: { gte: startOfToday } },
            }),
            this.prisma.exam.count({ where: { isActive: true } }),
            this.prisma.subQuestion.count({
                where: { OR: [{ explanation: null }, { explanation: '' }] },
            }),
        ]);

        return { users, attemptsToday, exams, missingExplanation };
    }

    // ─── Exams ────────────────────────────────────────────────────────────────
    async getExams() {
        return this.prisma.exam.findMany({
            orderBy: { createdAt: 'desc' },
            include: { _count: { select: { parts: true } } },
        });
    }

    async getExam(id: string) {
        const exam = await this.prisma.exam.findUnique({
            where: { id },
            include: {
                _count: { select: { parts: true } },
                parts: {
                    orderBy: { partNumber: 'asc' },
                    include: { _count: { select: { questions: true } } },
                },
            },
        });
        if (!exam) throw new NotFoundException(`Exam ${id} not found`);
        return exam;
    }

    async updateExam(id: string, data: { isActive?: boolean; title?: string; description?: string }) {
        try {
            return await this.prisma.exam.update({ where: { id }, data });
        } catch {
            throw new NotFoundException(`Exam ${id} not found`);
        }
    }

    async deleteExam(id: string) {
        try {
            // onDelete: Cascade trên Part -> Question -> SubQuestion sẽ tự dọn dữ liệu liên quan
            return await this.prisma.exam.delete({ where: { id } });
        } catch {
            throw new NotFoundException(`Exam ${id} not found`);
        }
    }

    /**
     * Thêm đề thi mới từ file JSON (cùng format với data/toeic_data_clean_normalized.json
     * dùng trong seed script). Tự sinh sourceId không trùng với các đề đã có.
     */
    async importExamFromJson(payload: any) {
        if (!payload || typeof payload !== 'object') {
            throw new BadRequestException('File JSON không hợp lệ');
        }

        const { title, description, isActive, sections, totalQuestions } = payload;

        if (!title || typeof title !== 'string') {
            throw new BadRequestException('JSON thiếu trường "title" (tên đề thi)');
        }
        if (!Array.isArray(sections) || sections.length === 0) {
            throw new BadRequestException('JSON thiếu trường "sections" (danh sách Part)');
        }

        // Tìm examIndex chưa dùng để tránh đụng sourceId với các đề trước đó
        const [maxPart, maxQuestion, maxSub] = await Promise.all([
            this.prisma.part.aggregate({ _max: { sourceId: true } }),
            this.prisma.question.aggregate({ _max: { sourceId: true } }),
            this.prisma.subQuestion.aggregate({ _max: { sourceId: true } }),
        ]);
        const maxSourceId = Math.max(
            maxPart._max.sourceId ?? 0,
            maxQuestion._max.sourceId ?? 0,
            maxSub._max.sourceId ?? 0,
            0,
        );
        const examIndex = Math.floor(maxSourceId / SOURCE_ID_OFFSET) + 1;
        const makeId = (localId: number) => examIndex * SOURCE_ID_OFFSET + localId;

        const exam = await this.prisma.exam.create({
            data: {
                title,
                description: description ?? null,
                isActive: isActive ?? true,
            },
        });

        const warnings: string[] = [];
        let totalSubsSeeded = 0;

        try {
            for (const section of sections) {
                const partNumber = ID_TO_PART[section.id as number];
                if (!partNumber) {
                    warnings.push(`Bỏ qua section id=${section.id} (không xác định được Part number)`);
                    continue;
                }
                if (!Array.isArray(section.questions)) {
                    warnings.push(`Part ${partNumber}: thiếu "questions"`);
                    continue;
                }

                const part = await this.prisma.part.create({
                    data: {
                        examId: exam.id,
                        sourceId: makeId(section.id),
                        partNumber,
                        partType: section.type === 'reading' ? 'reading' : 'listening',
                        description: section.description ?? null,
                        audioUrl: section.audioUrl ?? null,
                    },
                });

                for (let qi = 0; qi < section.questions.length; qi++) {
                    const q = section.questions[qi];

                    const question = await this.prisma.question.create({
                        data: {
                            sourceId: makeId(q.id),
                            partId: part.id,
                            isGrouped: !!q.isGrouped,
                            questionOrder: qi + 1,
                            imageUrl: q.imageUrl ?? null,
                            audioUrl: q.audioUrl ?? null,
                        },
                    });

                    for (const sq of q.subQuestions ?? []) {
                        const choiceMap: Record<string, string> = {};
                        for (const c of sq.choices ?? []) {
                            choiceMap[c.label] = c.text ?? '';
                        }

                        if (!sq.correctAnswer) {
                            warnings.push(`Câu ${sq.number}: thiếu correctAnswer, tạm dùng "A"`);
                        }

                        await this.prisma.subQuestion.create({
                            data: {
                                sourceId: makeId(sq.number),
                                questionId: question.id,
                                subOrder: sq.number,
                                questionText: sq.questionText ?? '',
                                optionA: choiceMap['A'] ?? '',
                                optionB: choiceMap['B'] ?? '',
                                optionC: choiceMap['C'] ?? '',
                                optionD: choiceMap['D'] !== undefined ? choiceMap['D'] : null,
                                correctAnswer: sq.correctAnswer ?? 'A',
                                explanation: sq.explanation ?? null,
                            },
                        });

                        totalSubsSeeded++;
                    }
                }
            }
        } catch (err: any) {
            // Rollback toàn bộ đề nếu import giữa đường lỗi, tránh để lại dữ liệu nửa vời
            await this.prisma.exam.delete({ where: { id: exam.id } }).catch(() => { });
            throw new BadRequestException(`Import thất bại, đã rollback: ${err.message}`);
        }

        if (totalQuestions && totalSubsSeeded !== totalQuestions) {
            warnings.push(`Mong đợi ${totalQuestions} câu nhưng đã tạo ${totalSubsSeeded} câu`);
        }

        return {
            exam,
            examIndex,
            totalSubsSeeded,
            warnings,
        };
    }

    // ─── Users ────────────────────────────────────────────────────────────────
    async getUsers() {
        return this.prisma.user.findMany({
            select: {
                id: true, email: true, name: true,
                role: true, isActive: true, createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async toggleUser(id: string, isActive: boolean) {
        try {
            return await this.prisma.user.update({ where: { id }, data: { isActive } });
        } catch {
            throw new NotFoundException('User not found');
        }
    }

    // ─── Theory ───────────────────────────────────────────────────────────────
    async getTheory(partNumber: number) {
        return (
            (await this.prisma.theoryLesson.findUnique({ where: { partNumber } })) ||
            { contentMd: '' }
        );
    }

    async updateTheory(partNumber: number, contentMd: string) {
        return this.prisma.theoryLesson.upsert({
            where: { partNumber },
            update: { contentMd },
            create: { partNumber, contentMd, title: `Lý thuyết Part ${partNumber}` },
        });
    }

    // ─── Questions / Giải thích ─────────────────────────────────────────────────
    // Giải thích (explanation) thuộc về SubQuestion, mà SubQuestion -> Question -> Part -> Exam.
    // Nên giải thích vốn đã gắn liền với 1 đề cụ thể. Tham số examId dùng để lọc đúng đề
    // khi quản trị (vì nhiều đề dùng chung partNumber 1-7, dễ lẫn nếu chỉ filter theo part).
    async getQuestions(limit: number = 50, part?: number, examId?: string) {
        return this.prisma.subQuestion.findMany({
            take: limit,
            where: {
                question: {
                    part: {
                        ...(part ? { partNumber: part } : {}),
                        ...(examId ? { examId } : {}),
                    },
                },
            },
            orderBy: { subOrder: 'asc' },
            include: {
                question: {
                    select: {
                        part: { select: { partNumber: true, examId: true, exam: { select: { title: true } } } },
                    },
                },
            },
        });
    }

    async updateExplanation(subQuestionId: string, explanation: string) {
        try {
            return await this.prisma.subQuestion.update({
                where: { id: subQuestionId },
                data: { explanation },
            });
        } catch {
            throw new NotFoundException('SubQuestion not found');
        }
    }

    // ─── Vocab Sets ───────────────────────────────────────────────────────────
    async getVocabSets() {
        return this.prisma.vocabSet.findMany({
            orderBy: { sortOrder: 'asc' },
            include: { _count: { select: { vocabs: true } } },
        });
    }

    async createVocabSet(data: { title: string; description?: string; icon?: string; sortOrder?: number }) {
        return this.prisma.vocabSet.create({ data });
    }

    async updateVocabSet(id: string, data: { title?: string; description?: string; icon?: string; sortOrder?: number }) {
        try {
            return await this.prisma.vocabSet.update({ where: { id }, data });
        } catch {
            throw new NotFoundException('VocabSet not found');
        }
    }

    async deleteVocabSet(id: string) {
        try {
            return await this.prisma.vocabSet.delete({ where: { id } });
        } catch {
            throw new NotFoundException('VocabSet not found');
        }
    }

    // ─── Vocab Words ──────────────────────────────────────────────────────────
    async getWordsBySet(setId: string) {
        return this.prisma.vocab.findMany({
            where: { setId },
            orderBy: { word: 'asc' },
        });
    }

    async createVocab(data: {
        setId: string; word: string; meaning: string;
        ipa?: string; wordType?: any; exampleEn?: string; exampleVi?: string; audioUrl?: string;
    }) {
        return this.prisma.vocab.create({ data });
    }

    async updateVocab(id: string, data: any) {
        try {
            return await this.prisma.vocab.update({ where: { id }, data });
        } catch {
            throw new NotFoundException('Vocab not found');
        }
    }

    async deleteVocab(id: string) {
        try {
            return await this.prisma.vocab.delete({ where: { id } });
        } catch {
            throw new NotFoundException('Vocab not found');
        }
    }
}