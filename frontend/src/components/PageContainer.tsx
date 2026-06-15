import type { ReactNode } from 'react';

type Size = 'sm' | 'md' | 'lg' | 'xl' | 'full';

const SIZE_MAP: Record<Size, string> = {
    sm: 'max-w-lg',      // Form đơn giản: Login, Settings (đã có wrapper riêng)
    md: 'max-w-2xl',     // Trang đọc nội dung: Profile, Grammar detail, Review
    lg: 'max-w-4xl',     // Trang list vừa: Vocab, History
    xl: 'max-w-6xl',     // Trang dashboard nhiều cột: Admin, Home
    full: 'max-w-none',  // Không giới hạn: ExamRoom, bảng dữ liệu lớn
};

interface Props {
    size?: Size;
    children: ReactNode;
    className?: string;
}

export default function PageContainer({ size = 'md', children, className = '' }: Props) {
    return (
        <div className={`${SIZE_MAP[size]} mx-auto px-4 sm:px-6 lg:px-8 py-6 ${className}`}>
            {children}
        </div>
    );
}