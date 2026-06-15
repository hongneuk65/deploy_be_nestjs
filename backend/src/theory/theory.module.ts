import { Module } from '@nestjs/common';
import { TheoryController } from './theory.controller';
import { TheoryService } from './theory.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [TheoryController],
  providers: [TheoryService],
})
export class TheoryModule {}