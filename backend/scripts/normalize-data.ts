import * as fs from 'fs';
import * as path from 'path';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function decodeHtml(html: string | null | undefined | boolean): string {
  if (!html || typeof html !== 'string') return '';
  return html
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ');
}

function extractImageUrls(html: string | null | undefined | boolean): string[] {
  if (!html || typeof html !== 'string') return [];
  const decoded = decodeHtml(html);
  
  const regex = /src=["'](https?:\/\/[^"']+\.(?:jpg|jpeg|png|gif|webp)[^"']*)/gi;
  const urls: string[] = [];
  let match;
  
  while ((match = regex.exec(decoded)) !== null) {
    urls.push(match[1]);
  }
  return urls;
}

function extractSubNumber(title: string): number {
  const m = title.trim().match(/^(\d+)/);
  if (!m) throw new Error(`Không lấy được số câu từ title: "${title}"`);
  return parseInt(m[1], 10);
}

function stripHtml(html: string | null | undefined): string | null {
  if (!html) return null;
  const decoded = decodeHtml(html);
  return decoded
    .replace(/<strong>/gi, '**').replace(/<\/strong>/gi, '**')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<p>/gi, '').replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main() {
  console.log('⏳ Đang đọc dữ liệu gốc...');

  const inputPath = path.join(__dirname, 'data/toeic_data_clean.json');
  const outputPath = path.join(__dirname, 'data/toeic_data_clean_normalized.json');

  if (!fs.existsSync(inputPath)) {
    console.error(`❌ Không tìm thấy file: ${inputPath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(inputPath, 'utf-8');
  const input: any[] = JSON.parse(raw);

  if (!Array.isArray(input)) {
    console.error('❌ JSON gốc phải là array ở root level');
    process.exit(1);
  }

  const output = {
    generatedAt: new Date().toISOString(),
    totalSections: input.length,
    totalQuestions: 0,
    sections: [] as any[],
  };

  let totalSubQuestions = 0;

  for (const sec of input) {
    const descImageUrls = extractImageUrls(sec.term_desc);
    const descImageUrl = descImageUrls.length > 0 ? descImageUrls.join(',') : null;

    const section: any = {
      id: sec.term_id,                                            
      name: sec.term_name,                                        
      type: sec.term_type || (sec.term_id <= 146 ? 'listening' : 'reading'),
      description: stripHtml(sec.term_desc),
      imageUrl: descImageUrl,
      audioUrl: sec.term_audio || null,
      questions: [],
    };

    for (const q of (sec.questions || [])) {
      const imageUrls = extractImageUrls(q.content);
      const imageUrl = imageUrls.length > 0 ? imageUrls.join(',') : null;

      const audioUrl = q.audio_url && typeof q.audio_url === 'string' ? q.audio_url : null;

      const question: any = {
        id: q.question_id,
        title: q.title || '',
        isGrouped: q.is_grouped === true,
        imageUrl,
        audioUrl,
        subQuestions: [],
      };

      for (const sq of (q.sub_questions || [])) {
        const subNumber = extractSubNumber(sq.title);
        const answers: any[] = sq.answer || [];

        const correctChoice = answers.find((a: any) => a.choice_right_answer === true);
        if (!correctChoice) {
          console.warn(`  ⚠️  Câu ${subNumber}: không tìm thấy đáp án đúng`);
        }

        const rawTitle = decodeHtml(sq.title || '');
        const questionText = rawTitle.replace(/^\d+\s*\.\s*/, '').trim();

        const normalizedSub: any = {
          number: subNumber,                                                   
          questionText: questionText,
          correctAnswer: correctChoice?.choice || 'A',
          explanation: stripHtml(sq.explanation),
          choices: answers.map((a: any) => ({
            label: a.choice,                                                   
            text: a.choice_answer || '',                                       
            isCorrect: a.choice_right_answer === true,
          })),
        };

        question.subQuestions.push(normalizedSub);
        totalSubQuestions++;
      }

      section.questions.push(question);
    }

    output.totalQuestions += section.questions.reduce(
      (s: number, q: any) => s + q.subQuestions.length, 0
    );
    output.sections.push(section);
    console.log(`  ✓ ${section.name} (${section.questions.length} groups, ${section.questions.reduce((s: number, q: any) => s + q.subQuestions.length, 0)} sub_questions)`);
  }

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');

  console.log(`\n✅ Hoàn thành!`);
  console.log(`  File: ${outputPath}`);
  console.log(`  Sections: ${output.sections.length}`);
  console.log(`  Total SubQuestions: ${totalSubQuestions}`);
}

main();