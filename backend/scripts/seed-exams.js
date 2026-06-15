"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const prisma = new client_1.PrismaClient();
const ID_TO_PART = {
    121: 1,
    120: 2,
    122: 3,
    146: 4,
    183: 5,
    184: 6,
    185: 7,
};
// ─────────────────────────────────────────────────────────────
// THAY ĐỔI DUY NHẤT MỖI KHI THÊM ĐỀ MỚI:
// ─────────────────────────────────────────────────────────────
const EXAM_CONFIG = {
    id: 'a0000000-0000-0000-0000-000000000001',
    title: 'ETS 2026 TEST 1',
    description: 'Đề thi TOEIC chuẩn ETS 2026',
    dataFile: 'data/toeic_data_clean_normalized.json',
    // Số thứ tự đề (đề 1 = 1, đề 2 = 2, đề 3 = 3, ...)
    // Dùng để tạo sourceId number unique: examIndex * OFFSET + id_gốc
    // Mỗi đề có không gian 1_000_000 số → tối đa 999 đề
    examIndex: 1,
};
// ─────────────────────────────────────────────────────────────
// Offset đủ lớn để không bao giờ trùng giữa các đề
// examIndex=1 → sourceId trong [1_000_001 .. 1_999_999]
// examIndex=2 → sourceId trong [2_000_001 .. 2_999_999]
const OFFSET = 1_000_000;
const makeId = (localId) => EXAM_CONFIG.examIndex * OFFSET + localId;
async function main() {
    console.log('🚀 Bắt đầu seed dữ liệu...\n');
    const filePath = path.join(__dirname, EXAM_CONFIG.dataFile);
    if (!fs.existsSync(filePath)) {
        console.error(`❌ Không tìm thấy: ${filePath}`);
        process.exit(1);
    }
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    console.log(`📄 File: ${filePath}`);
    console.log(`   examIndex: ${EXAM_CONFIG.examIndex}  (sourceId offset: ${EXAM_CONFIG.examIndex * OFFSET})`);
    console.log(`   Sections: ${data.sections.length}, Expected SubQuestions: ${data.totalQuestions}\n`);
    // ── Bước 1: Upsert Exam ───────────────────────────────────────────────────
    const exam = await prisma.exam.upsert({
        where: { id: EXAM_CONFIG.id },
        update: { title: EXAM_CONFIG.title, description: EXAM_CONFIG.description },
        create: {
            id: EXAM_CONFIG.id,
            title: EXAM_CONFIG.title,
            description: EXAM_CONFIG.description,
            isActive: true,
        },
    });
    console.log(`✓ Exam: "${exam.title}" (id: ${exam.id})\n`);
    let totalSubsSeeded = 0;
    // ── Bước 2: Upsert từng Part / Question / SubQuestion ────────────────────
    for (const section of data.sections) {
        const partNumber = ID_TO_PART[section.id];
        if (!partNumber) {
            console.warn(`⚠️  Bỏ qua section id=${section.id} (không map được Part number)`);
            continue;
        }
        // sourceId Part = examIndex * 1_000_000 + section.id
        // VD: đề 2, section 121 → 2_000_121
        const partSourceId = makeId(section.id);
        const part = await prisma.part.upsert({
            where: { sourceId: partSourceId },
            update: {
                description: section.description ?? null,
                audioUrl: section.audioUrl ?? null,
            },
            create: {
                examId: exam.id,
                sourceId: partSourceId,
                partNumber,
                partType: section.type,
                description: section.description ?? null,
                audioUrl: section.audioUrl ?? null,
            },
        });
        console.log(`\n📦 Part ${partNumber} — ${section.name}`);
        console.log(`   sourceId: ${partSourceId}  |  ${section.questions.length} question groups`);
        let subsInPart = 0;
        for (let qi = 0; qi < section.questions.length; qi++) {
            const q = section.questions[qi];
            const questionOrder = qi + 1;
            // sourceId Question = examIndex * 1_000_000 + q.id
            const questionSourceId = makeId(q.id);
            const question = await prisma.question.upsert({
                where: { sourceId: questionSourceId },
                update: {
                    isGrouped: q.isGrouped,
                    imageUrl: q.imageUrl ?? null,
                    audioUrl: q.audioUrl ?? null,
                },
                create: {
                    sourceId: questionSourceId,
                    partId: part.id,
                    isGrouped: q.isGrouped,
                    questionOrder,
                    imageUrl: q.imageUrl ?? null,
                    audioUrl: q.audioUrl ?? null,
                },
            });
            for (const sq of q.subQuestions) {
                const choiceMap = {};
                for (const c of sq.choices) {
                    choiceMap[c.label] = c.text ?? '';
                }
                if (!sq.correctAnswer) {
                    console.warn(`   ⚠️  Câu ${sq.number}: thiếu correctAnswer, tạm dùng "A"`);
                }
                // sourceId SubQuestion = examIndex * 1_000_000 + sq.number
                // VD: đề 2, câu 1 → 2_000_001  |  đề 3, câu 1 → 3_000_001  → KHÔNG BAO GIỜ TRÙNG
                const subSourceId = makeId(sq.number);
                await prisma.subQuestion.upsert({
                    where: { sourceId: subSourceId },
                    update: {
                        questionText: sq.questionText ?? '',
                        optionA: choiceMap['A'] ?? '',
                        optionB: choiceMap['B'] ?? '',
                        optionC: choiceMap['C'] ?? '',
                        optionD: choiceMap['D'] !== undefined ? choiceMap['D'] : null,
                        correctAnswer: sq.correctAnswer ?? 'A',
                        explanation: sq.explanation ?? null,
                    },
                    create: {
                        sourceId: subSourceId,
                        questionId: question.id,
                        subOrder: sq.number,
                        questionText: sq.questionText ?? '',
                        optionA: choiceMap['A'] ?? '',
                        optionB: choiceMap['B'] ?? '',
                        optionC: choiceMap['C'] ?? '',
                        optionD: choiceMap['D'] !== undefined ? choiceMap['D'] : null,
                        correctAnswer: sq.correctAnswer ?? 'A',
                        explanation: sq.explanation ?? null,
                    },
                });
                subsInPart++;
                totalSubsSeeded++;
                process.stdout.write('.');
            }
        }
        console.log(`\n   ✓ ${subsInPart} sub_questions seeded`);
    }
    // ── Bước 3: Verify (chỉ đếm câu thuộc đề này) ───────────────────────────
    const countInExam = await prisma.subQuestion.count({
        where: { question: { part: { examId: exam.id } } },
    });
    const countInDB = await prisma.subQuestion.count();
    console.log(`\n${'─'.repeat(50)}`);
    console.log(`✅ Seed hoàn thành!`);
    console.log(`   Đã seed lần này:          ${totalSubsSeeded} sub_questions`);
    console.log(`   Thuộc "${exam.title}": ${countInExam} sub_questions`);
    console.log(`   Tổng toàn DB:             ${countInDB} sub_questions`);
    if (countInExam !== 200) {
        console.warn(`\n⚠️  Mong đợi 200 câu cho đề này nhưng DB có ${countInExam}`);
    }
    else {
        console.log('   ✓ Đúng 200 câu cho đề này');
    }
}
main()
    .catch(e => {
    console.error('\n❌ Seed thất bại:', e.message);
    console.error(e);
    process.exit(1);
})
    .finally(() => prisma.$disconnect());
