import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import type { JSX } from 'react';
import ExamSelect from './pages/ExamSelect';
import ExamRoom from './pages/ExamRoom';
import Result from './pages/Result';
import Review from './pages/Review';
import VocabHome from './pages/VocabHome';
import { GrammarDetail, GrammarList } from './pages/Grammar';
import FlashCard from './components/FlashCard';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import AiAnalysis from './pages/AiAnalystic';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import AdminExams from './pages/admin/Exams';
import AdminQuestions from './pages/admin/Questions';
import AdminVocab from './pages/admin/Vocab';
import AdminTheory from './pages/admin/Theory';
import AdminUsers from './pages/admin/Users';
import History from './pages/History';

export function Guard({ children }: { children: JSX.Element }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
}

export function AdminGuard({ children }: { children: JSX.Element }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'ADMIN') return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Public — không có header */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected — luôn hiển thị Layout (header) */}
      <Route element={<Guard><Layout /></Guard>}>
        <Route path="/" element={<Home />} />
        <Route path="/exam" element={<ExamSelect />} />
        <Route path="/exam/:attemptId" element={<ExamRoom />} />
        <Route path="/result/:attemptId" element={<Result />} />
        <Route path="/review/:attemptId" element={<Review />} />
        <Route path="/vocab" element={<VocabHome />} />
        <Route path="/vocab/sets/:setId" element={<FlashCard />} />
        <Route path="/grammar" element={<GrammarList />} />
        <Route path="/grammar/:partNumber" element={<GrammarDetail />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/analysis" element={<AiAnalysis />} />
        <Route path="/history" element={<History />} />
      </Route>
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="exams" element={<AdminExams />} />
        <Route path="questions" element={<AdminQuestions />} />
        <Route path="vocab" element={<AdminVocab />} />
        <Route path="theory" element={<AdminTheory />} />
        <Route path="users" element={<AdminUsers />} />
      </Route>
    </Routes>
  );
}