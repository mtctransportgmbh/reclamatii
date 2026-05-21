import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ReclamatiPage from './pages/ReclamatiPage';
import StatisticiPage from './pages/StatisticiPage';
import RechnunguriPage from './pages/RechnunguriPage';
import SoferiPage from './pages/SoferiPage';
import UtilizatoriPage from './pages/UtilizatoriPage';
import './index.css';

function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!currentUser) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  const { currentUser } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={currentUser ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="reclamatii" element={<ReclamatiPage />} />
        <Route path="statistici" element={<StatisticiPage />} />
        <Route path="rechnunguri" element={<RechnunguriPage />} />
        <Route path="soferi" element={<SoferiPage />} />
        <Route path="utilizatori" element={<UtilizatoriPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: { fontFamily: '"DM Sans", sans-serif', fontSize: '14px', borderRadius: '12px', border: '1px solid #e4e8f4' },
            duration: 3000,
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
