import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import apiClient from '../api/client';
import PageContainer from '../components/PageContainer';

interface SubQuestion {
    id: string;
    subOrder: number;
    questionText: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string | null;
    partNumber: number;
    isGrouped: boolean;
    imageUrl: string | null;
    audioUrl: string | null;
}

export default function ExamRoom() {
    const { attemptId } = useParams();
    const [searchParams] = useSearchParams();
    const isPractice = searchParams.get('mode') === 'practice';
    const navigate = useNavigate();

    const [questions, setQuestions] = useState<SubQuestion[]>([]);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [timeLeft, setTimeLeft] = useState(0);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [hasStarted, setHasStarted] = useState(false);

    const debounceRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

    useEffect(() => {
        const load = async () => {
            const res = await apiClient.get(`/attempts/${attemptId}/questions`);
            setQuestions(res.data.questions);
            setTimeLeft(res.data.timeLimitSec);
            setLoading(false);
        };
        load();
    }, [attemptId]);

    useEffect(() => {
        if (loading || isPractice || !hasStarted) return;
        const timer = setInterval(() => {
            setTimeLeft(t => {
                if (t <= 1) { clearInterval(timer); handleSubmit(); return 0; }
                return t - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [loading, isPractice, hasStarted]);

    const handleAnswer = (subQuestionId: string, answer: string, partNumber: number) => {
        setAnswers(prev => ({ ...prev, [subQuestionId]: answer }));
        if (debounceRef.current[subQuestionId]) clearTimeout(debounceRef.current[subQuestionId]);
        debounceRef.current[subQuestionId] = setTimeout(() => {
            apiClient.post('/answers', { attemptId, subQuestionId, chosenAnswer: answer, partNumber });
        }, 300);
    };

    const handleSubmit = async () => {
        await apiClient.post(`/attempts/${attemptId}/submit`);
        navigate(`/result/${attemptId}`);
    };

    const formatTime = (secs: number) => {
        const h = Math.floor(secs / 3600).toString().padStart(2, '0');
        const m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        return h !== '00' ? `${h}:${m}:${s}` : `${m}:${s}`;
    };

    if (loading) return <div className="p-8 text-center font-medium">Đang tải cấu trúc đề thi...</div>;

    if (!hasStarted && !isPractice) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
                <h2 className="text-3xl font-bold mb-4 text-blue-800">Bài thi đã sẵn sàng</h2>
                <p className="text-gray-600 mb-8 max-w-md text-center">
                    Phần thi Nghe (Part 1-4) sẽ tự động phát âm thanh và chuyển câu. Bạn sẽ không thể tua lại. Phần thi Đọc (Part 5-7) bạn có thể tự do chuyển câu.
                </p>
                <button
                    onClick={() => setHasStarted(true)}
                    className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold text-lg hover:bg-blue-700 shadow-lg transition-transform hover:scale-105"
                >
                    Bắt đầu làm bài ngay
                </button>
            </div>
        );
    }

    const current = questions[currentIndex];
    const answeredCount = Object.keys(answers).length;
    const isListening = current?.partNumber <= 4;
    const readingQuestions = questions.filter(q => q.partNumber >= 5);
    const readingAnsweredCount = readingQuestions.filter(q => answers[q.id]).length;

    // Lấy nhóm câu cùng ảnh (Part 6-7 grouped)
    const groupedByImage = current?.isGrouped && current?.imageUrl && !current?.audioUrl
        ? questions.filter(x => x.imageUrl === current.imageUrl && x.isGrouped)
        : [];
    const isImageGroup = groupedByImage.length > 0;

    // Lấy nhóm câu cùng audio (Part 3-4)
    const groupedByAudio = current?.isGrouped && current?.audioUrl
        ? questions.filter(x => x.audioUrl === current.audioUrl && x.isGrouped)
        : [];

    // Helper render đáp án cho 1 câu
    const renderOptions = (q: SubQuestion) => {
        const opts = q.partNumber === 2 ? ['A', 'B', 'C'] : ['A', 'B', 'C', 'D'];
        return (
            <div className="space-y-2 mt-3">
                {opts.map(option => {
                    const text = q[`option${option}` as keyof SubQuestion] as string | null;
                    const isSelected = answers[q.id] === option;
                    return (
                        <label key={option}
                            className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border-2 transition-all
                                ${isSelected ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-gray-100 bg-gray-50 hover:border-blue-300 hover:bg-white'}`}>
                            <input type="radio" name={q.id} value={option} checked={isSelected}
                                onChange={() => handleAnswer(q.id, option, q.partNumber)}
                                className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                            <span className={`font-bold w-5 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`}>{option}.</span>
                            {text && text.trim() !== '' && <span className="text-gray-700 text-sm">{text}</span>}
                        </label>
                    );
                })}
            </div>
        );
    };

    return (
        <PageContainer size = 'full'>
            {/* Header */}
            <div className="bg-white border-b px-6 py-3 flex items-center justify-between shadow-sm relative z-20">
                <span className="font-bold text-gray-700">TOEIC TEST</span>
                {!isPractice && (
                    <span className={`font-mono text-xl font-bold bg-gray-100 px-4 py-1 rounded-lg ${timeLeft < 300 ? 'text-red-600 animate-pulse' : 'text-gray-800'}`}>
                        ⏱ {formatTime(timeLeft)}
                    </span>
                )}
                <button onClick={() => setShowSubmitModal(true)}
                    className="bg-red-500 text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-red-600 shadow-sm">
                    Nộp bài
                </button>
            </div>

            <div className="flex h-[calc(100vh-57px)]">
                {/* VÙNG CHÍNH */}
                <div className="flex-1 overflow-hidden flex flex-col">

                    {/* ===== LAYOUT: PART 6-7 CÓ ẢNH NHÓM ===== */}
                    {isImageGroup ? (
                        <div className="flex flex-1 overflow-hidden">
                            {/* Cột trái: Ảnh cố định */}
                            <div className="w-1/2 border-r bg-white overflow-y-auto p-5 flex items-start justify-center">
                                <div className="sticky top-0 w-full">
                                    <p className="text-xs font-bold text-gray-400 uppercase mb-3 tracking-wider">
                                        Part {current.partNumber} — Đoạn văn
                                    </p>
                                    <img
                                        src={current.imageUrl!}
                                        alt="passage"
                                        className="w-full h-auto rounded-xl border border-gray-200 shadow-sm object-contain"
                                    />
                                </div>
                            </div>

                            {/* Cột phải: Toàn bộ câu hỏi của nhóm */}
                            <div className="w-1/2 overflow-y-auto p-5 space-y-4">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                                    {groupedByImage.length} câu hỏi
                                </p>
                                {groupedByImage.map((q, i) => (
                                    <div key={q.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                                        <p className="text-xs font-bold text-blue-500 mb-2">Câu {q.subOrder}</p>
                                        <p className="font-semibold text-gray-800 text-sm">{q.questionText}</p>
                                        {renderOptions(q)}
                                    </div>
                                ))}

                                {/* Nút điều hướng nhảy sang nhóm tiếp */}
                                <div className="flex justify-between pt-2">
                                    <button
                                        onClick={() => {
                                            const firstIdx = questions.indexOf(groupedByImage[0]);
                                            const prevIdx = firstIdx - 1;
                                            if (prevIdx >= 0 && questions[prevIdx].partNumber >= 5)
                                                setCurrentIndex(prevIdx);
                                        }}
                                        disabled={questions.indexOf(groupedByImage[0]) === 0 || questions[questions.indexOf(groupedByImage[0]) - 1]?.partNumber <= 4}
                                        className="px-5 py-2.5 bg-white text-gray-700 border-2 border-gray-200 rounded-xl font-bold text-sm disabled:opacity-40 hover:bg-gray-50"
                                    >
                                        ← Nhóm trước
                                    </button>
                                    <button
                                        onClick={() => {
                                            const lastIdx = questions.indexOf(groupedByImage[groupedByImage.length - 1]);
                                            const nextIdx = lastIdx + 1;
                                            if (nextIdx < questions.length)
                                                setCurrentIndex(nextIdx);
                                        }}
                                        disabled={questions.indexOf(groupedByImage[groupedByImage.length - 1]) === questions.length - 1}
                                        className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm disabled:opacity-40 hover:bg-blue-700 shadow-md"
                                    >
                                        Nhóm tiếp →
                                    </button>
                                </div>
                            </div>
                        </div>

                    ) : (
                        /* ===== LAYOUT: PART 1-4 (NGHE) & PART 5 (ĐƠN) ===== */
                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="max-w-3xl mx-auto space-y-4">

                                {/* Audio ẩn - KHÔNG THAY ĐỔI */}
                                {current?.audioUrl && (
                                    <audio key={current.audioUrl} src={current.audioUrl} autoPlay className="hidden"
                                        onEnded={() => {
                                            setTimeout(() => setCurrentIndex(i => Math.min(questions.length - 1, i + 1)), );
                                        }} />
                                )}

                                {/* Ảnh (Part 1 hoặc Part 5 đơn lẻ có ảnh) */}
                                {current?.imageUrl && (
                                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3">
                                        <img src={current.imageUrl} alt="question"
                                            className="w-full h-auto rounded-lg object-contain mx-auto"
                                            style={{ maxHeight: '50vh' }} />
                                    </div>
                                )}

                                {/* Card câu hỏi */}
                                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                                    <p className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-3">
                                        {isListening ? 'Phần Nghe' : 'Phần Đọc'} — Part {current?.partNumber} | Câu {current?.subOrder}
                                    </p>
                                    {current?.questionText && (
                                        <p className="font-semibold text-gray-800 mb-4">{current.questionText}</p>
                                    )}
                                    {current && renderOptions(current)}
                                </div>

                                {/* Nút điều hướng - CHỈ PHẦN ĐỌC */}
                                {!isListening && (
                                    <div className="flex justify-between pt-1">
                                        <button
                                            onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
                                            disabled={currentIndex === 0 || questions[currentIndex - 1]?.partNumber <= 4}
                                            className="px-6 py-2.5 bg-white text-gray-700 border-2 border-gray-200 rounded-xl font-bold disabled:opacity-40 hover:bg-gray-100"
                                        >
                                            ← Câu trước
                                        </button>
                                        <button
                                            onClick={() => setCurrentIndex(i => Math.min(questions.length - 1, i + 1))}
                                            disabled={currentIndex === questions.length - 1}
                                            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold disabled:opacity-40 hover:bg-blue-700 shadow-md"
                                        >
                                            Câu tiếp →
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* SIDEBAR - CHỈ PHẦN ĐỌC */}
                {!isListening && (
                    <div className="w-64 bg-white border-l p-4 flex flex-col h-full shadow-[-5px_0_15px_-5px_rgba(0,0,0,0.05)]">
                        <div className="mb-4">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
                                Chuyển nhanh
                            </label>
                            <div className="relative">
                                <select
                                    className="w-full appearance-none border-2 border-blue-200 bg-blue-50 rounded-xl p-2.5 text-sm font-bold text-blue-800 outline-none focus:border-blue-600 cursor-pointer"
                                    value={currentIndex}
                                    onChange={(e) => setCurrentIndex(Number(e.target.value))}
                                >
                                    {questions.map((q, idx) => {
                                        if (q.partNumber <= 4) return null;
                                        return (
                                            <option key={q.id} value={idx}>
                                                Câu {q.subOrder} {answers[q.id] ? `✓ (${answers[q.id]})` : ''}
                                            </option>
                                        );
                                    })}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-blue-600">
                                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <p className="text-xs font-medium mb-3 text-gray-500 border-b pb-2 flex justify-between">
                            <span>Tiến độ Đọc</span>
                            <span className="font-bold text-blue-600">{readingAnsweredCount}/{readingQuestions.length}</span>
                        </p>

                        <div className="overflow-y-auto flex-1 pr-1">
                            <div className="grid grid-cols-5 gap-1.5">
                                {questions.map((q, idx) => {
                                    if (q.partNumber <= 4) return null;
                                    const isAnswered = !!answers[q.id];
                                    // Highlight cả nhóm nếu đang ở nhóm ảnh
                                    const isInCurrentGroup = isImageGroup && groupedByImage.some(g => g.id === q.id);
                                    const isActive = idx === currentIndex;
                                    return (
                                        <button key={q.id} onClick={() => setCurrentIndex(idx)}
                                            className={`aspect-square rounded-lg text-xs font-bold transition-all
                                                ${isActive ? 'ring-2 ring-blue-600 ring-offset-1 scale-110 z-10' : isInCurrentGroup ? 'ring-1 ring-blue-300' : 'hover:scale-105'}
                                                ${isAnswered ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                                            {q.subOrder}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal nộp bài */}
            {showSubmitModal && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl">
                        <h3 className="font-extrabold text-2xl mb-4 text-gray-800">Xác nhận nộp bài</h3>
                        <div className="bg-gray-50 p-4 rounded-xl mb-6">
                            <p className="text-gray-600 flex justify-between mb-2">
                                Tổng đã làm: <strong className="text-gray-900">{answeredCount}/{questions.length}</strong>
                            </p>
                            {answeredCount < questions.length && (
                                <p className="text-red-500 text-sm font-medium flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    Bỏ trống {questions.length - answeredCount} câu
                                </p>
                            )}
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => setShowSubmitModal(false)}
                                className="flex-1 border-2 border-gray-200 text-gray-600 rounded-xl py-3 font-bold hover:bg-gray-50">
                                Làm tiếp
                            </button>
                            <button onClick={handleSubmit}
                                className="flex-1 bg-red-500 text-white rounded-xl py-3 font-bold hover:bg-red-600 shadow-md">
                                Nộp bài ngay
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </PageContainer>
    );
}