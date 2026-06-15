
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const navLinks = [
        { to: '/', label: 'Tổng quan' },
        { to: '/exam', label: 'Thi thử' },
        { to: '/vocab', label: 'Từ vựng' },
        { to: '/grammar', label: 'Ngữ pháp' },
        { to: '/history', label: 'Lịch sử' },
    ];

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isFullScreenPage =
        location.pathname.startsWith('/exam/') &&
        location.pathname !== '/exam';

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">

            {/* Navbar */}
            <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    <div className="h-16 flex items-center justify-between">

                        {/* Logo */}
                        <Link
                            to="/"
                            className="flex items-center gap-3 shrink-0"
                        >
                            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                                <span className="text-white font-bold text-sm">
                                    NEU
                                </span>
                            </div>

                            <div>
                                <h1 className="font-bold text-gray-900 leading-none">
                                    TOEIC NEU
                                </h1>

                                <p className="text-xs text-gray-500 mt-1">
                                    Nền tảng luyện thi TOEIC
                                </p>
                            </div>
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center gap-1">

                            {navLinks.map((link) => {
                                const active =
                                    link.to === '/'
                                        ? location.pathname === '/'
                                        : location.pathname.startsWith(link.to);

                                return (
                                    <Link
                                        key={link.to}
                                        to={link.to}
                                        className={`px-4 py-2 rounded-xl text-sm transition-all ${
                                            active
                                                ? 'bg-blue-50 text-blue-600 font-medium'
                                                : 'text-gray-600 hover:bg-gray-100'
                                        }`}
                                    >
                                        {link.label}
                                    </Link>
                                );
                            })}

                        </div>

                        {/* User Section */}
                        <div className="flex items-center gap-3">

                            <Link
                                to="/profile"
                                className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-gray-50 transition-colors"
                            >
                                {user?.avatarUrl ? (
                                    <img
                                        src={user.avatarUrl}
                                        alt={user.name}
                                        className="w-9 h-9 rounded-full object-cover border border-gray-200"
                                    />
                                ) : (
                                    <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-semibold text-sm">
                                        {user?.name?.[0]?.toUpperCase()}
                                    </div>
                                )}

                                <div className="hidden md:block">
                                    <p className="text-sm font-medium text-gray-900">
                                        {user?.name}
                                    </p>

                                    <p className="text-xs text-gray-400">
                                        Học viên
                                    </p>
                                </div>
                            </Link>

                            <button
                                onClick={handleLogout}
                                className="hidden md:block text-sm text-gray-500 hover:text-red-600 transition-colors"
                            >
                                Đăng xuất
                            </button>

                        </div>
                    </div>
                </div>

                {/* Mobile Navigation */}
                <div className="md:hidden border-t border-gray-100">

                    <div className="grid grid-cols-5">

                        {navLinks.map((link) => {
                            const active =
                                link.to === '/'
                                    ? location.pathname === '/'
                                    : location.pathname.startsWith(link.to);

                            return (
                                <Link
                                    key={link.to}
                                    to={link.to}
                                    className={`py-3 text-center text-xs transition-colors ${
                                        active
                                            ? 'text-blue-600 font-medium'
                                            : 'text-gray-500'
                                    }`}
                                >
                                    {link.label}
                                </Link>
                            );
                        })}

                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main
                className={`flex-1 ${
                    isFullScreenPage
                        ? 'overflow-hidden'
                        : 'max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6'
                }`}
            >
                <Outlet />
            </main>

        </div>
    );
}

