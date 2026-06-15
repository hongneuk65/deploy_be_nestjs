import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const PART_MINUTES: Record<number, number> = {
  1: 6, 2: 25, 3: 30, 4: 30, 5: 30, 6: 16, 7: 54,
};

@Injectable()
export class TheoryService {
  constructor(private prisma: PrismaService) {}

  // ─── Danh sách 7 bài lý thuyết ──────────────────────────────────────────────
  async getAll() {
    const lessons = await this.prisma.theoryLesson.findMany({
      orderBy: { partNumber: 'asc' },
      select: { id: true, partNumber: true, title: true, updatedAt: true },
    });

    // Tính số câu mỗi Part — hiển thị "Part 3 · 39 câu"
    const counts = await this.prisma.subQuestion.groupBy({
      by: ['questionId'],
      _count: { id: true },
    });

    // Đơn giản hơn: query trực tiếp số subQuestion theo partNumber
    const partCounts = await this.prisma.$queryRaw<{ part_number: number; cnt: bigint }[]>`
      SELECT p.part_number, COUNT(sq.id) as cnt
      FROM sub_questions sq
      JOIN questions q ON sq.question_id = q.id
      JOIN parts p ON q.part_id = p.id
      GROUP BY p.part_number
    `;
    const countMap: Record<number, number> = {};
    partCounts.forEach(r => { countMap[r.part_number] = Number(r.cnt); });

    return lessons.map(l => ({
      ...l,
      questionCount: countMap[l.partNumber] || 0,
    }));
  }

  // ─── Nội dung 1 bài lý thuyết ───────────────────────────────────────────────
  async getByPart(partNumber: number) {
    const lesson = await this.prisma.theoryLesson.findUnique({
      where: { partNumber },
    });
    if (!lesson) throw new NotFoundException(`Chưa có lý thuyết cho Part ${partNumber}`);
    return lesson;
  }

  // ─── Tạo attempt luyện tập chỉ riêng Part này ───────────────────────────────
  // Mode luyện tập: không giới hạn thời gian nghiêm ngặt như thi thật,
  // nhưng vẫn cần timeLimitSec để tái dùng UI ExamRoom (đặt = thời gian gợi ý của Part)
  async createPracticeAttempt(userId: string, partNumber: number) {
    if (partNumber < 1 || partNumber > 7) {
      throw new BadRequestException('Part không hợp lệ');
    }

    // Lấy exam đang active đầu tiên (mặc định chỉ có 1 đề)
    const exam = await this.prisma.exam.findFirst({
      where: { isActive: true },
      select: { id: true },
    });
    if (!exam) throw new NotFoundException('Chưa có đề thi nào');

    const timeLimitSec = (PART_MINUTES[partNumber] || 15) * 60;

    return this.prisma.examAttempt.create({
      data: {
        userId,
        examId: exam.id,
        selectedParts: [partNumber],
        timeLimitSec,
      },
    });
  }

  // ─── ADMIN: cập nhật nội dung lý thuyết ─────────────────────────────────────
  async upsertLesson(partNumber: number, title: string, contentMd: string) {
    if (partNumber < 1 || partNumber > 7) {
      throw new BadRequestException('Part phải từ 1 đến 7');
    }
    return this.prisma.theoryLesson.upsert({
      where: { partNumber },
      update: { title, contentMd },
      create: { partNumber, title, contentMd },
    });
  }
}