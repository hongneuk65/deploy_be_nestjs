import {
    Controller, Get, Post, Patch, Param, Body,
    UseGuards, Req, ParseIntPipe,
} from '@nestjs/common';
import { TheoryService } from './theory.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('theory')
@UseGuards(JwtAuthGuard)
export class TheoryController {
    constructor(private svc: TheoryService) { }

    // GET /theory — danh sách 7 bài kèm số câu mỗi Part
    @Get()
    getAll() {
        return this.svc.getAll();
    }

    // GET /theory/:partNumber — nội dung Markdown của 1 Part
    @Get(':partNumber')
    getByPart(@Param('partNumber', ParseIntPipe) partNumber: number) {
        return this.svc.getByPart(partNumber);
    }

    // GET /theory/:partNumber/practice — tạo attempt luyện tập chỉ Part này
    // Trả về { id: attemptId } — frontend dùng để redirect sang /exam/:attemptId?mode=practice
    @Post(':partNumber/practice')
    createPractice(
        @Param('partNumber', ParseIntPipe) partNumber: number,
        @Req() req: any,
    ) {
        return this.svc.createPracticeAttempt(req.user.sub, partNumber);
    }

    // ─── ADMIN: cập nhật nội dung lý thuyết ───────────────────────────────────
    @Patch(':partNumber')
    @UseGuards(RolesGuard)
    @Roles('ADMIN')
    update(
        @Param('partNumber', ParseIntPipe) partNumber: number,
        @Body() body: { title: string; contentMd: string },
    ) {
        return this.svc.upsertLesson(partNumber, body.title, body.contentMd);
    }
}