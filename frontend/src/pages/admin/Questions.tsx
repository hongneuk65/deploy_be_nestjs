import { useEffect, useState } from 'react';
import api from '../../api/client';

export default function AdminQuestions() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const fetchQuestions = async () => {
    try {
      const res = await api.get('/admin/questions?limit=50');
      setQuestions(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => { fetchQuestions(); }, []);

  const handleSave = async (id: string) => {
    try {
      await api.patch(`/admin/questions/${id}/explanation`, { explanation: editContent });
      setEditingId(null);
      fetchQuestions(); // Reload
    } catch (error) {
      alert('Lỗi lưu giải thích');
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">❓ Quản lý Giải thích câu hỏi</h1>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-4 w-1/4">ID Câu hỏi</th>
              <th className="p-4 w-1/2">Giải thích (Explanation)</th>
              <th className="p-4 w-1/4">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {questions.map(q => (
              <tr key={q.id} className="border-t">
                <td className="p-4 font-mono text-xs">{q.id}</td>
                <td className="p-4">
                  {editingId === q.id ? (
                    <textarea
                      className="w-full p-2 border rounded"
                      rows={3}
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                    />
                  ) : (
                    <div className="text-gray-600 line-clamp-2">
                      {q.explanation || <span className="text-red-400 italic">Chưa có giải thích</span>}
                    </div>
                  )}
                </td>
                <td className="p-4">
                  {editingId === q.id ? (
                    <div className="space-x-2">
                      <button onClick={() => handleSave(q.id)} className="px-3 py-1 bg-green-600 text-white rounded">Lưu</button>
                      <button onClick={() => setEditingId(null)} className="px-3 py-1 bg-gray-400 text-white rounded">Hủy</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setEditingId(q.id); setEditContent(q.explanation || ''); }}
                      className="px-3 py-1 bg-blue-600 text-white rounded"
                    >
                      Sửa
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}