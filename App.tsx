
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Notes from './pages/Notes';
import Exam from './pages/Exam';
import Auth from './pages/Auth';
import Pomodoro from './components/Pomodoro';
import LevelUpModal from './components/LevelUpModal';
import { LanguageProvider } from './lib/LanguageContext';
import { GamificationProvider } from './lib/GamificationContext';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-[var(--bg-main)] text-[var(--text-paragraph)]">
      <Sidebar />
      <main className="flex-1 md:ml-[60px] mb-[70px] md:mb-0 h-screen overflow-hidden">
        {children}
      </main>
      <Pomodoro />
      <LevelUpModal />
    </div>
  );
};

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Check for Supabase token OR Guest Token
    const token = localStorage.getItem('sb-access-token');
    const isGuest = localStorage.getItem('is-guest') === 'true';

    setIsAuthenticated(!!token || isGuest);
  }, []);

  if (isAuthenticated === null) return null; // Loading state

  return isAuthenticated ? <Layout>{children}</Layout> : <Navigate to="/auth" replace />;
};

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <GamificationProvider>
        <Router>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/notes" element={<PrivateRoute><Notes /></PrivateRoute>} />
            <Route path="/exam" element={<PrivateRoute><Exam /></PrivateRoute>} />
            <Route path="/share/:id" element={<PrivateRoute><Notes /></PrivateRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </GamificationProvider>
    </LanguageProvider>
  );
};

export default App;
