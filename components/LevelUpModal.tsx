
import React from 'react';
import { useGamification } from '../lib/GamificationContext';
import { useLanguage } from '../lib/LanguageContext';

const LevelUpModal: React.FC = () => {
  const { showLevelUp, setShowLevelUp, level, rankTitle } = useGamification();
  const { t } = useLanguage();

  if (!showLevelUp) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in">
      <div className="relative text-center p-12 rounded-3xl border-2 border-yellow-500 bg-gradient-to-b from-yellow-900/50 to-black shadow-[0_0_100px_rgba(234,179,8,0.3)] transform scale-100 transition-all">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-600 mb-2 uppercase tracking-widest">
          {t('level_up') || "LEVEL UP!"}
        </h2>
        <div className="text-8xl font-black text-white mb-4 drop-shadow-2xl font-mono">
          {level}
        </div>
        <div className="text-xl text-yellow-200 font-bold uppercase tracking-wider mb-8 border-t border-b border-yellow-500/30 py-2">
          {rankTitle}
        </div>
        
        <button 
          onClick={() => setShowLevelUp(false)}
          className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 px-10 rounded-full shadow-lg hover:shadow-yellow-500/50 transition-all transform hover:scale-105"
        >
          {t('awesome') || "HARİKA"}
        </button>
      </div>
    </div>
  );
};

export default LevelUpModal;
