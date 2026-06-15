import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

interface VocabSet {
  id: string;
  title: string;
  description: string | null;
  totalWords: number;
  knownWords: number;
  isOwner?: boolean;
}

interface Stats {
  system: { known: number; total: number };
  personal: { known: number; total: number };
}

interface WordItem {
  word: string;
  meaning: string;
  pronunciation?: string;
  example?: string;
}

const emptyWord = (): WordItem => ({ word: '', meaning: '', example: '' });

export default function VocabHome() {
  const navigate = useNavigate();

  const [sets, setSets] = useState<VocabSet[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);

  const [activeTab, setActiveTab] = useState<'chung' | 'mine'>('chung');
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // --- State tìm kiếm & phân trang ---
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 9;

  // --- State cho Modal ---
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [setName, setSetName] = useState('');

  const [inputMode, setInputMode] = useState<'manual' | 'bulk'>('manual');
  const [bulkText, setBulkText] = useState('');
  const [wordList, setWordList] = useState<WordItem[]>([emptyWord()]);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      api.get('/vocab/sets'),
      api.get('/vocab/stats'),
    ]).then(([setsRes, statsRes]) => {
      setSets(setsRes.data);
      setStats(statsRes.data);
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- XỬ LÝ TÌM KIẾM & PHÂN TRANG ---
  const myFilteredSets = sets.filter(s => s.isOwner);

  const filteredSets = sets.filter(set =>
    set.title.toLowerCase().includes(search.toLowerCase())
  );

  const filteredMineSets = myFilteredSets.filter(set =>
    set.title.toLowerCase().includes(search.toLowerCase())
  );

  const displaySets = activeTab === 'mine' ? filteredMineSets : filteredSets;
  const totalPages = Math.ceil(displaySets.length / ITEMS_PER_PAGE);
  const paginatedSets = displaySets.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // --- XỬ LÝ NHẬP ---
  const handleAddRow = () => {
    setWordList(prev => [...prev, emptyWord()]);
  };

  const handleWordChange = (index: number, field: keyof WordItem, value: string) => {
    setWordList(prev => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const handleRemoveRow = (index: number) => {
    if (wordList.length === 1) return;
    setWordList(prev => prev.filter((_, i) => i !== index));
  };

  // --- XỬ LÝ NHẬP HÀNG LOẠT VÀ AI ---
  const handleParseBulk = async () => {
    if (!bulkText.trim()) return alert('Vui lòng nhập danh sách từ!');

    const rawWords = bulkText.split('\n')
      .map(line => line.split(/[:\-]/)[0].trim())
      .filter(w => w.length > 0);

    if (rawWords.length === 0) return;

    setIsAiGenerating(true);
    try {
      const res = await api.post('/vocab/ai-generate', { words: rawWords });

      if (res.data && Array.isArray(res.data)) {
        setWordList(res.data.map((w: Partial<WordItem>) => ({
          word: w.word || '',
          meaning: w.meaning || '',
          pronunciation: w.pronunciation || '',
          example: w.example || '',
        })));
        setInputMode('manual');
      }
    } catch (error) {
      alert('Lỗi khi AI xử lý từ vựng. Vui lòng thử lại.');
      console.error(error);
    } finally {
      setIsAiGenerating(false);
    }
  };

  // --- SUBMIT LƯU DB ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validWords = wordList.filter(w => w.word.trim() && w.meaning.trim());

    if (validWords.length === 0) {
      return alert('Vui lòng nhập ít nhất 1 từ vựng (kèm nghĩa)!');
    }

    setIsSubmitting(true);
    try {
      await api.post('/vocab/create-set', {
        title: setName.trim() || 'Bộ từ chưa đặt tên',
        words: validWords,
      });

      setSetName('');
      setBulkText('');
      setWordList([emptyWord()]);
      setInputMode('manual');
      setShowModal(false);
      fetchData();
    } catch (error) {
      alert('Có lỗi xảy ra khi lưu bộ từ!');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- XÓA BỘ TỪ ---
  const handleDeleteSet = async (e: React.MouseEvent, setId: string) => {
    e.stopPropagation();
    if (!confirm('Bạn có chắc muốn xóa bộ từ này? Hành động này không thể hoàn tác.')) return;

    setDeletingId(setId);
    try {
      await api.delete(`/vocab/sets/${setId}`);
      setSets(prev => prev.filter(s => s.id !== setId));
    } catch (error) {
      alert('Có lỗi xảy ra khi xóa bộ từ!');
      console.error(error);
    } finally {
      setDeletingId(null);
    }
  };

  const goToFlashcard = (setId: string) => {
    navigate(`/vocab/sets/${setId}`);
  };

  const renderSetItem = (set: VocabSet) => (
    <div
      key={set.id}
      onClick={() => goToFlashcard(set.id)}
      className="relative bg-white border border-gray-100 rounded-3xl p-5 cursor-pointer hover:shadow-md transition-all flex flex-col justify-between"
    >
      <div>
        {set.isOwner && (
          <span className="absolute top-4 right-4 text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
            Của bạn
          </span>
        )}

        <h3 className="font-semibold text-gray-900 pr-16 line-clamp-1">
          {set.title}
        </h3>

        <p className="text-sm text-gray-500 mt-2 line-clamp-2 min-h-[40px]">
          {set.description || 'Bộ từ vựng TOEIC'}
        </p>
      </div>

      <div className="mt-5 pt-4 border-t border-gray-100">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Tiến độ</span>
          <span className="font-medium">
            {set.knownWords}/{set.totalWords}
          </span>
        </div>

        <div className="w-full h-2 bg-gray-100 rounded-full mt-2 overflow-hidden">
          <div
            className="h-2 bg-blue-600 rounded-full transition-all duration-300"
            style={{ width: `${set.totalWords ? (set.knownWords / set.totalWords) * 100 : 0}%` }}
          />
        </div>
      </div>

      {set.isOwner && (
        <button
          onClick={(e) => handleDeleteSet(e, set.id)}
          disabled={deletingId === set.id}
          className="mt-4 w-full border border-red-100 text-red-600 rounded-xl py-2 text-sm hover:bg-red-50 disabled:opacity-50 transition-colors"
        >
          {deletingId === set.id ? 'Đang xóa...' : 'Xóa bộ từ'}
        </button>
      )}
    </div>
  );

  if (loading) return <div className="p-8 text-center">Đang tải...</div>;

  return (
    <div className="max-w-5xl mx-auto p-6 relative">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold mb-2">Từ Vựng</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm transition-colors"
        >
          + Tạo bộ từ mới
        </button>
      </div>

      {/* Thống kê */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-blue-50 rounded-xl p-4">
            <p className="text-sm text-blue-600">Từ hệ thống đã học</p>
            <p className="text-2xl font-bold text-blue-700 mt-1">
              {stats.system.known}
              <span className="text-sm font-normal text-blue-400">/{stats.system.total}</span>
            </p>
          </div>
          <div className="bg-purple-50 rounded-xl p-4">
            <p className="text-sm text-purple-600">Từ bạn đóng góp</p>
            <p className="text-2xl font-bold text-purple-700 mt-1">
              {stats.personal.total}
              <span className="text-sm font-normal text-purple-400"> từ</span>
            </p>
          </div>
        </div>
      )}

      {/* Thanh tìm kiếm */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Tìm bộ từ vựng..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full border border-gray-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b mb-5">
        {[
          { key: 'chung', label: 'Tất cả bộ từ' },
          { key: 'mine', label: 'Do bạn tạo' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key as 'chung' | 'mine');
              setCurrentPage(1); // Reset trang khi đổi tab
            }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors
              ${activeTab === tab.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div>
        {displaySets.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-3xl p-10 text-center text-gray-400 shadow-sm">
            Không tìm thấy bộ từ nào
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedSets.map(renderSetItem)}
            </div>

            {/* Phân trang */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border rounded-xl disabled:opacity-40 hover:bg-gray-50 transition-colors"
                >
                  Trước
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .slice(Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2))
                  .map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-10 h-10 rounded-xl transition-colors ${
                        page === currentPage ? 'bg-blue-600 text-white shadow-sm' : 'border hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border rounded-xl disabled:opacity-40 hover:bg-gray-50 transition-colors"
                >
                  Sau
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* MODAL THÊM TỪ */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Thêm bộ từ mới (Công khai)</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-black">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
              <div className="mb-4 shrink-0">
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên bộ từ</label>
                <input
                  type="text"
                  value={setName}
                  onChange={(e) => setSetName(e.target.value)}
                  placeholder="VD: Từ vựng IELTS tuần 1..."
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="flex border-b mb-4 shrink-0">
                <button type="button" onClick={() => setInputMode('manual')} className={`px-4 py-2 text-sm font-medium border-b-2 ${inputMode === 'manual' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>
                  Nhập thủ công
                </button>
                <button type="button" onClick={() => setInputMode('bulk')} className={`px-4 py-2 text-sm font-medium border-b-2 ${inputMode === 'bulk' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>
                  Nhập hàng loạt bằng AI
                </button>
              </div>

              {inputMode === 'bulk' && (
                <div className="flex-1 flex flex-col min-h-[300px]">
                  <p className="text-xs text-gray-500 mb-2">Dán danh sách từ vựng vào đây (mỗi từ 1 dòng). AI sẽ tự động điền nghĩa, phiên âm và ví dụ.</p>
                  <textarea
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    placeholder="apple&#10;banana&#10;hello..."
                    className="flex-1 w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleParseBulk}
                    disabled={isAiGenerating}
                    className="mt-3 bg-purple-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                  >
                    {isAiGenerating ? 'AI đang phân tích...' : ' Phân tích & Tạo bằng AI'}
                  </button>
                </div>
              )}

              {inputMode === 'manual' && (
                <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4 custom-scrollbar">
                  {wordList.map((item, index) => (
                    <div key={index} className="bg-gray-50 border rounded-xl p-3 relative group">
                      <button type="button" onClick={() => handleRemoveRow(index)} className="absolute top-2 right-2 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">✕</button>

                      <div className="grid grid-cols-2 gap-3 mb-2">
                        <input
                          type="text"
                          placeholder="Từ tiếng Anh"
                          required
                          value={item.word}
                          onChange={(e) => handleWordChange(index, 'word', e.target.value)}
                          className="border rounded-lg px-3 py-2 text-sm font-bold text-blue-700 outline-none focus:border-blue-400"
                        />
                        <input
                          type="text"
                          placeholder="Nghĩa tiếng Việt"
                          required
                          value={item.meaning}
                          onChange={(e) => handleWordChange(index, 'meaning', e.target.value)}
                          className="border rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
                        />
                      </div>

                      <input
                        type="text"
                        placeholder="Ví dụ tiếng Anh (tùy chọn)"
                        value={item.example || ''}
                        onChange={(e) => handleWordChange(index, 'example', e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 text-xs text-gray-600 italic outline-none focus:border-blue-400"
                      />
                    </div>
                  ))}

                  <button type="button" onClick={handleAddRow} className="w-full border-2 border-dashed border-gray-300 rounded-xl py-3 text-sm text-gray-500 font-medium hover:bg-gray-50 hover:border-blue-400 transition-colors">
                    + Thêm một từ
                  </button>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t shrink-0">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors">
                  Hủy
                </button>
                <button type="submit" disabled={isSubmitting || isAiGenerating} className="flex-1 bg-blue-600 text-white rounded-xl py-2.5 text-sm font-medium disabled:opacity-50 hover:bg-blue-700 transition-colors">
                  {isSubmitting ? 'Đang lưu...' : `Đăng lên hệ thống (${wordList.filter(w => w.word.trim()).length} từ)`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}