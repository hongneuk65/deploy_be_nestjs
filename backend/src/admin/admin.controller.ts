import {
    Controller, Get, Post, Patch, Delete,
    Body, Param, Query, UseGuards, ParseIntPipe
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
    constructor(private adminService: AdminService) { }

    // ─── Stats ────────────────────────────────────────────────────────────────
    @Get('stats')
    getStats() {
        return this.adminService.getStats();
    }

    // ─── Exams ────────────────────────────────────────────────────────────────
    @Get('exams')
    getExams() {
        return this.adminService.getExams();
    }

    @Patch('exams/:id')
    updateExam(@Param('id') id: string, @Body() body: any) {
        return this.adminService.updateExam(id, body);
    }

    // ─── Users ────────────────────────────────────────────────────────────────
    @Get('users')
    getUsers() {
        return this.adminService.getUsers();
    }

    @Patch('users/:id/status')
    toggleUser(
        @Param('id') id: string,
        @Body('isActive') isActive: boolean,
    ) {
        return this.adminService.toggleUser(id, isActive);
    }

    // ─── Theory ───────────────────────────────────────────────────────────────
    @Get('theory/:partNumber')
    getTheory(@Param('partNumber', ParseIntPipe) partNumber: number) {
        return this.adminService.getTheory(partNumber);
    }

    @Patch('theory/:partNumber')
    updateTheory(
        @Param('partNumber', ParseIntPipe) partNumber: number,
        @Body('contentMd') contentMd: string,
    ) {
        return this.adminService.updateTheory(partNumber, contentMd);
    }

    // ─── Questions ────────────────────────────────────────────────────────────
    @Get('questions')
    getQuestions(
        @Query('limit') limit?: string,
        @Query('part') part?: string,         // ← Bug fix: thêm part query
    ) {
        return this.adminService.getQuestions(
            Number(limit) || 50,
            part ? Number(part) : undefined,
        );
    }

    @Patch('questions/:subQuestionId/explanation')
    updateExplanation(
        @Param('subQuestionId') subQuestionId: string,
        @Body('explanation') explanation: string,
    ) {
        return this.adminService.updateExplanation(subQuestionId, explanation);
    }

    // ─── Vocab Sets ───────────────────────────────────────────────────────────
    @Get('vocab-sets')
    getVocabSets() {
        return this.adminService.getVocabSets();
    }

    @Post('vocab-sets')
    createVocabSet(@Body() body: { title: string; description?: string; icon?: string }) {
        return this.adminService.createVocabSet(body);
    }

    @Delete('vocab-sets/:id')
    deleteVocabSet(@Param('id') id: string) {
        return this.adminService.deleteVocabSet(id);
    }

    @Get('vocab-sets/:id/words')
    getWordsBySet(@Param('id') setId: string) {
        return this.adminService.getWordsBySet(setId);
    }

    // ─── Vocab Words ──────────────────────────────────────────────────────────
    @Post('vocab')
    createVocab(
        @Body() data: {
            setId: string; word: string; meaning: string;
            ipa?: string; wordType?: string; exampleEn?: string; exampleVi?: string;
        },
    ) {
        return this.adminService.createVocab(data);
    }

    @Patch('vocab/:id')
    updateVocab(@Param('id') id: string, @Body() data: any) {
        return this.adminService.updateVocab(id, data);
    }

    @Delete('vocab/:id')
    deleteVocab(@Param('id') id: string) {
        return this.adminService.deleteVocab(id);
    }
}