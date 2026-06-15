import { Module } from '@nestjs/common';
import { PostAnalysisService } from './post-analysis.service';
import { PostAnalysisController } from './post-analysis.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [PostAnalysisService],
  controllers: [PostAnalysisController],
  exports: [PostAnalysisService],
})
export class PostAnalysisModule {}