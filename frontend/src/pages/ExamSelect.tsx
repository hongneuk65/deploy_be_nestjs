
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import PageContainer from '../components/PageContainer';

const PARTS = [
    { num: 1, label: 'Part 1', desc: 'Mô tả tranh (6 câu)' },
    { num: 2, label: 'Part 2', desc: 'Hỏi & Đáp (25 câu)' },
    { num: 3, label: 'Part 3', desc: 'Đoạn hội thoại (39 câu)' },
    { num: 4, label: 'Part 4', desc: 'Bài nói (30 câu)' },
    { num: 5, label: 'Part 5', desc: 'Câu không hoàn chỉnh (30 câu)' },
    { num: 6, label: 'Part 6', desc: 'Đoạn văn (16 câu)' },
    { num: 7, label: 'Part 7', desc: 'Đọc hiểu (54 câu)' },
];

const ITEMS_PER_PAGE = 9;

export default function ExamSelect() {
    const navigate = useNavigate();

    const [exams, setExams] = useState<any[]>([]);
    const [selectedExam, setSelectedExam] = useState('');

    const [selectedParts, setSelectedParts] = useState([
        1, 2, 3, 4, 5, 6, 7,
    ]);

    const [loading, setLoading] = useState(false);
    const [customTime, setCustomTime] = useState('');

    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        api.get('/attempts/exams').then((res) => {
            setExams(res.data);

            if (res.data.length > 0) {
                setSelectedExam(res.data[0].id);
            }
        });
    }, []);

    const togglePart = (part: number) => {
        setSelectedParts((prev) =>
            prev.includes(part)
                ? prev.filter((p) => p !== part)
                : [...prev, part].sort((a, b) => a - b)
        );
    };

    const totalPages = Math.ceil(
        exams.length / ITEMS_PER_PAGE
    );

    const currentExams = exams.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const start = async () => {
        if (!selectedExam || selectedParts.length === 0) {
            return;
        }

        setLoading(true);

        try {
            const res = await api.post('/attempts', {
                examId: selectedExam,
                selectedParts,
                customTime,
            });

            navigate(`/exam/${res.data.id}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <PageContainer size="xl">

            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">
                    Bắt đầu thi thử
                </h1>

                <p className="text-gray-500 mt-2">
                    Chọn đề thi, phần thi và thời gian làm bài.
                </p>
            </div>

            {/* Đề thi */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 mb-6">

                <div className="mb-5">
                    <h2 className="font-semibold text-gray-900">
                        Chọn đề thi
                    </h2>

                    <p className="text-sm text-gray-500 mt-1">
                        Chọn bộ đề TOEIC muốn luyện tập.
                    </p>
                </div>

                {currentExams.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                            {currentExams.map((exam) => (
                                <button
                                    key={exam.id}
                                    onClick={() =>
                                        setSelectedExam(exam.id)
                                    }
                                    className={`relative text-left p-5 rounded-2xl border transition-all
                                    ${
                                        selectedExam === exam.id
                                            ? 'border-blue-500 bg-blue-50 shadow-sm'
                                            : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                                    }`}
                                >
                                    {selectedExam === exam.id && (
                                        <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">
                                            ✓
                                        </div>
                                    )}

                                    <h3 className="font-semibold text-gray-900 pr-8">
                                        {exam.title}
                                    </h3>

                                    <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                                        {exam.description ||
                                            'Đề luyện tập TOEIC'}
                                    </p>

                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                        <span className="text-xs text-gray-400">
                                            Full TOEIC Test
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-2 mt-6">

                                <button
                                    onClick={() =>
                                        setCurrentPage((p) =>
                                            Math.max(1, p - 1)
                                        )
                                    }
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 border rounded-xl text-sm disabled:opacity-40"
                                >
                                    Trước
                                </button>

                                {Array.from(
                                    { length: totalPages },
                                    (_, i) => i + 1
                                )
                                    .slice(
                                        Math.max(0, currentPage - 3),
                                        Math.min(
                                            totalPages,
                                            currentPage + 2
                                        )
                                    )
                                    .map((page) => (
                                        <button
                                            key={page}
                                            onClick={() =>
                                                setCurrentPage(page)
                                            }
                                            className={`w-10 h-10 rounded-xl text-sm
                                            ${
                                                page === currentPage
                                                    ? 'bg-blue-600 text-white'
                                                    : 'border border-gray-200 hover:bg-gray-50'
                                            }`}
                                        >
                                            {page}
                                        </button>
                                    ))}

                                <button
                                    onClick={() =>
                                        setCurrentPage((p) =>
                                            Math.min(
                                                totalPages,
                                                p + 1
                                            )
                                        )
                                    }
                                    disabled={
                                        currentPage === totalPages
                                    }
                                    className="px-4 py-2 border rounded-xl text-sm disabled:opacity-40"
                                >
                                    Sau
                                </button>

                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-10 text-gray-500">
                        Chưa có đề thi nào.
                    </div>
                )}
            </div>

            {/* Part */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 mb-6">

                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h2 className="font-semibold text-gray-900">
                            Chọn phần thi
                        </h2>

                        <p className="text-sm text-gray-500 mt-1">
                            Chọn các Part muốn luyện tập.
                        </p>
                    </div>

                    <div className="flex gap-4 text-sm">
                        <button
                            onClick={() =>
                                setSelectedParts([
                                    1, 2, 3, 4, 5, 6, 7,
                                ])
                            }
                            className="text-blue-600"
                        >
                            Chọn tất cả
                        </button>

                        <button
                            onClick={() =>
                                setSelectedParts([])
                            }
                            className="text-gray-500"
                        >
                            Bỏ chọn
                        </button>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">

                    {PARTS.map((part) => (
                        <button
                            key={part.num}
                            onClick={() =>
                                togglePart(part.num)
                            }
                            className={`text-left p-4 rounded-2xl border transition-all
                            ${
                                selectedParts.includes(part.num)
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            <p className="font-medium">
                                {part.label}
                            </p>

                            <p className="text-sm text-gray-500 mt-1">
                                {part.desc}
                            </p>
                        </button>
                    ))}

                </div>
            </div>

            {/* Thời gian */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 mb-6">

                <h2 className="font-semibold text-gray-900">
                    Thời gian làm bài
                </h2>

                <p className="text-sm text-gray-500 mt-1 mb-4">
                    Để trống để sử dụng thời gian mặc định.
                </p>

                <input
                    type="number"
                    min={1}
                    value={customTime}
                    onChange={(e) =>
                        setCustomTime(e.target.value)
                    }
                    placeholder="Ví dụ: 120"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {/* Tổng kết */}
            <div className="bg-blue-50 border border-blue-100 rounded-3xl p-5">

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                    <div>
                        <p className="text-sm text-blue-700">
                            Đã chọn {selectedParts.length}/7 Part
                        </p>

                        <p className="font-semibold text-blue-900 mt-1">
                            Thời gian:
                            {' '}
                            {customTime
                                ? `${customTime} phút`
                                : selectedParts.length === 7
                                ? '120 phút'
                                : 'Mặc định'}
                        </p>
                    </div>

                    <button
                        onClick={start}
                        disabled={
                            loading ||
                            !selectedExam ||
                            selectedParts.length === 0
                        }
                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-medium disabled:opacity-50"
                    >
                        {loading
                            ? 'Đang tạo đề...'
                            : 'Bắt đầu thi'}
                    </button>

                </div>
            </div>

        </PageContainer>
    );
}

