import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AiChatService {
  private genAI: GoogleGenerativeAI;

  constructor(private prisma: PrismaService, private config: ConfigService) {
    this.genAI = new GoogleGenerativeAI(this.config.get('GEMINI_API_KEY') || '');
  }

  async chat(userId: string, subQuestionId: string, attemptId: string, userMessage: string) {
    const sq = await this.prisma.subQuestion.findUnique({
      where: { id: subQuestionId },
      include: { question: { select: { imageUrl: true, audioUrl: true, isGrouped: true } } },
    });
    if (!sq) throw new NotFoundException('Câu hỏi không tồn tại');

    const attempt = await this.prisma.examAttempt.findFirst({
      where: { id: attemptId, userId, status: 'COMPLETED' },
    });
    if (!attempt) throw new ForbiddenException('Không có quyền');

    const userAnswer = await this.prisma.userAnswer.findUnique({
      where: { attemptId_subQuestionId: { attemptId, subQuestionId } },
    });

    // Lấy/tạo session chat
    const session = await this.prisma.aiChat.upsert({
      where: { userId_subQuestionId_attemptId: { userId, subQuestionId, attemptId } },
      update: {},
      create: { userId, subQuestionId, attemptId, messages: [] },
    });

    const history = session.messages as { role: string; content: string }[];

    const systemPrompt = `Bạn là giáo viên TOEIC chuyên nghiệp giải thích 1 câu hỏi cụ thể.

CÂU HỎI:
Nội dung: ${sq.questionText}
A. ${sq.optionA}
B. ${sq.optionB}
C. ${sq.optionC}
${sq.optionD ? `D. ${sq.optionD}` : ''}
Đáp án ĐÚNG: ${sq.correctAnswer}
Học viên chọn: ${userAnswer?.chosenAnswer || 'Bỏ qua'}
Kết quả: ${userAnswer?.isCorrect ? 'ĐÚNG ✓' : 'SAI ✗'}
Giải thích có sẵn: ${sq.explanation || 'Không có'}

NGUYÊN TẮC:
- Trả lời tiếng Việt, thân thiện, tối đa 120 từ
- Nếu hỏi tại sao sai: giải thích cả lý do chọn sai VÀ tại sao đáp án đúng đúng
- Nếu hỏi ví dụ: cho 1-2 câu tương tự
- Không nhắc lại toàn bộ đáp án khi không cần thiết`;

    const model = this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: systemPrompt,
    });

    const chat = model.startChat({
      history: history.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      })),
    });

    const result = await chat.sendMessage(userMessage);
    const reply = result.response.text();

    const updated = [
      ...history,
      { role: 'user', content: userMessage },
      { role: 'assistant', content: reply },
    ];

    await this.prisma.aiChat.update({ where: { id: session.id }, data: { messages: updated } });
    return { reply, history: updated };
  }

  async getHistory(userId: string, subQuestionId: string, attemptId: string) {
    const chat = await this.prisma.aiChat.findUnique({
      where: { userId_subQuestionId_attemptId: { userId, subQuestionId, attemptId } },
    });
    return { messages: chat?.messages || [] };
  }
}