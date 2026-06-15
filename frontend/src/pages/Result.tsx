import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../api/client';

export default function Result() {
  const { attemptId } = useParams();
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    apiClient.get(`/attempts/${attemptId}/result`).then(r => setResult(r.data));
  }, [attemptId]);

  if (!result) return <div className="p-8 text-center">Đang tải kết quả...</div>;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Kết Quả Bài Thi</h1>
      
      {/* Điểm tổng */}
      <div className="bg-blue-600 text-white rounded-2xl p-8 text-center mb-6">
        <p className="text-6xl font-bold">{result.totalScore}</p>
        <p className="text-blue-200 mt-1">/ 990</p>
      </div>

      {/* Listening + Reading */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {[
          { label: 'Listening', score: result.listeningScore, max: 495, color: 'blue' },
          { label: 'Reading', score: result.readingScore, max: 495, color: 'green' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border p-4">
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className="text-3xl font-bold mt-1">{s.score}</p>
            <div className="bg-gray-100 rounded-full h-2 mt-2">
              <div
                className={`bg-${s.color}-500 h-2 rounded-full`}
                style={{ width: `${(s.score / s.max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Bảng từng Part */}
      <div className="bg-white rounded-xl border overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left">Part</th>
              <th className="p-3 text-right">Đúng</th>
              <th className="p-3 text-right">% Chính xác</th>
            </tr>
          </thead>
          <tbody>
            {result.partBreakdown?.map((p: any) => (
              <tr key={p.partNumber} className="border-t">
                <td className="p-3">Part {p.partNumber}</td>
                <td className="p-3 text-right">{p.correct}/{p.total}</td>
                <td className="p-3 text-right">
                  <span className={`font-medium ${p.accuracy >= 70 ? 'text-green-600' : p.accuracy >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                    {p.accuracy}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Nút hành động */}
      <div className="flex gap-3">
        <Link to={`/review/${attemptId}`} className="flex-1 bg-blue-600 text-white text-center py-3 rounded-xl font-medium">
          Xem bài chữa
        </Link>
        <Link to="/exam" className="flex-1 border text-center py-3 rounded-xl font-medium">
          Thi lại
        </Link>
      </div>
    </div>
  );
}