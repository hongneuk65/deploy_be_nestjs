import { Module } from '@nestjs/common';
import { AttemptsController, AnswersController } from './attempts.controller';
import { AttemptsService } from './attempts.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [AttemptsController, AnswersController],
  providers: [AttemptsService],
  exports: [AttemptsService],
})
export class AttemptsModule {}