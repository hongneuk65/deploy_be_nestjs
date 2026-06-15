import { Controller, Post, Get, Body, Param, UseGuards, Req } from '@nestjs/common';
import { AttemptsService } from './attempts.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('attempts')
@UseGuards(JwtAuthGuard)
export class AttemptsController {
  constructor(private svc: AttemptsService) {}

  @Get('exams') getExams() { return this.svc.getExams(); }

  @Post()
  create(@Req() req: any, @Body() body: { examId: string; selectedParts: number[]; customTime:number}) {
    return this.svc.createAttempt(req.user.sub, body.examId, body.selectedParts, body.customTime);
  }

  @Get(':id/questions')
  questions(@Param('id') id: string, @Req() req: any) {
    return this.svc.getQuestions(id, req.user.sub);
  }

  @Post(':id/submit')
  submit(@Param('id') id: string, @Req() req: any) {
    return this.svc.submitAttempt(id, req.user.sub);
  }

  @Get(':id/result')
  result(@Param('id') id: string, @Req() req: any) {
    return this.svc.getResult(id, req.user.sub);
  }

  @Get(':id/review')
  review(@Param('id') id: string, @Req() req: any) {
    return this.svc.getReview(id, req.user.sub);
  }

  @Get('history/me')
  history(@Req() req: any) { return this.svc.getHistory(req.user.sub); }
}

// Endpoint lưu đáp án tách riêng
import { Controller as C2 } from '@nestjs/common';
@C2('answers')
export class AnswersController {
  constructor(private svc: AttemptsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  save(@Req() req: any, @Body() body: {
    attemptId: string; subQuestionId: string;
    chosenAnswer: string; partNumber: number;
  }) {
    return this.svc.saveAnswer(req.user.sub, body.attemptId, body.subQuestionId, body.chosenAnswer, body.partNumber);
  }
}