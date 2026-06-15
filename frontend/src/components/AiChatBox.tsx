import { useState, useEffect, useRef } from 'react';
import api from '../api/client';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Props {
  subQuestionId: string;
  attemptId: string;
}

export default function AiChatBox({ subQuestionId, attemptId }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Tải lịch sử chat khi mở
  useEffect(() => {
    if (!isOpen || messages.length > 0) return;
    api.get(`/ai-chat/${subQuestionId}/${attemptId}`)
      .then(r => setMessages(r.data.messages))
      .catch(() => {});
  }, [isOpen]);

  // Scroll xuống cuối khi có tin nhắn mới
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setLoading(true);
    
    try {
        console.log("checkkkkkkk",subQuestionId, attemptId, msg)
      const r = await api.post(`/ai-chat/${subQuestionId}`, {
        attemptId,
        message: msg,
      });
      setMessages(r.data.history);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại.',
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50 transition-colors"
        >
           Hỏi AI về câu này
          {messages.length > 0 && (
            <span className="bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded-full">
              {messages.length / 2}
            </span>
          )}
        </button>
      ) : (
        <div className="border border-blue-200 rounded-xl overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 text-white px-4 py-2 flex items-center justify-between">
            <span className="text-sm font-medium">Hỏi AI về câu này</span>
            <button onClick={() => setIsOpen(false)} className="text-blue-200 hover:text-white text-lg leading-none">×</button>
          </div>

          {/* Messages */}
          <div className="h-52 overflow-y-auto p-3 space-y-2 bg-gray-50">
            {messages.length === 0 && (
              <p className="text-xs text-gray-400 text-center mt-6">
                Hỏi bất kỳ điều gì về câu này — tại sao sai, ví dụ tương tự, phân tích ngữ pháp...
              </p>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] text-sm px-3 py-2 rounded-xl
                  ${m.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-white border text-gray-800 rounded-bl-sm shadow-sm'
                  }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border px-3 py-2 rounded-xl rounded-bl-sm shadow-sm">
                  <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-2 bg-white border-t flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Tại sao đáp án C sai?"
              className="flex-1 text-sm border rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm disabled:opacity-40 hover:bg-blue-700"
            >
              Gửi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}