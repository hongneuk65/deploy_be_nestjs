import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PostAnalysisService {
  private genAI: GoogleGenerativeAI;

  constructor(private config: ConfigService, private prisma: PrismaService) {
    this.genAI = new GoogleGenerativeAI(this.config.get('GEMINI_API_KEY') || '');
  }

  async triggerGlobalAnalysis(userId: string) {
    // 1. Lấy 10 bài thi gần nhất (đã hoàn thành)
    const attempts = await this.prisma.examAttempt.findMany({
      where: { userId, status: 'COMPLETED' },
      orderBy: { submittedAt: 'desc' },
      take: 10,
    });

    if (attempts.length === 0) {
      throw new BadRequestException('Chưa có dữ liệu bài thi để phân tích');
    }

    // 2. Chống spam: Kiểm tra xem có bản phân tích nào tạo trong 12h qua chưa
    const recentAnalysis = await this.prisma.postExamAnalysis.findFirst({
      where: { userId, status: 'done', generatedAt: { gte: new Date(Date.now() - 12 * 60 * 60 * 1000) } },
      orderBy: { generatedAt: 'desc' },
    });
    if (recentAnalysis) return; // Đã có bản mới phân tích gần đây, bỏ qua chạy lại AI

    // 3. Khởi tạo bản ghi phân tích mới
    const analysisRecord = await this.prisma.postExamAnalysis.create({
      data: { userId, status: 'processing', analysisJson: {} }
    });

    try {
      // 4. Tổng hợp dữ liệu (Gộp toàn bộ đáp án của 10 đề để tính % đúng từng Part)
      // 4. Tổng hợp dữ liệu (Tính % đúng từng Part)
      const attemptIds = attempts.map(a => a.id);
      
      // 4.1 Đếm TỔNG số câu đã làm theo từng Part
      const totalPerPart = await this.prisma.userAnswer.groupBy({
        by: ['partNumber'],
        where: { attemptId: { in: attemptIds } },
        _count: { id: true },
      });

      // 4.2 Đếm số câu TRẢ LỜI ĐÚNG theo từng Part
      const correctPerPart = await this.prisma.userAnswer.groupBy({
        by: ['partNumber'],
        where: { attemptId: { in: attemptIds }, isCorrect: true },
        _count: { id: true },
      });

      // 4.3 Gộp dữ liệu lại để tính phần trăm (%)
      const partAccuracy: Record<string, number> = {};
      const correctMap: Record<number, number> = {};
      
      // Đưa số câu đúng vào một object map cho dễ tìm
      correctPerPart.forEach(p => {
        correctMap[p.partNumber] = p._count.id;
      });

      // Tính % cho từng part
      totalPerPart.forEach(p => {
        const total = p._count.id;
        const correct = correctMap[p.partNumber] || 0; // Nếu không có câu nào đúng thì là 0
        partAccuracy[p.partNumber] = Math.round((correct / total) * 100);
      });
      // Sắp xếp điểm cũ -> mới để xem xu hướng tiến bộ
      const scoreTrend = attempts.map(a => a.totalScore).reverse();
      const partBreakdownText = Object.entries(partAccuracy)
        .map(([part, pct]) => `Part ${part}: ${pct}%`)
        .join(', ');

      // 5. Xây dựng Prompt tổng quan
      const prompt = `Bạn là giáo viên TOEIC. Phân tích năng lực tổng quan của học viên dựa trên ${attempts.length} bài thi gần nhất.

DỮ LIỆU:
- Lịch sử điểm tổng (từ cũ đến mới nhất): ${scoreTrend.join(' -> ')}
- Tỷ lệ làm đúng trung bình theo từng Part (trên tổng số ${attempts.length} đề): ${partBreakdownText}
- Mục tiêu thường thấy ở mức điểm này: Cần cải thiện rõ rệt phần yếu nhất.

YÊU CẦU: Trả về duy nhất định dạng JSON (không markdown, không giải thích thêm):
{
  "strengths": "1-2 câu tóm tắt điểm mạnh qua các bài thi",
  "weaknesses": "1-2 câu chỉ ra lỗ hổng kiến thức chính xác dựa trên tỷ lệ %",
  "topErrors": ["Dạng lỗi 1", "Dạng lỗi 2", "Dạng lỗi 3"],
  "suggestion": "Lộ trình học thực tế cho tuần tiếp theo (chỉ rõ nên tập trung ôn Part nào)"
}`;

      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent(prompt);
      const text = result.response.text();

      // 6. Parse và cập nhật DB
      const clean = text.replace(/```json|```/g, '').trim();
      let parsed: any;
      try {
        parsed = JSON.parse(clean);
      } catch {
        parsed = { strengths: text, weaknesses: 'Lỗi định dạng', topErrors: [], suggestion: '' };
      }

      await this.prisma.postExamAnalysis.update({
        where: { id: analysisRecord.id },
        data: { status: 'done', analysisJson: parsed },
      });

    } catch (error) {
      console.error('AI Analysis Error:', error);
      await this.prisma.postExamAnalysis.update({
        where: { id: analysisRecord.id },
        data: { status: 'error' },
      });
    }
  }

  async getGlobalStatus(userId: string) {
    // Lấy bản phân tích mới nhất của user này
    const analysis = await this.prisma.postExamAnalysis.findFirst({
      where: { userId },
      orderBy: { generatedAt: 'desc' },
    });

    if (!analysis) return { status: 'none', data: null };
    return { status: analysis.status, data: analysis.analysisJson };
  }
}