import { Link, Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AdminLayout() {
  const { user, isLoading, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (isLoading) return <div className="p-8 text-center">Đang tải...</div>;
  if (!user || user.role !== 'ADMIN') return <Navigate to="/" replace />;

  const links = [
    ['/admin', ' Dashboard'],
    ['/admin/exams', ' Quản lý Đề thi'],
    ['/admin/questions', ' Quản lý Câu hỏi'],
    ['/admin/vocab', ' Quản lý Từ vựng'],
    ['/admin/theory', ' Quản lý Lý thuyết'],
    ['/admin/users', ' Người dùng'],
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-60 bg-gray-900 text-gray-300 p-4 shrink-0 sticky top-0 h-screen flex flex-col">
        <Link to="/" className="block text-white font-bold text-xl mb-8 px-2">ToeicMaster Admin</Link>
        
        <nav className="space-y-1 flex-1">
          {links.map(([to, label]) => {
            const isActive = to === '/admin' 
              ? location.pathname === to 
              : location.pathname.startsWith(to);
            return (
              <Link key={to} to={to}
                className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-all
                  ${isActive ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-gray-800 hover:text-white'}`}>
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-gray-800 pt-4">
          <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-red-400 hover:text-red-300 text-sm font-medium">
             Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}