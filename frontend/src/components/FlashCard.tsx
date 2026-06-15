import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';

interface VocabItem {
  id: string;
  word: string;
  meaning: string;
  status: string;
}

interface SetData {
  set: {
    id: string;
    title: string;
    description: string | null;
  };
  vocabs: VocabItem[];
}

export default function FlashCard() {
  const { setId } = useParams<{ setId: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<SetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    if (!setId) {
      navigate('/vocab');
      return;
    }

    const fetchSetDetail = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/vocab/sets/${setId}`);
        setData(response.data);
      } catch (err: any) {
        console.error('Lỗi tải bộ từ:', err);
        setError('Không thể tải dữ liệu bộ từ này.');
      } finally {
        setLoading(false);
      }
    };

    fetchSetDetail();
  }, [setId, navigate]);

  const handleFlip = () => setIsFlipped(prev => !prev);

  const handleNext = () => {
    if (!data) return;
    setIsFlipped(false);
    setCurrentIndex(prev => (prev + 1) % data.vocabs.length);
  };

  const handlePrev = () => {
    if (!data) return;
    setIsFlipped(false);
    setCurrentIndex(prev => (prev - 1 + data.vocabs.length) % data.vocabs.length);
  };

  if (loading) return <div className="p-8 text-center">Đang tải dữ liệu bộ từ...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!data) return <div className="p-8 text-center">Không tìm thấy dữ liệu.</div>;

  const vocabs = data.vocabs;
  const current = vocabs[currentIndex];

  return (
    <div className="max-w-2xl mx-auto p-6">
      <button onClick={() => navigate(-1)} className="mb-4 text-blue-600 hover:underline">
        ← Quay lại
      </button>

      <h1 className="text-2xl font-bold">{data.set.title}</h1>
      {data.set.description && <p className="text-gray-600 mb-6">{data.set.description}</p>}

      {vocabs.length === 0 ? (
        <p className="text-gray-400 mt-6">Bộ từ này chưa có từ vựng nào.</p>
      ) : (
        <div className="mt-6 flex flex-col items-center">
          <p className="text-sm text-gray-500 mb-3">{currentIndex + 1} / {vocabs.length}</p>

          {/* Flashcard */}
          <div
            onClick={handleFlip}
            className="w-full h-64 cursor-pointer select-none"
            style={{ perspective: '1000px' }}
          >
            <div
              className="relative w-full h-full transition-transform duration-500"
              style={{
                transformStyle: 'preserve-3d',
                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              }}
            >
              {/* Mặt trước: từ */}
              <div
                className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border bg-white shadow-md"
                style={{ backfaceVisibility: 'hidden' }}
              >
                <p className="text-3xl font-bold text-blue-700">{current.word}</p>
                <p className="text-sm text-gray-400 mt-3">Nhấn để xem nghĩa</p>
              </div>

              {/* Mặt sau: nghĩa */}
              <div
                className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border bg-blue-50 shadow-md"
                style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
              >
                <p className="text-2xl font-semibold text-gray-800 px-6 text-center">{current.meaning}</p>
                <p className="text-sm text-gray-400 mt-3">Nhấn để xem từ</p>
              </div>
            </div>
          </div>

          {/* Điều hướng */}
          <div className="flex gap-3 mt-6 w-full">
            <button
              onClick={handlePrev}
              className="flex-1 border rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50"
            >
              ← Trước
            </button>
            <button
              onClick={handleNext}
              className="flex-1 bg-blue-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-blue-700"
            >
              Tiếp →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}