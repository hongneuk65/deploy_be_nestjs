
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

export default function Profile() {
  const { user, refreshUser } = useAuth();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
  });

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const save = async () => {
    setSaving(true);
    setSuccess('');
    setError('');

    try {
      await api.patch('/auth/profile', {
        name: form.name,
        bio: form.bio,
      });

      await refreshUser();

      setEditing(false);
      setSuccess('Thông tin tài khoản đã được cập nhật.');

      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (e: any) {
      setError(
        e.response?.data?.message || 'Không thể cập nhật thông tin.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Thông tin tài khoản
        </h1>

        <p className="text-gray-500 mt-2">
          Quản lý hồ sơ cá nhân và các thiết lập tài khoản.
        </p>
      </div>

      {/* Alert */}
      {success && (
        <div className="bg-green-50 border border-green-100 text-green-700 px-4 py-3 rounded-2xl text-sm">
          {success}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl text-sm">
          {error}
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">

        {/* Avatar */}
        <div className="flex items-center gap-5 pb-8 border-b border-gray-100">

          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-20 h-20 rounded-full object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-2xl font-bold">
              {user?.name?.[0]?.toUpperCase()}
            </div>
          )}

          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {user?.name}
            </h2>

            <p className="text-gray-500 mt-1">
              {user?.email}
            </p>

            <span
              className={`inline-flex mt-3 px-3 py-1 rounded-full text-xs font-medium ${user?.role === 'ADMIN'
                  ? 'bg-purple-50 text-purple-700'
                  : 'bg-blue-50 text-blue-700'
                }`}
            >
              {user?.role === 'ADMIN'
                ? 'Quản trị viên'
                : 'Học viên'}
            </span>
          </div>
        </div>

        {/* View Mode */}
        {!editing ? (
          <>
            <div className="grid md:grid-cols-2 gap-6 mt-8">

              <div>
                <p className="text-sm text-gray-400 mb-1">
                  Họ và tên
                </p>

                <p className="font-medium text-gray-900">
                  {user?.name}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-400 mb-1">
                  Email
                </p>

                <p className="font-medium text-gray-900">
                  {user?.email}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-400 mb-1">
                  Giới thiệu
                </p>

                <p className="text-gray-700">
                  {user?.bio || 'Chưa cập nhật'}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-400 mb-1">
                  Ngày tham gia
                </p>

                <p className="text-gray-700">

                  {(user as any)?.createdAt
                    ? new Date((user as any).createdAt).toLocaleDateString('vi-VN')
                    : null}
                </p>
              </div>

            </div>

            <button
              onClick={() => setEditing(true)}
              className="mt-8 w-full bg-gray-900 text-white py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors"
            >
              Chỉnh sửa thông tin
            </button>
          </>
        ) : (
          <>
            <div className="space-y-5 mt-8">

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Họ và tên
                </label>

                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giới thiệu bản thân
                </label>

                <textarea
                  rows={4}
                  value={form.bio}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      bio: e.target.value,
                    }))
                  }
                  placeholder="Viết đôi nét về bản thân..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

            </div>

            <div className="flex gap-3 mt-8">

              <button
                onClick={() => {
                  setEditing(false);
                  setForm({
                    name: user?.name || '',
                    bio: user?.bio || '',
                  });
                }}
                className="flex-1 border border-gray-200 rounded-xl py-3 font-medium hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>

              <button
                onClick={save}
                disabled={saving}
                className="flex-1 bg-blue-600 text-white rounded-xl py-3 font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>

            </div>
          </>
        )}
      </div>

      {/* Security Card */}
      <Link
        to="/settings"
        className="block bg-white rounded-3xl border border-gray-100 shadow-sm p-6 hover:border-gray-200 transition-all"
      >
        <div className="flex justify-between items-center">

          <div>
            <h3 className="font-semibold text-gray-900">
              Bảo mật tài khoản
            </h3>

            <p className="text-sm text-gray-500 mt-1">
              Đổi mật khẩu và quản lý các thiết lập bảo mật.
            </p>
          </div>

          <span className="text-gray-400 text-lg">
            →
          </span>

        </div>
      </Link>

    </div>
  );
}

