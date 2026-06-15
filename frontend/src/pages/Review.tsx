import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';
import AiChatBox from '../components/AiChatBox';
import { decode } from 'html-entities';
import ReactMarkdown from 'react-markdown';
import PageContainer from '../components/PageContainer';

interface SubQ {
    id: string;
    subOrder: number;
    questionText: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string | null;
    correctAnswer: string;
    explanation: string | null;
    question?: {
        isGrouped: boolean;
        imageUrl: string | null;
        audioUrl: string | null;
        part: { partNumber: number };
    };
}

interface Answer {
    id: string;
    partNumber: number;
    chosenAnswer: string | null;
    isCorrect: boolean | null;
    subQuestion: SubQ;
}

const getMediaUrl = (sq: SubQ, type: 'audio' | 'image') => {
    const key = type === 'audio' ? 'audioUrl' : 'imageUrl';
    return (sq.question as any)?.[key] ?? null;
};

export default function Review() {
    const { attemptId } = useParams<{ attemptId: string }>();
    const [answers, setAnswers] = useState<Answer[]>([]);
    const [filter, setFilter] = useState<'all' | 'wrong' | 'correct'>('all');
    const [partFilter, setPartFilter] = useState<number | 'all'>('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get(`/attempts/${attemptId}/review`)
            .then(r => setAnswers(r.data))
            .finally(() => setLoading(false));
    }, [attemptId]);

    if (loading) return (
        <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    // ── Bộ lọc Đúng/Sai + Part ──────────────────────────────────────────────
    const passesFilter = (a: Answer) => {
        if (partFilter !== 'all' && a.partNumber !== partFilter) return false;
        if (filter === 'wrong') return a.isCorrect === false;
        if (filter === 'correct') return a.isCorrect === true;
        return true;
    };

    const filtered = answers.filter(passesFilter);
    const parts = [...new Set(answers.map(a => a.partNumber))].sort((a, b) => a - b);

    // ── Gom nhóm theo (audioUrl + imageUrl) ─────────────────────────────────
    // Part 1/5 (không group): mỗi câu = 1 nhóm riêng
    // Part 3/4/6/7 (group): các câu cùng audio/image → 1 nhóm
    type Group = { key: string; audioUrl: string | null; imageUrl: string | null; items: Answer[] };
    const groups: Group[] = [];

    for (const a of filtered) {
        const sq = a.subQuestion;
        const audioUrl = getMediaUrl(sq, 'audio');
        const imageUrl = getMediaUrl(sq, 'image');
        const isGrouped = sq.question?.isGrouped;

        if (isGrouped && (audioUrl || imageUrl)) {
            const key = `${audioUrl ?? ''}|${imageUrl ?? ''}`;
            const existing = groups.find(g => g.key === key);
            if (existing) { existing.items.push(a); continue; }
            groups.push({ key, audioUrl, imageUrl, items: [a] });
        } else {
            groups.push({ key: `single-${a.id}`, audioUrl, imageUrl, items: [a] });
        }
    }

    return (
        <PageContainer size="full">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold">Chữa Bài</h1>
                    <Link to={`/result/${attemptId}`} className="text-sm text-blue-600 hover:underline">
                        ← Về kết quả
                    </Link>
                </div>

                {/* Bộ lọc */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {(['all', 'wrong', 'correct'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors
                ${filter === f ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200'}`}
                        >
                            {{ all: 'Tất cả', wrong: '✗ Câu sai', correct: '✓ Câu đúng' }[f]}
                        </button>
                    ))}
                    <select
                        value={partFilter}
                        onChange={e => setPartFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                        className="px-3 py-1.5 rounded-lg text-sm border bg-white"
                    >
                        <option value="all">Tất cả Part</option>
                        {parts.map(p => <option key={p} value={p}>Part {p}</option>)}
                    </select>
                </div>

                {filtered.length === 0 && (
                    <p className="text-center text-gray-400 py-12">Không có câu nào khớp bộ lọc</p>
                )}

                {/* ── Danh sách nhóm ─────────────────────────────────────────────── */}
                <div className="space-y-6">
                    {groups.map(group => {
                        const partNum = group.items[0].partNumber;

                        return (
                            <div key={group.key} className="bg-white rounded-2xl border overflow-hidden">
                                <div className="flex flex-col md:flex-row">

                                    {/* ══════ CỘT TRÁI: Ảnh/Audio + Câu hỏi + Đáp án ══════ */}
                                    <div className="md:w-1/2 border-b md:border-b-0 md:border-r p-5 space-y-4">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                            Part {partNum}
                                            {group.items.length > 1 && ` — ${group.items.length} câu`}
                                        </p>

                                        {/* Media chung của nhóm */}
                                        {group.imageUrl && (
                                            <img
                                                src={group.imageUrl}
                                                alt=""
                                                className="w-full h-auto rounded-xl border bg-gray-50 object-contain"
                                            />
                                        )}
                                        {group.audioUrl && (
                                            <audio controls src={group.audioUrl} className="w-full" />
                                        )}

                                        {/* Từng câu hỏi + đáp án trong nhóm */}
                                        {group.items.map((a, idx) => {
                                            const sq = a.subQuestion;
                                            const isSkipped = a.chosenAnswer === null;

                                            return (
                                                <div key={a.id} className={idx > 0 ? 'pt-4 border-t' : ''}>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="text-xs text-gray-400">Câu {sq.subOrder}</span>
                                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                              ${a.isCorrect ? 'bg-green-100 text-green-700'
                                                                : isSkipped ? 'bg-gray-100 text-gray-500'
                                                                    : 'bg-red-100 text-red-700'}`}>
                                                            {a.isCorrect ? '✓ Đúng' : isSkipped ? '— Bỏ qua' : '✗ Sai'}
                                                        </span>
                                                    </div>

                                                    {sq.questionText && (
                                                        <p className="font-medium mb-3 text-gray-800">{sq.questionText}</p>
                                                    )}

                                                    <div className="space-y-1.5">
                                                        {(['A', 'B', 'C', 'D'] as const).map(opt => {
                                                            const text = sq[`option${opt}` as keyof SubQ] as string | null;
                                                            if (!text) return null;
                                                            const isRight = sq.correctAnswer === opt;
                                                            const isChosen = a.chosenAnswer === opt;
                                                            return (
                                                                <div
                                                                    key={opt}
                                                                    className={`flex items-start gap-2 p-2.5 rounded-lg text-sm
                                    ${isRight ? 'bg-green-50 border border-green-300'
                                                                            : isChosen && !isRight ? 'bg-red-50 border border-red-300'
                                                                                : 'bg-gray-50'}`}
                                                                >
                                                                    <span className={`font-bold w-5 shrink-0
                                    ${isRight ? 'text-green-700' : isChosen ? 'text-red-600' : 'text-gray-500'}`}>
                                                                        {opt}.
                                                                    </span>
                                                                    <span className="text-gray-700">{text}</span>
                                                                    {isRight && <span className="ml-auto text-green-600 shrink-0">✓</span>}
                                                                    {isChosen && !isRight && <span className="ml-auto text-red-500 shrink-0">✗</span>}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* ══════ CỘT PHẢI: Giải thích + AI Chat (gom theo thứ tự) ══════ */}
                                    <div className="md:w-1/2 p-5 space-y-4 bg-gray-50/50">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                            Giải thích
                                        </p>

                                        {group.items.map((a, idx) => {
                                            const sq = a.subQuestion;
                                            return (
                                                <div key={a.id} className={idx > 0 ? 'pt-4 border-t' : ''}>
                                                    {group.items.length > 1 && (
                                                        <p className="text-xs text-gray-400 mb-2">Câu {sq.subOrder}</p>
                                                    )}

                                                    {sq.explanation ? (
                                                        <div
                                                            className="text-sm bg-blue-50 border border-blue-100 rounded-lg p-3 mb-3 text-gray-700"
                                                            style={{ whiteSpace: 'pre-line' }}
                                                        >
                                                            <ReactMarkdown>{decode(sq.explanation)}</ReactMarkdown>
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm text-gray-400 italic mb-3">Chưa có giải thích cho câu này</p>
                                                    )}

                                                    <AiChatBox subQuestionId={sq.id} attemptId={attemptId!} />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </PageContainer>
    );
}