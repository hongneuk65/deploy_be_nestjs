import { useState, useRef, useEffect } from 'react';
import apiClient from '../api/client';

export function useAiAnalysis() {
  const [data, setData] = useState<any>(null);
  const [status, setStatus] = useState<'idle' | 'processing' | 'done' | 'error' | 'none'>('idle');
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  // 1. Hàm này CHỈ CHẠY 1 LẦN DUY NHẤT khi mới mở trang để load data cũ
  useEffect(() => {
    apiClient.get('/analysis/global/status')
      .then(res => {
        setStatus(res.data.status);
        if (res.data.status === 'done') setData(res.data.data);
      })
      .catch(() => setStatus('error'));

    // Dọn dẹp interval nếu user tắt/chuyển trang giữa chừng
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // 2. Hàm này CHỈ ĐƯỢC KÍCH HOẠT KHI BẤM NÚT
  const triggerAnalysis = async () => {
    if (status === 'processing') return;
    setStatus('processing');
    
    try {
      // Đợi lệnh gọi AI bắt đầu thành công
      await apiClient.post('/analysis/global/trigger');

      // Chống spam: xóa interval cũ nếu user bấm đúp nút liên tục
      if (intervalRef.current) clearInterval(intervalRef.current);

      // Bắt đầu vòng lặp polling 3 giây/lần để chờ kết quả
      intervalRef.current = setInterval(async () => {
        try {
          const res = await apiClient.get('/analysis/global/status');
          
          if (res.data.status === 'done') {
            setData(res.data.data);
            setStatus('done');
            clearInterval(intervalRef.current);
          } else if (res.data.status === 'error' || res.data.status === 'none') {
            setStatus(res.data.status === 'none' ? 'idle' : 'error');
            clearInterval(intervalRef.current);
          }
        } catch {
          setStatus('error');
          clearInterval(intervalRef.current);
        }
      }, 3000);

    } catch (error) {
      console.error('Lỗi khi gọi trigger API:', error);
      setStatus('error');
    }
  };

  return { data, status, triggerAnalysis };
}