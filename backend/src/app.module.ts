import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AttemptsModule } from './attempts/attempts.module';
import { AiChatModule } from './ai-chat/ai-chat.module';
import { VocabModule } from './vocab/vocab.module';
import { TheoryModule } from './theory/theory.module';
import { PostAnalysisModule } from './post-analysis/post-analysis.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true}),
    PrismaModule,
    AuthModule,
    AttemptsModule,
    AiChatModule,
    VocabModule,
    TheoryModule,
    PostAnalysisModule,
    AdminModule,
    
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
