"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const LESSONS = [
    { partNumber: 1, title: 'Part 1 — Mô Tả Tranh', contentMd: `## Part 1 — Mô Tả Tranh\n\n**Cấu trúc:** 6 câu · 1 ảnh + 4 câu mô tả nghe qua audio\n\n### Dạng tranh thường gặp\n- Người đang làm gì (hành động)\n- Đồ vật ở đâu (vị trí)\n- Khung cảnh chung\n\n### Bẫy hay gặp\n1. Mô tả đúng vật nhưng sai hành động\n2. Âm thanh tương tự: "writing" vs "riding"\n3. Chủ ngữ sai: có nhiều người nhưng chỉ 1 người đang làm\n\n### Mẹo\n- Nhìn ảnh trước, đoán từ khóa\n- Loại trừ đáp án có chi tiết SAI` },
    { partNumber: 2, title: 'Part 2 — Hỏi & Đáp', contentMd: `## Part 2 — Hỏi & Đáp\n\n**Cấu trúc:** 25 câu · Nghe 1 câu hỏi → chọn câu trả lời phù hợp (A/B/C)\n\n### Dạng câu hỏi\n- Wh-questions: What, When, Where, Who, How\n- Yes/No questions\n- Tag questions\n- Request/Suggestion\n\n### Bẫy hay gặp\n1. Echo words: nhắc lại từ trong câu hỏi nhưng sai ngữ cảnh\n2. Sound-alike: âm tương tự nhưng nghĩa khác\n\n### Mẹo\n- Chú ý từ đầu câu hỏi (Wh-word)\n- Đáp án gián tiếp vẫn có thể đúng` },
    { partNumber: 3, title: 'Part 3 — Đoạn Hội Thoại', contentMd: `## Part 3 — Đoạn Hội Thoại\n\n**Cấu trúc:** 13 nhóm × 3 câu = 39 câu · Hội thoại 2–3 người\n\n### Loại câu hỏi\n- Main idea / Purpose\n- Detail questions\n- Inference questions\n- Graphic questions (nhìn bảng/sơ đồ)\n\n### Mẹo\n- Đọc trước 3 câu hỏi trước khi nghe\n- Chú ý câu đầu/cuối hội thoại\n- Với graphic: xác định cần tìm thông tin gì` },
    { partNumber: 4, title: 'Part 4 — Bài Nói', contentMd: `## Part 4 — Bài Nói\n\n**Cấu trúc:** 10 bài × 3 câu = 30 câu · Thông báo, bài phát biểu, tin nhắn\n\n### Loại bài nói\n- Announcement/Notice\n- Advertisement\n- News report\n- Recorded message\n\n### Mẹo\n- Nghe intro để xác định loại bài\n- Câu hỏi cuối thường về mục đích người nghe cần làm gì` },
    { partNumber: 5, title: 'Part 5 — Câu Không Hoàn Chỉnh', contentMd: `## Part 5 — Câu Không Hoàn Chỉnh\n\n**Cấu trúc:** 30 câu · Điền vào 1 chỗ trống\n\n### Dạng bài\n- Từ loại (noun/verb/adj/adv)\n- Thì động từ\n- Giới từ\n- Từ nối\n- Từ vựng theo ngữ cảnh\n\n### Mẹo\n- Với từ loại: xác định vị trí trong câu\n- Với thì: tìm time marker\n- Mục tiêu: 30 giây/câu` },
    { partNumber: 6, title: 'Part 6 — Đoạn Văn Không Hoàn Chỉnh', contentMd: `## Part 6 — Đoạn Văn Không Hoàn Chỉnh\n\n**Cấu trúc:** 4 đoạn × 4 câu = 16 câu · Điền vào đoạn văn\n\n### Đặc điểm\n- 1 trong 4 câu là điền nguyên câu (sentence insertion)\n- Cần đọc cả đoạn để hiểu ngữ cảnh\n\n### Mẹo\n- Đọc lướt toàn đoạn trước\n- Với sentence insertion: xét cohesion (câu trước/sau)` },
    { partNumber: 7, title: 'Part 7 — Đọc Hiểu', contentMd: `## Part 7 — Đọc Hiểu\n\n**Cấu trúc:** 54 câu · Đơn (29) + đôi (10) + ba đoạn (15)\n\n### Loại bài đọc\n- Email/Letter\n- Advertisement\n- Article/News\n- Notice/Announcement\n- Form/Table\n\n### Mẹo\n- Đọc câu hỏi TRƯỚC khi đọc bài\n- Với NOT/EXCEPT: loại trừ\n- Với đôi/ba đoạn: câu hỏi về mối quan hệ giữa các đoạn` },
];
async function main() {
    for (const l of LESSONS) {
        await prisma.theoryLesson.upsert({
            where: { partNumber: l.partNumber },
            update: { contentMd: l.contentMd },
            create: l,
        });
        console.log(`✓ Part ${l.partNumber}`);
    }
    console.log('✅ Theory seeded!');
}
main().finally(() => prisma.$disconnect());
