import { Controller, Post, Get, Body, Param, UseGuards, Req } from '@nestjs/common';
import { AiChatService } from './ai-chat.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('ai-chat')
@UseGuards(JwtAuthGuard)
export class AiChatController {
  constructor(private svc: AiChatService) {}

  @Post(':subQuestionId')
  chat(
    @Param('subQuestionId') sqId: string,
    @Req() req: any,
    @Body() body: { attemptId: string; message: string },
  ) {
    return this.svc.chat(req.user.sub, sqId, body.attemptId, body.message);
  }

  @Get(':subQuestionId/:attemptId')
  history(
    @Param('subQuestionId') sqId: string,
    @Param('attemptId') aId: string,
    @Req() req: any,
  ) {
    return this.svc.getHistory(req.user.sub, sqId, aId);
  }
}