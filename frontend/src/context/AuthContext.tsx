import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../api/client';

interface User {
  id: string; name: string; email: string;
  role: string; avatarUrl: string | null; bio: string | null;
}

interface AuthCtx {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>; // Đổi thành Promise<User>
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    const r = await api.get('/auth/me');
    setUser(r.data);
  };

  useEffect(() => {
    if (!localStorage.getItem('accessToken')) { setIsLoading(false); return; }
    api.get('/auth/me')
      .then(r => setUser(r.data))
      .catch(() => localStorage.clear())
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
  const r = await api.post('/auth/login', { email, password });
  localStorage.setItem('accessToken', r.data.accessToken);
  localStorage.setItem('refreshToken', r.data.refreshToken);
  setUser(r.data.user);
  return r.data.user; // Trả về user để Login.tsx sử dụng
};

  const register = async (name: string, email: string, password: string) => {
    await api.post('/auth/register', { name, email, password });
    await login(email, password);
  };

  const logout = () => {
    const rt = localStorage.getItem('refreshToken');
    if (rt) api.post('/auth/logout', { refreshToken: rt }).catch(() => {});
    localStorage.clear();
    setUser(null);
  };

  return (
    <Ctx.Provider value={{ user, isLoading, login, register, logout, refreshUser }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};