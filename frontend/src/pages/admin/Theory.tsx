import { useEffect, useState } from 'react';
import api from '../../api/client';
import ReactMarkdown from 'react-markdown'; // Cần cài đặt: npm install react-markdown

export default function AdminTheory() {
    const [partNumber, setPartNumber] = useState<number>(1);
    const [contentMd, setContentMd] = useState<string>('');
    const [, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const fetchTheory = async (part: number) => {
        setLoading(true);
        try {
            const res = await api.get(`/admin/theory/${part}`);
            setContentMd(res.data?.contentMd || '');
        } catch {
            setContentMd('');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTheory(partNumber);
    }, [partNumber]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.patch(`/admin/theory/${partNumber}`, { contentMd });
            alert(`Lưu Part ${partNumber} thành công!`);
        } catch {
            alert('Lỗi lưu lý thuyết');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex flex-col h-screen p-4">
            <h1 className="text-2xl font-bold mb-4">📖 Quản trị lý thuyết TOEIC</h1>
            
            {/* Tab chọn Part */}
            <div className="flex gap-2 mb-4">
                {[1, 2, 3, 4, 5, 6, 7].map(num => (
                    <button
                        key={num}
                        onClick={() => setPartNumber(num)}
                        className={`px-4 py-2 rounded font-medium ${partNumber === num ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                    >
                        Part {num}
                    </button>
                ))}
            </div>

            {/* Split View: Soạn thảo & Xem trước */}
            <div className="flex-1 grid grid-cols-2 gap-4 h-full overflow-hidden">
                <textarea
                    className="w-full h-full p-4 border rounded font-mono text-sm focus:outline-blue-500"
                    value={contentMd}
                    onChange={(e) => setContentMd(e.target.value)}
                    placeholder="Nhập nội dung Markdown..."
                />
                <div className="w-full h-full p-4 border rounded bg-white overflow-y-auto prose max-w-none">
                    <ReactMarkdown>{contentMd || '*Chưa có nội dung, hãy nhập ở cột bên trái*'}</ReactMarkdown>
                </div>
            </div>

            <button
                onClick={handleSave}
                disabled={saving}
                className="mt-4 px-8 py-3 bg-green-600 text-white font-bold rounded hover:bg-green-700 disabled:bg-gray-400"
            >
                {saving ? 'Đang lưu...' : `Lưu Part ${partNumber}`}
            </button>
        </div>
    );
}