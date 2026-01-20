
import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../lib/LanguageContext';

const Pomodoro: React.FC = () => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [time, setTime] = useState(25 * 60); 
  const [initialTime, setInitialTime] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'work' | 'break'>('work');
  const [customWork, setCustomWork] = useState(25);
  const [customBreak, setCustomBreak] = useState(5);
  
  // Ambient Sound State
  const [activeSound, setActiveSound] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.5);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // External CDN sounds (Google Actions CDN - Works reliably on local)
  const SOUNDS = [
    { id: 'rain', icon: 'fas fa-cloud-rain', label: 'Yağmur', url: 'https://actions.google.com/sounds/v1/weather/rain_heavy_loud.ogg' },
    { id: 'cafe', icon: 'fas fa-mug-hot', label: 'Kafe', url: 'https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg' },
    { id: 'fire', icon: 'fas fa-fire', label: 'Şömine', url: 'https://actions.google.com/sounds/v1/ambiences/fireplace.ogg' },
    { id: 'forest', icon: 'fas fa-tree', label: 'Orman', url: 'https://actions.google.com/sounds/v1/animals/grey_squirrel_calls.ogg' } 
  ];

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-pomodoro', handleOpen);
    return () => window.removeEventListener('open-pomodoro', handleOpen);
  }, []);

  // Timer Logic
  useEffect(() => {
    let interval: any = null;
    if (isActive && time > 0) {
      interval = setInterval(() => setTime(prev => prev - 1), 1000);
    } else if (time === 0 && isActive) {
      clearInterval(interval);
      setIsActive(false);
      // Simple beep alarm
      const alarm = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
      alarm.volume = 0.5;
      alarm.play().catch(console.error);
    }
    return () => clearInterval(interval);
  }, [isActive, time]);

  // Audio Logic for Ambient Sounds
  useEffect(() => {
    if (activeSound) {
      if (!audioRef.current) {
        audioRef.current = new Audio(activeSound);
        audioRef.current.loop = true;
      } else if (audioRef.current.src !== activeSound) {
        audioRef.current.src = activeSound;
      }
      audioRef.current.volume = volume;
      audioRef.current.play().catch(e => console.log("Audio play failed (user interaction needed)", e));
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    }
    return () => {
        if(audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
    }
  }, [activeSound]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const toggleSound = (url: string) => {
    if (activeSound === url) setActiveSound(null);
    else setActiveSound(url);
  };

  const startTimer = (workMin: number, breakMin: number) => {
    setIsActive(false);
    setMode('work');
    setInitialTime(workMin * 60);
    setTime(workMin * 60);
    setCustomWork(workMin);
    setCustomBreak(breakMin);
    setIsActive(true);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progress = (time / initialTime) * 100;
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[9999] flex flex-col items-center justify-center animate-fade-in p-4 overflow-y-auto">
       <button onClick={() => setIsOpen(false)} className="absolute top-8 right-8 text-gray-500 hover:text-white text-3xl transition-transform hover:rotate-90">
         <i className="fas fa-times"></i>
       </button>

       {/* LAYOUT: Left (Timer) - Right (Settings & Sounds) */}
       <div className="flex flex-col lg:flex-row gap-12 items-center">
         
         {/* LEFT: TIMER */}
         <div className="flex flex-col items-center">
           <div className="relative mb-8 scale-90 md:scale-100">
             <svg width="300" height="300" className="transform -rotate-90 drop-shadow-2xl">
                <circle cx="150" cy="150" r={radius} stroke="#27272A" strokeWidth="8" fill="transparent" />
                <circle cx="150" cy="150" r={radius} stroke={mode === 'work' ? '#9333ea' : '#10b981'} strokeWidth="8" fill="transparent" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" className="transition-all duration-1000 ease-linear" />
             </svg>
             <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-7xl font-mono font-bold text-white tracking-tighter drop-shadow-lg">{formatTime(time)}</span>
                <span className={`font-bold uppercase tracking-widest text-sm mt-4 ${mode === 'work' ? 'text-purple-400' : 'text-green-400'}`}>{time === 0 ? "Bitti!" : (mode === 'work' ? t('focus') : t('break'))}</span>
             </div>
           </div>

           {/* CONTROLS */}
           <div className="flex gap-6">
              <button onClick={() => setIsActive(!isActive)} className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-all shadow-xl hover:scale-105 ${isActive ? 'bg-yellow-500 text-black' : 'bg-white text-black'}`}><i className={`fas ${isActive ? 'fa-pause' : 'fa-play'}`}></i></button>
              {time === 0 && <button onClick={() => { const newMode = mode === 'work' ? 'break' : 'work'; setMode(newMode); setTime((newMode === 'work' ? customWork : customBreak) * 60); setInitialTime((newMode === 'work' ? customWork : customBreak) * 60); setIsActive(true); }} className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-4 rounded-full font-bold animate-bounce shadow-lg shadow-purple-500/30">{mode === 'work' ? t('switch_to_break') : t('back_to_work')}</button>}
              <button onClick={() => { setIsActive(false); setTime(initialTime); }} className="w-16 h-16 rounded-full bg-[#27272A] text-white hover:bg-[#3F3F46] flex items-center justify-center text-xl shadow-lg border border-white/10"><i className="fas fa-undo"></i></button>
           </div>
         </div>

         {/* RIGHT: SETTINGS & SOUNDS */}
         <div className="w-full max-w-sm bg-[#18181B] border border-[#27272A] rounded-3xl p-6 shadow-2xl">
            {/* Quick Presets */}
            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4">Hızlı Ayarlar</h3>
            <div className="grid grid-cols-4 gap-2 mb-6">
              {[
                {w: 25, b: 5}, {w: 40, b: 10}, {w: 50, b: 10}, {w: 60, b: 15}
              ].map((preset, idx) => (
                <button key={idx} onClick={() => startTimer(preset.w, preset.b)} className="bg-[#27272A] hover:bg-purple-600 hover:text-white text-gray-400 py-2 rounded-lg text-xs font-bold transition-colors">{preset.w}/{preset.b}</button>
              ))}
            </div>

            {/* Custom Time */}
            <div className="flex gap-3 mb-6">
               <div className="flex-1"><label className="text-[10px] text-gray-500 font-bold uppercase mb-1 block">{t('work')}</label><input type="number" value={customWork} onChange={(e) => setCustomWork(parseInt(e.target.value))} className="w-full bg-black border border-[#27272A] rounded-lg p-2 text-white text-center text-sm font-bold focus:border-purple-500 outline-none" /></div>
               <div className="flex-1"><label className="text-[10px] text-gray-500 font-bold uppercase mb-1 block">{t('break')}</label><input type="number" value={customBreak} onChange={(e) => setCustomBreak(parseInt(e.target.value))} className="w-full bg-black border border-[#27272A] rounded-lg p-2 text-white text-center text-sm font-bold focus:border-green-500 outline-none" /></div>
            </div>

            {/* Ambient Sounds */}
            <div className="border-t border-[#27272A] pt-6">
               <div className="flex justify-between items-center mb-4">
                 <h3 className="text-white text-sm font-bold flex items-center gap-2"><i className="fas fa-music text-purple-400"></i> Odak Sesleri</h3>
                 {activeSound && <div className="flex items-center gap-2"><i className="fas fa-volume-down text-gray-500 text-xs"></i><input type="range" min="0" max="1" step="0.1" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} className="w-20 accent-purple-500 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"/></div>}
               </div>
               <div className="grid grid-cols-2 gap-3">
                 {SOUNDS.map(sound => (
                   <button 
                     key={sound.id} 
                     onClick={() => toggleSound(sound.url)} 
                     className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${activeSound === sound.url ? 'bg-purple-600/20 border-purple-500 text-white shadow-[0_0_15px_rgba(147,51,234,0.3)]' : 'bg-[#27272A] border-transparent text-gray-400 hover:bg-[#3F3F46]'}`}
                   >
                     <div className={`w-8 h-8 rounded-full flex items-center justify-center ${activeSound === sound.url ? 'bg-purple-500 text-white' : 'bg-black/30'}`}>
                       <i className={sound.icon}></i>
                     </div>
                     <span className="text-xs font-bold">{sound.label}</span>
                     {activeSound === sound.url && <div className="ml-auto w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>}
                   </button>
                 ))}
               </div>
            </div>
         </div>
       </div>
    </div>
  );
};

export default Pomodoro;
