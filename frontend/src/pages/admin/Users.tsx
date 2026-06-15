import { useEffect, useState } from 'react';
import api from '../../api/client';

export default function AdminUsers() {
    const [users, setUsers] = useState<any[]>([]);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/admin/users');
            setUsers(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            await api.patch(`/admin/users/${id}/status`, { isActive: !currentStatus });
            fetchUsers();
        } catch (error) {
            alert('Lỗi cập nhật trạng thái');
        }
    };

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">👥 Quản lý Người dùng</h1>
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="p-4">Email</th>
                            <th className="p-4">Tên</th>
                            <th className="p-4">Vai trò</th>
                            <th className="p-4">Trạng thái</th>
                            <th className="p-4">Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.id} className="border-t">
                                <td className="p-4">{u.email}</td>
                                <td className="p-4">{u.name}</td>
                                <td className="p-4 font-semibold">{u.role}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs text-white ${u.isActive ? 'bg-green-500' : 'bg-red-500'}`}>
                                        {u.isActive ? 'Active' : 'Locked'}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <button
                                        onClick={() => toggleStatus(u.id, u.isActive)}
                                        className="px-3 py-1 bg-gray-800 text-white rounded hover:bg-gray-700"
                                    >
                                        {u.isActive ? 'Khóa' : 'Mở khóa'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}