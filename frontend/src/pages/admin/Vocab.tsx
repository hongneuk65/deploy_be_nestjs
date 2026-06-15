import { useEffect, useState } from 'react';
import api from '../../api/client';

// Định nghĩa interface dựa trên schema Prisma
interface VocabSet { id: string; title: string; }
interface Vocab { 
    id: string; word: string; meaning: string; 
    wordType: string; ipa: string 
}

export default function AdminVocab() {
    const [vocabSets, setVocabSets] = useState<VocabSet[]>([]);
    const [selectedSet, setSelectedSet] = useState<string | null>(null);
    const [words, setWords] = useState<Vocab[]>([]);
    const [loading, setLoading] = useState(false);

    // 1. Fetch danh sách bộ từ
    const fetchSets = async () => {
        try {
            const res = await api.get('/admin/vocab-sets');
            setVocabSets(res.data);
        } catch (err) { console.error(err); }
    };

    useEffect(() => { fetchSets(); }, []);

    // 2. Fetch từ vựng theo bộ
    useEffect(() => {
        if (!selectedSet) return;
        setLoading(true);
        api.get(`/admin/vocab-sets/${selectedSet}/words`)
            .then(res => setWords(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [selectedSet]);

    return (
        <div className="flex h-screen gap-6 p-6">
            {/* Cột trái: Bộ từ */}
            <div className="w-1/3 bg-white p-4 rounded-lg shadow">
                <div className="flex justify-between mb-4">
                    <h2 className="text-lg font-bold">📚 Bộ từ vựng</h2>
                    <button className="text-sm bg-blue-600 text-white px-3 py-1 rounded">+ Thêm bộ</button>
                </div>
                <div className="space-y-2">
                    {vocabSets.map(set => (
                        <button
                            key={set.id}
                            onClick={() => setSelectedSet(set.id)}
                            className={`w-full text-left p-3 rounded border transition ${
                                selectedSet === set.id ? 'bg-blue-50 border-blue-500 font-bold' : 'hover:bg-gray-50'
                            }`}
                        >
                            {set.title}
                        </button>
                    ))}
                </div>
            </div>

            {/* Cột phải: Danh sách từ */}
            <div className="w-2/3 bg-white p-4 rounded-lg shadow overflow-auto">
                {selectedSet ? (
                    <>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold">Chi tiết từ vựng</h2>
                            <button className="bg-green-600 text-white px-3 py-1 rounded text-sm">+ Thêm từ</button>
                        </div>
                        {loading ? (
                            <p className="text-center p-10">Đang tải...</p>
                        ) : (
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 uppercase text-xs text-gray-700">
                                    <tr>
                                        <th className="p-3">Từ</th>
                                        <th className="p-3">Loại</th>
                                        <th className="p-3">Nghĩa</th>
                                        <th className="p-3 text-center">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {words.map(w => (
                                        <tr key={w.id} className="border-b hover:bg-gray-50">
                                            <td className="p-3 font-semibold text-blue-600">{w.word}</td>
                                            <td className="p-3 italic">{w.wordType}</td>
                                            <td className="p-3">{w.meaning}</td>
                                            <td className="p-3 flex justify-center gap-2">
                                                <button className="text-blue-500 hover:underline">Sửa</button>
                                                <button className="text-red-500 hover:underline">Xóa</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </>
                ) : (
                    <div className="h-full flex items-center justify-center text-gray-400">
                         Chọn một bộ từ để quản lý
                    </div>
                )}
            </div>
        </div>
    );
}