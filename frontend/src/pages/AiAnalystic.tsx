import { Link } from 'react-router-dom';
import { useAiAnalysis } from '../hooks/useAiAnalysis';

export default function AiAnalysis() {
    const { data: aiData, status: aiStatus, triggerAnalysis } = useAiAnalysis();

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-6">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        AI Learning Coach
                    </h1>
                    <p className="text-gray-500 mt-2">
                        Đánh giá năng lực TOEIC dựa trên lịch sử làm bài và đề xuất lộ trình học tập cá nhân hóa.
                    </p>
                </div>

                {(aiStatus === 'done' || aiStatus === 'error') && (
                    <button
                        onClick={triggerAnalysis}
                        className="px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-all"
                    >
                        Cập nhật phân tích
                    </button>
                )}
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">

                {aiStatus === 'idle' || aiStatus === 'none' ? (
                    <div className="text-center py-16">

                        <h2 className="text-2xl font-bold text-gray-900 mb-3">
                            Chưa có báo cáo phân tích
                        </h2>

                        <p className="text-gray-500 max-w-lg mx-auto mb-8">
                            Hệ thống sẽ tổng hợp kết quả làm bài, xác định điểm mạnh,
                            điểm yếu và đề xuất kế hoạch học tập phù hợp với bạn.
                        </p>

                        <button
                            onClick={triggerAnalysis}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold transition-colors"
                        >
                            Bắt đầu phân tích
                        </button>
                    </div>

                ) : aiStatus === 'processing' ? (

                    <div className="space-y-5 animate-pulse py-4">
                        <div className="h-5 bg-gray-200 rounded w-1/3 mx-auto mb-8" />

                        {[1, 2, 3, 4].map((i) => (
                            <div
                                key={i}
                                className="h-24 bg-gray-100 rounded-2xl"
                            />
                        ))}
                    </div>

                ) : aiStatus === 'done' && aiData ? (

                    <div className="grid gap-5">

                        <div className="bg-green-50 border border-green-100 rounded-2xl p-6">
                            <h3 className="font-semibold text-green-800 mb-3">
                                Điểm mạnh
                            </h3>
                            <p className="text-green-900 leading-relaxed">
                                {aiData.strengths}
                            </p>
                        </div>

                        <div className="bg-red-50 border border-red-100 rounded-2xl p-6">
                            <h3 className="font-semibold text-red-800 mb-3">
                                Điểm cần cải thiện
                            </h3>
                            <p className="text-red-900 leading-relaxed">
                                {aiData.weaknesses}
                            </p>
                        </div>

                        {aiData.topErrors?.length > 0 && (
                            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
                                <h3 className="font-semibold text-blue-800 mb-3">
                                    Các lỗi sai thường gặp
                                </h3>

                                <ul className="space-y-2">
                                    {aiData.topErrors.map((error: string, index: number) => (
                                        <li key={index} className="text-blue-900">
                                            • {error}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6">
                            <h3 className="font-semibold text-amber-800 mb-3">
                                Lộ trình đề xuất
                            </h3>
                            <p className="text-amber-900 leading-relaxed">
                                {aiData.suggestion}
                            </p>
                        </div>

                    </div>

                ) : (

                    <div className="text-center py-14">
                        <h2 className="text-lg font-semibold text-gray-900 mb-2">
                            Chưa đủ dữ liệu để phân tích
                        </h2>

                        <p className="text-gray-500 mb-6">
                            Hãy hoàn thành thêm các bài thi để hệ thống có đủ dữ liệu đánh giá.
                        </p>

                        <Link
                            to="/exam"
                            className="text-blue-600 font-medium hover:text-blue-700"
                        >
                            Đi tới phòng thi
                        </Link>
                    </div>

                )}
            </div>
        </div>
    );
}