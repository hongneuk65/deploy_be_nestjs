import { Controller, Post, Get, UseGuards, Req } from '@nestjs/common';
import { PostAnalysisService } from './post-analysis.service'; // Chú ý tên service import cho đúng
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('analysis') 
@UseGuards(JwtAuthGuard)
export class PostAnalysisController {
  constructor(private svc: PostAnalysisService) { }

  @Post('global/trigger')
  triggerGlobal(@Req() req: any) {
    this.svc.triggerGlobalAnalysis(req.user.sub).catch(console.error);
    return { status: 'processing' };
  }

  @Get('global/status')
  getGlobalStatus(@Req() req: any) {
    return this.svc.getGlobalStatus(req.user.sub);
  }
}