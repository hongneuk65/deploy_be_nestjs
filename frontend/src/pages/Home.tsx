import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PageContainer from '../components/PageContainer';

export default function Home() {
  const { user } = useAuth();

  const features = [
    {
      number: '01',
      title: 'Thi thử',
      desc: 'Đề ETS chuẩn mới nhất, chấm điểm tự động và thống kê kết quả chi tiết.',
      to: '/exam',
    },
    {
      number: '02',
      title: 'AI Phân tích',
      desc: 'Phân tích điểm mạnh, điểm yếu và đề xuất lộ trình học cá nhân hóa.',
      to: '/analysis',
    },
    {
      number: '03',
      title: 'Từ vựng',
      desc: 'Học bằng Flashcard, lưu từ mới và ôn tập theo thuật toán thông minh.',
      to: '/vocab',
    },
    {
      number: '04',
      title: 'Lý thuyết',
      desc: 'Tổng hợp ngữ pháp, mẹo làm bài và chiến lược cho từng Part TOEIC.',
      to: '/grammar',
    },
  ];

  return (
    <PageContainer size='xl'>
      <div className="relative max-w-7xl mx-auto px-6 py-20">
        {/* Lớp mờ làm nền (Background Glow) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-64 bg-blue-400/10 blur-3xl rounded-full pointer-events-none"></div>

        {/* Hero Section */}
        <div className="relative text-center max-w-4xl mx-auto z-10">
          <span className="inline-block px-4 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-bold tracking-wide border border-blue-100 shadow-sm">
            TOEIC NEU
          </span>

          <h1 className="mt-8 text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight tracking-tight">
            Luyện TOEIC{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
              Hiệu Quả
            </span>
          </h1>

          <p className="mt-6 text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">
            Đề chuẩn ETS · Chấm điểm tự động · Phân tích AI · Hệ thống từ vựng
            và lộ trình học cá nhân hóa.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to={user ? '/exam' : '/login'}
              className="px-8 py-3.5 bg-blue-600 text-white font-semibold rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 hover:bg-blue-700 transition-all duration-200"
            >
              Bắt đầu thi thử
            </Link>

            <Link
              to="/grammar"
              className="px-8 py-3.5 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl shadow-sm hover:bg-gray-50 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              Xem tài liệu
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-28">
          {features.map((f) => (
            <Link
              key={f.title}
              to={f.to}
              className="group bg-white border border-gray-100 rounded-3xl p-8 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="text-6xl font-black text-slate-50 group-hover:text-blue-50 transition-colors duration-300">
                  {f.number}
                </div>

                <h3 className="mt-2 text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
                  {f.title}
                </h3>

                <p className="mt-3 text-sm text-gray-500 leading-relaxed">
                  {f.desc}
                </p>
              </div>

              <div className="mt-6 text-sm font-bold text-blue-600 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                Khám phá 
                <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20">
          <div className="bg-blue-50/50 rounded-3xl p-8 text-center border border-blue-100/50">
            <div className="text-4xl font-extrabold text-blue-600">200+</div>
            <div className="text-sm font-medium text-gray-600 mt-2">Đề TOEIC</div>
          </div>

          <div className="bg-blue-50/50 rounded-3xl p-8 text-center border border-blue-100/50">
            <div className="text-4xl font-extrabold text-blue-600">7</div>
            <div className="text-sm font-medium text-gray-600 mt-2">Part luyện tập</div>
          </div>

          <div className="bg-blue-50/50 rounded-3xl p-8 text-center border border-blue-100/50">
            <div className="text-4xl font-extrabold text-blue-600">AI</div>
            <div className="text-sm font-medium text-gray-600 mt-2">Phân tích kết quả</div>
          </div>

          <div className="bg-blue-50/50 rounded-3xl p-8 text-center border border-blue-100/50">
            <div className="text-4xl font-extrabold text-blue-600">24/7</div>
            <div className="text-sm font-medium text-gray-600 mt-2">Học mọi lúc</div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}