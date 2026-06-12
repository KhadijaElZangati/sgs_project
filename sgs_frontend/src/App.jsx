import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Notifications from './components/Notifications';

import Dashboard from './pages/Dashboard';
import Login from './pages/Login';

import RHModule from './pages/modules/RHModule';
import FinanceModule from './pages/modules/FinanceModule';
import SchoolLifeModule from './pages/modules/SchoolLifeModule';
import DocumentsModule from './pages/modules/DocumentsModule';

import UserManagement from './pages/admin/UserManagement';
import Profile from './pages/Profile';
import AssistantModule from './pages/modules/AssistantModule';
import ErrorBoundary from './components/ErrorBoundary';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default function App() {
  const { t } = useTranslation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);

  useEffect(() => {
    const savedLang = localStorage.getItem('i18nextLng') || 'fr';
    document.documentElement.dir = savedLang.startsWith('ar') ? 'rtl' : 'ltr';
    document.documentElement.lang = savedLang;
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        setIsAuthenticated(true);
        fetchNotifications(parsed.id);
      } catch { /* invalid, will redirect to login */ }
    }
    setLoading(false);
  }, []);

  const fetchNotifications = async (userId) => {
    try {
      const res = await api.get(`/notifications/user/${userId}`);
      setNotifications(res.data);
    } catch {}
  };

  const handleLogin = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user: userData } = response.data;
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      setIsAuthenticated(true);
      fetchNotifications(userData.id);
      return { success: true };
    } catch (error) {
      return { success: false, message: "Email ou mot de passe incorrect" };
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  const hasPermission = (requiredPermissions) => {
    if (!user) return false;
    if (user.role === 'administrateur' || user.role === 'direction') return true;
    if (!user.permissions) return false;
    if (typeof requiredPermissions === 'string') {
      return user.permissions.includes(requiredPermissions);
    }
    if (Array.isArray(requiredPermissions)) {
      return requiredPermissions.some(p => user.permissions.includes(p));
    }
    return false;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-white/60 text-sm animate-pulse">{t('app.loading')}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    );
  }

  return (
    <ErrorBoundary>
    <Router>
      <div className="flex h-screen bg-gray-100">
        <div className="no-print"><Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} user={user} hasPermission={hasPermission} /></div>
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="no-print"><Navbar
            user={user}
            api={api}
            onLogout={handleLogout}
            notifications={notifications}
            unreadCount={notifications.filter(n => !n.lu).length}
            onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
            onNotificationsUpdate={fetchNotifications}
          /></div>
          <div className="no-print"><Notifications notifications={notifications} /></div>
          <main className="flex-1 overflow-auto">
            <AnimatedRoutes user={user} api={api} hasPermission={hasPermission} setNotifications={setNotifications} setUser={setUser} />
          </main>
        </div>
      </div>
    </Router>
    </ErrorBoundary>
  );
}

function AnimatedRoutes({ user, api, hasPermission, setUser }) {
  const { t } = useTranslation();
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="h-full"
      >
        <Routes location={location}>
          <Route path="/dashboard" element={<Dashboard user={user} api={api} hasPermission={hasPermission} />} />
          <Route path="/rh/*" element={<RHModule user={user} api={api} hasPermission={hasPermission} />} />
          <Route path="/finance/*" element={<FinanceModule user={user} api={api} hasPermission={hasPermission} />} />
          <Route path="/school-life/*" element={<SchoolLifeModule user={user} api={api} hasPermission={hasPermission} />} />
          <Route path="/documents/*" element={<DocumentsModule user={user} api={api} hasPermission={hasPermission} />} />
          <Route path="/profile" element={<Profile api={api} user={user} setUser={setUser} />} />
          {(user?.role === 'administrateur' || user?.role === 'direction') && (
            <Route path="/assistant" element={<AssistantModule api={api} user={user} />} />
          )}
          {user?.role === 'administrateur' && <Route path="/admin/users" element={<UserManagement api={api} user={user} />} />}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={
            <div className="flex flex-col items-center justify-center min-h-full text-gray-400">
              <div className="text-6xl font-black text-gray-200 mb-4">404</div>
              <p className="text-lg font-medium">{t('errors.notFound')}</p>
              <a href="/dashboard" className="mt-4 text-blue-600 hover:text-blue-800 text-sm font-medium">{t('errors.backToDashboard')}</a>
            </div>
          } />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}
