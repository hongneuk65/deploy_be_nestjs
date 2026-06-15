import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, attemptsToday: 0, exams: 0, missingExplanation: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/admin/stats').then(res => setStats(res.data)).catch(console.error);
  }, []);

  const cards = [
    { label: 'Tổng Người Dùng', val: stats.users, color: 'blue', route: '/admin/users' },
    { label: 'Lượt Thi Hôm Nay', val: stats.attemptsToday, color: 'green', route: '/admin/exams' },
    { label: 'Đề Thi Active', val: stats.exams, color: 'purple', route: '/admin/exams' },
    { label: 'Câu Thiếu Giải Thích', val: stats.missingExplanation, color: 'red', route: '/admin/questions' },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">📊 Thống kê hệ thống</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div 
            key={card.label}
            onClick={() => navigate(card.route)}
            className={`p-4 bg-white shadow rounded-lg border-l-4 border-${card.color}-500 cursor-pointer hover:shadow-lg transition-shadow`}
          >
            <p className="text-gray-500 text-sm">{card.label}</p>
            <p className={`text-3xl font-bold text-${card.color}-600`}>{card.val}</p>
          </div>
        ))}
      </div>

      {/* Gợi ý: Đây là nơi bạn có thể thêm biểu đồ tăng trưởng */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-bold mb-4">📈 Xu hướng luyện thi</h2>
        <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-200 rounded text-gray-400">
           [Biểu đồ Activity Chart sẽ hiển thị tại đây]
        </div>
      </div>
    </div>
  );
}