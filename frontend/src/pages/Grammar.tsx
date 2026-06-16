import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import apiClient from '../api/client';
import PageContainer from '../components/PageContainer';

// Trang danh sách 7 Parts
export function GrammarList() {
    const parts = [
        { num: 1, title: 'Mô Tả Tranh', desc: '6 câu · Nghe và chọn mô tả đúng' },
        { num: 2, title: 'Hỏi & Đáp', desc: '25 câu · Chọn câu trả lời phù hợp' },
        { num: 3, title: 'Đoạn Hội Thoại', desc: '39 câu · Hội thoại 2–3 người' },
        { num: 4, title: 'Bài Nói', desc: '30 câu · Thông báo, bài phát biểu' },
        { num: 5, title: 'Câu Không Hoàn Chỉnh', desc: '30 câu · Điền vào chỗ trống' },
        { num: 6, title: 'Đoạn Văn Không Hoàn Chỉnh', desc: '16 câu · Điền vào đoạn văn' },
        { num: 7, title: 'Đọc Hiểu', desc: '54 câu · Đơn/đôi/ba đoạn văn' },
    ];

    return (
        <PageContainer size='xl'>
            <h1 className="text-2xl font-bold mb-6">Lý Thuyết Theo Part</h1>
            <div className="grid gap-3">
                {parts.map(p => (
                    <Link
                        key={p.num}
                        to={`/grammar/${p.num}`}
                        className="bg-white rounded-xl border p-4 hover:shadow-md transition-shadow flex items-center gap-4"
                    >
                        <span className="w-10 h-10 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center font-bold">
                            {p.num}
                        </span>
                        <div>
                            <p className="font-medium">{p.title}</p>
                            <p className="text-sm text-gray-500">{p.desc}</p>
                        </div>
                    </Link>
                ))}
            </div>
        </PageContainer>
    );
}

// Trang nội dung lý thuyết 1 Part
export function GrammarDetail() {
    const { partNumber } = useParams();
    const navigate = useNavigate();
    const [theory, setTheory] = useState<any>(null);
    const [practicing, setPracticing] = useState(false);

    useEffect(() => {
        apiClient.get(`/theory/${partNumber}`).then(r => setTheory(r.data));
    }, [partNumber]);

    // const startPractice = async () => {
    //     setPracticing(true);
    //     const res = await apiClient.get(`/theory/${partNumber}/practice`);
    //     navigate(`/exam/${res.data.attemptId}?mode=practice`);
    // };

    if (!theory) return <div className="p-8 text-center">Đang tải...</div>;

    return (
        <PageContainer size='md'>
            <Link to="/grammar" className="text-blue-600 text-sm mb-4 block">
                ← Quay lại danh sách
            </Link>

            <article className="prose max-w-none bg-white rounded-xl border p-6 mb-6">
                <ReactMarkdown>{theory.contentMd}</ReactMarkdown>
            </article>

            <Link to="/exam"
                // onClick={startPractice}
                // disabled={practicing}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium disabled:opacity-50"
            >
                {practicing ? 'Đang chuẩn bị...' : 'Luyện tập ngay'}
            </Link>
        </PageContainer>
    );
}