import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try { await register(form.name, form.email, form.password); navigate('/'); }
    catch (e: any) { setError(e.response?.data?.message || 'Đăng ký thất bại'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-sm border w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">Đăng ký</h1>
        {error && <p className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">{error}</p>}
        <form onSubmit={submit} className="space-y-4">
          {[
            { key: 'name', label: 'Họ tên', type: 'text', placeholder: 'Nguyễn Văn A' },
            { key: 'email', label: 'Email', type: 'email', placeholder: 'your@email.com' },
            { key: 'password', label: 'Mật khẩu', type: 'password', placeholder: 'Ít nhất 6 ký tự' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-sm font-medium mb-1">{f.label}</label>
              <input type={f.type} required placeholder={f.placeholder}
                value={(form as any)[f.key]}
                onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                className="w-full border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          ))}
          <button disabled={loading}
            className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
          </button>
        </form>
        <p className="text-center text-sm mt-4 text-gray-500">
          Đã có tài khoản? <Link to="/login" className="text-blue-600 hover:underline">Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}