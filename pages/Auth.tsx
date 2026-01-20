
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useLanguage } from '../lib/LanguageContext';
import { UserRole } from '../types';

const Auth: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [selectedRole, setSelectedRole] = useState<UserRole>('student');
    const [isAccepted, setIsAccepted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { language } = useLanguage();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isLogin && !isAccepted) {
            setError(language === 'tr' ? "Devam etmek için lütfen güncellemeleri kabul edin." : "Please accept updates to continue.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            if (isLogin) {
                const { data, error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;

                // Giriş yapınca rolü kontrol edip lokale kaydedelim (UX hızı için)
                if (data.user) {
                    const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', data.user.id).single();
                    if (profile) localStorage.setItem('user_role', profile.role);
                    navigate('/');
                }
            } else {
                // KAYIT İŞLEMİ
                const { data, error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;

                if (data.user) {
                    // Trigger profil oluşturduktan sonra ROLÜ güncellememiz lazım
                    const { error: updateError } = await supabase
                        .from('profiles')
                        .update({ role: selectedRole })
                        .eq('user_id', data.user.id);

                    if (updateError) console.error("Rol güncelleme hatası:", updateError);

                    alert(language === 'tr' ? "Kayıt başarılı! Şimdi giriş yapabilirsin." : "Signup successful! You can now log in.");
                    setIsLogin(true);
                }
            }
        } catch (err: any) {
            setError(err.message || "Authentication error occurred.");
        } finally {
            setLoading(false);
        }
    };

    // DEMO LOGIN HANDLER
    const handleDemoLogin = (role: UserRole) => {
        localStorage.setItem('sb-access-token', 'demo-token');
        localStorage.setItem('is-guest', 'true');
        localStorage.setItem('user_role', role); // Seçilen role göre giriş yap

        // Demo verileri yükle (Dashboard hata vermesin)
        if (role === 'student' && !localStorage.getItem('guest_notes')) {
            // Öğrenci için boş veri hatası olmasın diye
            localStorage.setItem('guest_notes', JSON.stringify([]));
        }

        navigate('/');
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#09090b] text-white relative px-4 overflow-hidden font-sans">
            {/* Dynamic Background Blur Effects */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full"></div>

            <div className="w-full max-w-[390px] animate-fade-in-up z-10">
                {/* Branding Section */}
                <div className="flex flex-col items-center mb-8 text-center">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-black text-3xl font-black mb-6 shadow-[0_0_40px_rgba(255,255,255,0.2)] rotate-3">
                        S
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter mb-2">StudyFlow</h1>
                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em]">
                        {isLogin ? t('login') : t('signup')}
                    </p>
                </div>

                {/* Status Messaging */}
                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold text-center animate-fade-in flex items-center justify-center gap-2">
                        <i className="fas fa-exclamation-circle text-xs"></i> {error}
                    </div>
                )}

                {/* Main Authentication Form */}
                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* ROL SEÇİMİ (Sadece Kayıt Olurken) */}
                    {!isLogin && (
                        <div className="grid grid-cols-3 gap-2 mb-4">
                            <button type="button" onClick={() => setSelectedRole('student')} className={`p-3 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1 ${selectedRole === 'student' ? 'bg-purple-600 border-purple-500 text-white' : 'bg-[#121214] border-white/5 text-gray-500 hover:bg-[#1C1C21]'}`}>
                                <i className="fas fa-user-graduate text-lg"></i>
                                Öğrenci
                            </button>
                            <button type="button" onClick={() => setSelectedRole('teacher')} className={`p-3 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1 ${selectedRole === 'teacher' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-[#121214] border-white/5 text-gray-500 hover:bg-[#1C1C21]'}`}>
                                <i className="fas fa-chalkboard-teacher text-lg"></i>
                                Öğretmen
                            </button>
                            <button type="button" onClick={() => setSelectedRole('principal')} className={`p-3 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1 ${selectedRole === 'principal' ? 'bg-amber-600 border-amber-500 text-white' : 'bg-[#121214] border-white/5 text-gray-500 hover:bg-[#1C1C21]'}`}>
                                <i className="fas fa-user-tie text-lg"></i>
                                Müdür
                            </button>
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-zinc-600 ml-2 uppercase tracking-widest">{t('email')}</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-[#121214] border border-white/5 rounded-2xl px-6 py-4 text-sm text-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all placeholder-zinc-800"
                            placeholder="name@school.com"
                            required
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-zinc-600 ml-2 uppercase tracking-widest">{t('password')}</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-[#121214] border border-white/5 rounded-2xl px-6 py-4 text-sm text-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all placeholder-zinc-800"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {!isLogin && (
                        <div
                            onClick={() => setIsAccepted(!isAccepted)}
                            className={`group flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer select-none mt-2 ${isAccepted ? 'bg-purple-500/10 border-purple-500/50 shadow-lg' : 'bg-white/5 border-white/5 hover:border-white/10'}`}
                        >
                            <div className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center transition-all border-2 ${isAccepted ? 'bg-purple-500 border-purple-500' : 'bg-transparent border-zinc-700 group-hover:border-zinc-500'}`}>
                                {isAccepted && <i className="fas fa-check text-white text-[10px]"></i>}
                            </div>
                            <p className={`text-[11px] leading-relaxed font-bold transition-colors flex-1 ${isAccepted ? 'text-purple-200' : 'text-zinc-500'}`}>
                                {t('marketing_accept')}
                            </p>
                        </div>
                    )}

                    {/* 🚀 PRIMARY LOGIN BUTTON */}
                    <button
                        type="submit"
                        disabled={loading || (!isLogin && !isAccepted)}
                        className={`w-full font-black py-4 rounded-2xl transition-all text-sm mt-10 shadow-[0_10px_20px_rgba(0,0,0,0.2)] active:scale-95 flex items-center justify-center gap-3 ${loading || (!isLogin && !isAccepted)
                            ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed opacity-40'
                            : 'bg-white text-black hover:bg-zinc-100 hover:scale-[1.01]'
                            }`}
                    >
                        {loading ? <i className="fas fa-circle-notch fa-spin text-sm"></i> : (isLogin ? t('login') : t('signup'))}
                    </button>
                </form>

                {/* Visual Divider */}
                <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/5"></div>
                    </div>
                    <div className="relative flex justify-center text-[9px] uppercase font-black tracking-[0.4em]">
                        <span className="bg-[#09090b] px-4 text-zinc-700">DEMO GİRİŞ (TEK TIKLA)</span>
                    </div>
                </div>

                {/* 🚀 DEMO LOGIN BUTTONS GRID */}
                <div className="grid grid-cols-3 gap-3">
                    <button onClick={() => handleDemoLogin('student')} className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#18181B] border border-white/5 hover:bg-purple-900/20 hover:border-purple-500/50 transition-all group">
                        <i className="fas fa-user-graduate text-2xl text-purple-400 mb-2 group-hover:scale-110 transition-transform"></i>
                        <span className="text-[10px] font-bold text-gray-400 group-hover:text-white">Öğrenci</span>
                    </button>
                    <button onClick={() => handleDemoLogin('teacher')} className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#18181B] border border-white/5 hover:bg-indigo-900/20 hover:border-indigo-500/50 transition-all group">
                        <i className="fas fa-chalkboard-teacher text-2xl text-indigo-400 mb-2 group-hover:scale-110 transition-transform"></i>
                        <span className="text-[10px] font-bold text-gray-400 group-hover:text-white">Öğretmen</span>
                    </button>
                    <button onClick={() => handleDemoLogin('principal')} className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#18181B] border border-white/5 hover:bg-amber-900/20 hover:border-amber-500/50 transition-all group">
                        <i className="fas fa-user-tie text-2xl text-amber-400 mb-2 group-hover:scale-110 transition-transform"></i>
                        <span className="text-[10px] font-bold text-gray-400 group-hover:text-white">Müdür</span>
                    </button>
                </div>

                {/* View Toggling (Login/Signup Switch) */}
                <p className="mt-10 text-center text-[11px] text-zinc-600 font-bold uppercase tracking-widest">
                    {isLogin ? t('no_account') : t('have_account')}
                    <button
                        onClick={() => { setIsLogin(!isLogin); setError(null); }}
                        className="text-white hover:text-purple-400 ml-2 transition-colors border-b-2 border-white hover:border-purple-400"
                    >
                        {isLogin ? t('signup') : t('login')}
                    </button>
                </p>
            </div>
        </div>
    );
};

export default Auth;
