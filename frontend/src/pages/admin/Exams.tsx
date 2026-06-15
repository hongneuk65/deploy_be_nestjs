import { useEffect, useState } from 'react';
import api from '../../api/client';

interface Exam {
    id: string;
    title: string;
    createdAt: string;
    isActive: boolean;
    _count: { parts: number };
}

export default function AdminExams() {
    const [exams, setExams] = useState<Exam[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchExams = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/exams');
            setExams(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchExams(); }, []);

    const toggleActive = async (id: string, currentStatus: boolean) => {
        try {
            await api.patch(`/admin/exams/${id}`, { isActive: !currentStatus });
            // Cập nhật local state thay vì fetch lại toàn bộ list để tăng tốc
            setExams(prev => prev.map(ex => ex.id === id ? { ...ex, isActive: !currentStatus } : ex));
        } catch (err) {
            alert('Lỗi cập nhật trạng thái');
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">📝 Quản lý Đề thi</h1>
                <button className="bg-green-600 text-white px-4 py-2 rounded font-bold hover:bg-green-700">
                    + Thêm đề mới
                </button>
            </div>

            {loading ? (
                <div className="text-center py-10 text-gray-500">Đang tải danh sách đề...</div>
            ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                            <tr>
                                <th className="p-4">Tên đề</th>
                                <th className="p-4">Số phần (Parts)</th>
                                <th className="p-4">Ngày tạo</th>
                                <th className="p-4">Trạng thái</th>
                                <th className="p-4 text-center">Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {exams.map(ex => (
                                <tr key={ex.id} className="border-t hover:bg-gray-50">
                                    <td className="p-4 font-medium text-blue-600">{ex.title}</td>
                                    <td className="p-4">{ex._count.parts} parts</td>
                                    <td className="p-4">{new Date(ex.createdAt).toLocaleDateString()}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${ex.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {ex.isActive ? 'Đang hiển thị' : 'Đang ẩn'}
                                        </span>
                                    </td>
                                    <td className="p-4 flex justify-center gap-2">
                                        <button 
                                            onClick={() => toggleActive(ex.id, ex.isActive)}
                                            className={`px-3 py-1 rounded text-white text-xs ${ex.isActive ? 'bg-gray-500' : 'bg-green-600'}`}
                                        >
                                            {ex.isActive ? 'Ẩn' : 'Hiện'}
                                        </button>
                                        <button className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600">
                                            Sửa
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}