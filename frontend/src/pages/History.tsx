import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

export default function History() {
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/attempts/history/me')
      .then(res => setAttempts(res.data))
      .catch(err => console.error('Lỗi tải lịch sử:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="mt-20 flex justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Lịch Sử Thi</h1>
        <span className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-medium">
          Đã hoàn thành: {attempts.length} bài
        </span>
      </div>

      {attempts.length === 0 ? (
        <div className="bg-white rounded-2xl border p-10 text-center">
          <div className="text-5xl mb-4">📭</div>
          <h2 className="text-xl font-bold mb-2">Chưa có dữ liệu</h2>
          <p className="text-gray-500 mb-6">Bạn chưa hoàn thành bài thi nào. Hãy bắt đầu làm bài để theo dõi tiến độ.</p>
          <Link to="/exam" className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-colors">
            Đến phòng thi ngay
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {attempts.map(attempt => (
            <div key={attempt.id} className="bg-white rounded-2xl border p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-sm transition-shadow">
              
              {/* Thông tin bài thi */}
              <div>
                <h3 className="font-bold text-lg text-gray-800">
                  {attempt.exam?.title || 'Bài thi TOEIC'}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Nộp lúc: {new Date(attempt.submittedAt).toLocaleString('vi-VN')}
                </p>
                
                {/* Điểm số */}
                <div className="flex gap-4 mt-3 text-sm bg-gray-50 w-fit px-3 py-1.5 rounded-lg border">
                  <span className="text-green-700 font-medium">Listening: {attempt.listeningScore}</span>
                  <span className="text-blue-700 font-medium">Reading: {attempt.readingScore}</span>
                  <span className="text-red-600 font-bold ml-2">Tổng: {attempt.totalScore}</span>
                </div>
              </div>

              {/* Nút thao tác */}
              <div className="flex gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 mt-2 md:mt-0">
                <Link 
                  to={`/result/${attempt.id}`} 
                  className="flex-1 md:flex-none text-center px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  Tổng quan
                </Link>
                <Link 
                  to={`/review/${attempt.id}`} 
                  className="flex-1 md:flex-none text-center px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-sm font-medium hover:bg-blue-100 transition-colors"
                >
                  Chữa bài chi tiết
                </Link>
              </div>
              
            </div>
          ))}
        </div>
      )}
    </div>
  );
}