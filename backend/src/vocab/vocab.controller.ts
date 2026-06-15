import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { VocabService } from './vocab.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@UseGuards(JwtAuthGuard)
@Controller('vocab')
export class VocabController {
  constructor(private readonly vocabService: VocabService) { }

  @Get('/sets')
  async getSets(@Req() req: any) {
    return await this.vocabService.getSets(req.user.sub);
  }

  @Get('/my-sets')
  async getMySets(@Req() req: any) {
    return await this.vocabService.getMySets(req.user.sub);
  }

  @Get('/stats')
  async getStats(@Req() req: any) {
    return await this.vocabService.getStats(req.user.sub);
  }

  @Get('/sets/:setId')
  async getSetVocabs(@Req() req: any, @Param('setId') setId: string) {
    return await this.vocabService.getSetVocabs(setId, req.user.sub);
  }

  @Delete('/sets/:setId')
  async deleteVocabSet(@Req() req: any, @Param('setId') setId: string) {
    return await this.vocabService.deleteVocabSet(req.user.sub, setId);
  }

  @Post('/create-set')
  async createVocabSet(
    @Req() req: any,
    @Body() dto: { title: string; description?: string; sortOrder?: number; words?: any[] }
  ) {
    const userId = req.user.sub;
    return await this.vocabService.createVocabSet(userId, dto);
  }

  @Post('/ai-generate')
  async generateVocabDataAi(@Body() body: { words: string[] }) {
    return await this.vocabService.generateVocabDataAi(body.words);
  }
}