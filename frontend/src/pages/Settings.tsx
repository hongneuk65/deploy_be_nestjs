
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const [pwForm, setPwForm] = useState({
        old: '',
        new: '',
        confirm: '',
    });

    const [pwError, setPwError] = useState('');
    const [pwSuccess, setPwSuccess] = useState('');
    const [pwLoading, setPwLoading] = useState(false);

    const changePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (pwForm.new !== pwForm.confirm) {
            setPwError('Mật khẩu xác nhận không khớp');
            return;
        }

        if (pwForm.new.length < 6) {
            setPwError('Mật khẩu mới phải có ít nhất 6 ký tự');
            return;
        }

        setPwLoading(true);
        setPwError('');
        setPwSuccess('');

        try {
            await api.patch('/auth/change-password', {
                oldPassword: pwForm.old,
                newPassword: pwForm.new,
            });

            setPwSuccess('Mật khẩu đã được cập nhật thành công.');

            setPwForm({
                old: '',
                new: '',
                confirm: '',
            });
        } catch (e: any) {
            setPwError(
                e.response?.data?.message ||
                'Không thể đổi mật khẩu.'
            );
        } finally {
            setPwLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="max-w-3xl mx-auto p-6 space-y-6">

            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    to="/profile"
                    className="text-gray-400 hover:text-gray-700 transition-colors"
                >
                    ←
                </Link>

                <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        Cài đặt tài khoản
                    </h1>

                    <p className="text-gray-500 mt-1">
                        Quản lý mật khẩu và các tùy chọn bảo mật.
                    </p>
                </div>
            </div>

            {/* Password Card */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">

                <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">
                        Đổi mật khẩu
                    </h2>

                    <p className="text-sm text-gray-500 mt-1">
                        Để bảo vệ tài khoản, hãy sử dụng mật khẩu mạnh và không chia sẻ với người khác.
                    </p>
                </div>

                {pwSuccess && (
                    <div className="mb-5 bg-green-50 border border-green-100 text-green-700 px-4 py-3 rounded-2xl text-sm">
                        {pwSuccess}
                    </div>
                )}

                {pwError && (
                    <div className="mb-5 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl text-sm">
                        {pwError}
                    </div>
                )}

                <form
                    onSubmit={changePassword}
                    className="space-y-5"
                >
                    {[
                        {
                            key: 'old',
                            label: 'Mật khẩu hiện tại',
                            placeholder: 'Nhập mật khẩu hiện tại',
                        },
                        {
                            key: 'new',
                            label: 'Mật khẩu mới',
                            placeholder: 'Ít nhất 6 ký tự',
                        },
                        {
                            key: 'confirm',
                            label: 'Xác nhận mật khẩu mới',
                            placeholder: 'Nhập lại mật khẩu mới',
                        },
                    ].map((field) => (
                        <div key={field.key}>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {field.label}
                            </label>

                            <input
                                type="password"
                                required
                                placeholder={field.placeholder}
                                value={(pwForm as any)[field.key]}
                                onChange={(e) =>
                                    setPwForm((prev) => ({
                                        ...prev,
                                        [field.key]: e.target.value,
                                    }))
                                }
                                className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    ))}

                    <button
                        type="submit"
                        disabled={pwLoading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
                    >
                        {pwLoading
                            ? 'Đang cập nhật...'
                            : 'Cập nhật mật khẩu'}
                    </button>
                </form>
            </div>

            {/* Security Info */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                <h3 className="font-semibold text-gray-900 mb-2">
                    Bảo mật tài khoản
                </h3>

                <p className="text-sm text-gray-500 leading-relaxed">
                    Thường xuyên thay đổi mật khẩu và không sử dụng cùng một mật khẩu
                    cho nhiều dịch vụ khác nhau để tăng cường bảo mật.
                </p>
            </div>

            {/* Logout */}
            <button
                onClick={handleLogout}
                className="w-full bg-white border border-red-200 text-red-600 rounded-3xl p-4 font-medium hover:bg-red-50 transition-colors"
            >
                Đăng xuất
            </button>

        </div>
    );
}

