
import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useLanguage } from '../lib/LanguageContext';
import { useGamification } from '../lib/GamificationContext';
import { UserRole } from '../types';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { xp, level, rankTitle, nextLevelXp } = useGamification();
  const [role, setRole] = useState<UserRole>('student');

  useEffect(() => {
    const fetchRole = async () => {
        // Hızlıca lokalden al, sonra sunucudan doğrula
        const localRole = localStorage.getItem('user_role') as UserRole;
        if (localRole) setRole(localRole);

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data } = await supabase.from('profiles').select('role').eq('user_id', user.id).single();
            if (data) {
                setRole(data.role as UserRole);
                localStorage.setItem('user_role', data.role);
            }
        }
    };
    fetchRole();
  }, []);

  const handleLogout = async () => {
      await supabase.auth.signOut();
      localStorage.removeItem('sb-access-token');
      localStorage.removeItem('is-guest');
      localStorage.removeItem('user_role');
      navigate('/auth');
  };
  
  // ROL BAZLI MENÜLER
  const studentNav = [
    { to: '/', icon: 'fas fa-home', label: t('dashboard') },
    { to: '/exam', icon: 'fas fa-file-signature', label: t('exam_center') },
  ];

  const teacherNav = [
    { to: '/', icon: 'fas fa-chalkboard-teacher', label: 'Panel' },
    // Öğretmen için ek rotalar eklenebilir
  ];

  const principalNav = [
     { to: '/', icon: 'fas fa-building', label: 'Yönetim' }
  ];

  let navItems = studentNav;
  if (role === 'teacher') navItems = teacherNav;
  if (role === 'principal') navItems = principalNav;

  const progressPercent = Math.min(100, Math.max(0, (xp / nextLevelXp) * 100));

  return (
    <>
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-[60px] bg-[var(--bg-main)] border-r border-[var(--border-color)] flex-col items-center py-6 z-50">
        <div className="mb-8 text-white text-xl">
          <i className="fas fa-feather-alt text-[var(--primary-purple)]"></i>
        </div>

        {role === 'student' && (
          <div className="mb-6 flex flex-col items-center group cursor-help relative">
              <div className="w-9 h-9 rounded-full border-2 border-yellow-500 flex items-center justify-center text-[10px] font-bold text-yellow-500 mb-1 bg-yellow-500/10">
                  {level}
              </div>
              {/* XP BAR VERTICAL */}
              <div className="w-1.5 h-12 bg-[#27272A] rounded-full overflow-hidden flex items-end">
                  <div className="w-full bg-gradient-to-t from-yellow-600 to-yellow-400 transition-all duration-500" style={{ height: `${progressPercent}%` }}></div>
              </div>
              {/* Tooltip */}
              <div className="absolute left-12 top-0 bg-[#18181B] border border-yellow-500/30 p-3 rounded-xl text-xs w-40 hidden group-hover:block z-[60] shadow-2xl backdrop-blur-md">
                  <div className="text-white font-bold text-sm mb-1">{t('level')} {level}</div>
                  <div className="text-yellow-400 font-bold uppercase tracking-wide text-[10px] mb-2">{rankTitle}</div>
                  <div className="w-full h-1.5 bg-[#27272A] rounded-full mb-1">
                     <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${progressPercent}%` }}></div>
                  </div>
                  <div className="text-gray-400 text-[10px] text-right">{xp} / {nextLevelXp} XP</div>
              </div>
          </div>
        )}

        <nav className="flex flex-col gap-6 w-full items-center">
          {navItems.map((item, idx) => {
            const isActive = location.pathname === item.to; 
            return (
              <Link key={idx} to={item.to} title={item.label} className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-all duration-200 ${isActive ? 'bg-[var(--primary-purple)] text-white shadow-lg shadow-purple-900/50' : 'text-gray-500 hover:text-gray-300 hover:bg-[var(--bg-card)]'}`}>
                <i className={item.icon}></i>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto mb-4 flex flex-col gap-4">
          <button onClick={handleLogout} title={t('logout')} className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-[10px] font-bold text-white cursor-pointer hover:scale-110 transition-transform">
            <i className="fas fa-power-off"></i>
          </button>
        </div>
      </aside>

      {/* MOBILE NAV */}
      <nav className="flex md:hidden fixed bottom-0 left-0 w-full h-[70px] bg-[#18181B] border-t border-[#27272A] z-50 items-center justify-around px-4 pb-2">
        {navItems.map((item, idx) => {
            const isActive = location.pathname === item.to;
            return (
              <Link key={idx} to={item.to} className={`flex flex-col items-center justify-center gap-1 ${isActive ? 'text-purple-500' : 'text-gray-500'}`}>
                <div className={`w-10 h-8 rounded-full flex items-center justify-center text-lg ${isActive ? 'bg-purple-500/20' : ''}`}>
                   <i className={item.icon}></i>
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            )
        })}
        <button onClick={handleLogout} className="flex flex-col items-center justify-center gap-1 text-red-400">
            <div className="w-10 h-8 flex items-center justify-center text-lg"><i className="fas fa-power-off"></i></div>
            <span className="text-[10px] font-medium">{t('logout')}</span>
        </button>
      </nav>
    </>
  );
};

export default Sidebar;
