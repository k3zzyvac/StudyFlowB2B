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
import { supabase } from './lib/supabaseClient';

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
    // Check demo authentication OR Supabase session
    const checkAuth = async () => {
      // Demo authentication check (Staff or Student via localStorage)
      const isStaff = localStorage.getItem('staff_authenticated') === 'true';
      const isStudent = localStorage.getItem('student_authenticated') === 'true';
      
      if (isStaff || isStudent) {
        setIsAuthenticated(true);
        return;
      }

      // Supabase session check (for real auth when configured)
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setIsAuthenticated(!!session);
      } catch (e) {
        // Supabase not configured, check localStorage only
        setIsAuthenticated(false);
      }
    };
    
    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const isStaff = localStorage.getItem('staff_authenticated') === 'true';
      const isStudent = localStorage.getItem('student_authenticated') === 'true';
      setIsAuthenticated(!!session || isStaff || isStudent);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

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
