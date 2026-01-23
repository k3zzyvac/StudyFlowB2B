
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { useLanguage } from './LanguageContext';

interface GamificationContextType {
  xp: number;
  level: number;
  rankTitle: string;
  nextLevelXp: number;
  addXp: (amount: number, reason?: string) => Promise<void>;
  showLevelUp: boolean;
  setShowLevelUp: (show: boolean) => void;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export const GamificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { language } = useLanguage();
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [showLevelUp, setShowLevelUp] = useState(false);

  // Rütbe Belirleme
  const getRankTitle = (lvl: number) => {
    if (lvl <= 3) return language === 'tr' ? 'Acemi' : 'Beginner';
    if (lvl <= 6) return language === 'tr' ? 'Bilgin' : 'Scholar';
    if (lvl <= 9) return language === 'tr' ? 'Bilim Adamı' : 'Scientist';
    return language === 'tr' ? 'Efsane' : 'Legend';
  };

  // Bir sonraki level için gereken XP (Formül: 250 * Level)
  const nextLevelXp = level * 250;

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('xp, level').eq('user_id', user.id).maybeSingle();
        if (data) {
          setXp(data.xp || 0);
          setLevel(data.level || 1);
        }
      } else {
        // Guest Mode: Load from local storage
        const localXP = parseInt(localStorage.getItem('guest_xp') || '0');
        const localLevel = parseInt(localStorage.getItem('guest_level') || '1');
        setXp(localXP);
        setLevel(localLevel);
      }
    };
    fetchProfile();
  }, []);

  const addXp = async (amount: number, reason: string = 'activity') => {
    let newXp = xp + amount;
    let newLevel = level;
    let leveledUp = false;

    // Level Atlama Kontrolü
    const requiredXp = newLevel * 250;

    if (newXp >= requiredXp) {
      newLevel++;
      newXp = newXp - requiredXp;
      leveledUp = true;
      setShowLevelUp(true);
      const audio = new Audio('https://actions.google.com/sounds/v1/cartoon/clank_car_crash.ogg');
      audio.play().catch(() => { });
    }

    setXp(newXp);
    setLevel(newLevel);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // 1. Profili Güncelle
      await supabase.from('profiles').update({ xp: newXp, level: newLevel }).eq('user_id', user.id);

      // 2. Aktivite Loguna Ekle (Grafik için)
      await supabase.from('activity_logs').insert([{
        user_id: user.id,
        xp_amount: amount,
        action_type: reason
      }]);

    } else {
      // Guest Mode Save
      localStorage.setItem('guest_xp', newXp.toString());
      localStorage.setItem('guest_level', newLevel.toString());
    }
  };

  return (
    <GamificationContext.Provider value={{ xp, level, rankTitle: getRankTitle(level), nextLevelXp, addXp, showLevelUp, setShowLevelUp }}>
      {children}
    </GamificationContext.Provider>
  );
};

export const useGamification = () => {
  const context = useContext(GamificationContext);
  if (!context) throw new Error("useGamification must be used within GamificationProvider");
  return context;
};
