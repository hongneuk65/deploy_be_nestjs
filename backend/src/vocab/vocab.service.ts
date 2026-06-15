import { Injectable, NotFoundException, BadRequestException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class VocabService {
  constructor(private prisma: PrismaService) { }

async getSets(userId: string) {
    const sets = await this.prisma.vocabSet.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { vocabs: true } } },
    });
    
    const known = await this.prisma.userVocabProgress.findMany({
      where: { userId, status: 'KNOWN' },
      include: { vocab: { select: { setId: true } } },
    });
    
    const knownMap: Record<string, number> = {};
    known.forEach(k => { knownMap[k.vocab.setId] = (knownMap[k.vocab.setId] || 0) + 1; });
    
    return sets.map(s => ({ 
      ...s, 
      totalWords: s._count.vocabs, 
      knownWords: knownMap[s.id] || 0,
      isOwner: s.userId === userId // Dấu hiệu để frontend biết đây là tác giả
    }));
  }

  async getMySets(userId: string) {
    const sets = await this.prisma.vocabSet.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { vocabs: true } } },
    });
    const known = await this.prisma.userVocabProgress.findMany({
      where: { userId, status: 'KNOWN' },
      include: { vocab: { select: { setId: true } } },
    });
    const knownMap: Record<string, number> = {};
    known.forEach(k => { knownMap[k.vocab.setId] = (knownMap[k.vocab.setId] || 0) + 1; });
    return sets.map(s => ({
      ...s,
      totalWords: s._count.vocabs,
      knownWords: knownMap[s.id] || 0,
    }));
  }

  async deleteVocabSet(userId: string, setId: string) {
    const set = await this.prisma.vocabSet.findUnique({ where: { id: setId } });
    if (!set) throw new NotFoundException('Bộ từ không tồn tại');
    if (set.userId !== userId) throw new ForbiddenException('Bạn không có quyền xóa bộ từ này');

    try {
      // onDelete: Cascade trên Vocab -> userProgress nên xóa set sẽ tự xóa kèm
      await this.prisma.vocabSet.delete({ where: { id: setId } });
      return { success: true };
    } catch (error: any) {
      console.error('Lỗi khi xóa bộ từ:', error);
      throw new InternalServerErrorException(
        `Có lỗi xảy ra khi xóa bộ từ: ${error?.message || 'unknown'}`,
      );
    }
  }

  async getStats(userId: string) {
    const [sysKnown, sysTotal, myTotal, myKnown] = await Promise.all([
      this.prisma.userVocabProgress.count({ where: { userId, status: 'KNOWN' } }),
      this.prisma.vocab.count(),
      this.prisma.userVocab.count({ where: { userId } }),
      this.prisma.userVocab.count({ where: { userId, status: 'KNOWN' } }),
    ]);
    return { system: { known: sysKnown, total: sysTotal }, personal: { known: myKnown, total: myTotal } };
  }

  async getSetVocabs(setId: string, userId: string) {
    const set = await this.prisma.vocabSet.findUnique({ where: { id: setId } });
    if (!set) throw new NotFoundException('Bộ từ không tồn tại');

    // if (set.userId && set.userId !== userId) {
    //   throw new ForbiddenException('Bạn không có quyền xem bộ từ này');
    // }

    const vocabs = await this.prisma.vocab.findMany({ where: { setId }, orderBy: { createdAt: 'asc' } });
    const progress = await this.prisma.userVocabProgress.findMany({
      where: { userId, vocabId: { in: vocabs.map(v => v.id) } },
    });

    const pMap: Record<string, string> = {};
    progress.forEach(p => { pMap[p.vocabId] = p.status; });

    return { set, vocabs: vocabs.map(v => ({ ...v, status: pMap[v.id] || 'UNKNOWN' })) };
  }

  async updateProgress(userId: string, vocabId: string, status: 'KNOWN' | 'UNKNOWN') {
    const vocab = await this.prisma.vocab.findUnique({ where: { id: vocabId } });
    if (!vocab) throw new NotFoundException('Từ vựng không tồn tại');

    return this.prisma.userVocabProgress.upsert({
      where: { userId_vocabId: { userId, vocabId } },
      update: { status, reviewedAt: new Date() },
      create: { userId, vocabId, status },
    });
  }


  async createVocabSet(
    userId: string,
    dto: { title: string; description?: string; sortOrder?: number; words?: any[] }
  ) {
    if (!dto.title?.trim()) {
      throw new BadRequestException('Tên bộ từ không được để trống');
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const newSet = await tx.vocabSet.create({
          data: {
            userId,
            title: dto.title.trim(),
            description: dto.description?.trim() || null,
            sortOrder: dto.sortOrder || 0,
          },
        });

        const vocabData = (dto.words || [])
          .map(w => ({
            setId: newSet.id,
            word: (w.word || '').trim().slice(0, 100),
            meaning: (w.meaning || '').trim(),
            exampleEn: (w.example || '').trim() || null,
            ipa: (w.pronunciation || '').trim().slice(0, 100) || null,
          }))
          .filter(w => w.word && w.meaning);

        if (vocabData.length > 0) {
          await tx.vocab.createMany({ data: vocabData });
        }

        return newSet;
      });
    } catch (error: any) {
      console.error('Lỗi khi tạo bộ từ:', error);
      throw new InternalServerErrorException(
        `Có lỗi xảy ra khi lưu vào database: ${error?.message || 'unknown'}`,
      );
    }
  }

 async generateVocabDataAi(words: string[]) {
    const validWords = (words || []).filter(w => w?.trim().length > 0);

    if (validWords.length === 0) throw new BadRequestException('Danh sách từ trống');
    if (validWords.length > 50) throw new BadRequestException('Chỉ hỗ trợ tối đa 50 từ mỗi lần');

    const prompt = `
      Bạn là chuyên gia ngôn ngữ. Hãy trả về mảng JSON cho các từ tiếng Anh sau:
      [${validWords.join(', ')}]

      Cấu trúc bắt buộc (không giải thích thêm, chỉ trả JSON, không bọc trong markdown):
      [
        {
          "word": "từ vựng gốc",
          "meaning": "nghĩa tiếng Việt ngắn gọn",
          "pronunciation": "phiên âm IPA",
          "example": "1 ví dụ tiếng Anh chứa từ này (kèm nghĩa tiếng Việt trong ngoặc)"
        }
      ]
    `;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new InternalServerErrorException('Hệ thống thiếu cấu hình API Key cho AI.');
    }

    let text = '';
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: { responseMimeType: 'application/json' },
      });

      const result = await model.generateContent(prompt);
      text = result.response.text();
    } catch (error: any) {
      console.error('AI Error (call Gemini):', error?.message || error);
      throw new InternalServerErrorException(
        `Lỗi khi gọi Gemini API: ${error?.message || 'unknown'}`,
      );
    }

    try {
      const cleanJsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsedData = JSON.parse(cleanJsonStr);

      if (!Array.isArray(parsedData)) {
        throw new Error('AI không trả về mảng JSON hợp lệ');
      }

      return parsedData;
    } catch (error: any) {
      console.error('AI Error (parse JSON):', error?.message || error, '\nRaw text:', text);
      throw new InternalServerErrorException(
        `AI trả về dữ liệu không đúng định dạng JSON: ${error?.message || 'unknown'}`,
      );
    }
  }
}