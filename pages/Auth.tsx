
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useLanguage } from '../lib/LanguageContext';
import { UserRole } from '../types';

// ÖNCELİKLE TANIMLI ŞİFRELER ve KURUM EŞLEŞMELERİ
// Her şifre benzersiz bir kuruma ve role eşleşir
const STAFF_CREDENTIALS: Record<string, { role: UserRole; institutionName: string }> = {
    // XYZ Kurumları
    '444': { role: 'teacher', institutionName: 'XYZ Kurumları' },
    '4444': { role: 'principal', institutionName: 'XYZ Kurumları' },
    // ABC Kurumları
    '333': { role: 'teacher', institutionName: 'ABC Kurumları' },
    '3333': { role: 'principal', institutionName: 'ABC Kurumları' },
};

interface Institution {
    id: string;
    name: string;
}

interface SchoolClass {
    id: string;
    institution_id: string;
    grade: string;
    branch: string;
}

const Auth: React.FC = () => {
    const navigate = useNavigate();
    const { language } = useLanguage();

    // View State
    const [isLogin, setIsLogin] = useState(true);
    const [selectedRole, setSelectedRole] = useState<UserRole>('student');

    // Form Fields - Öğrenci
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [selectedInstitutionId, setSelectedInstitutionId] = useState('');
    const [selectedClassId, setSelectedClassId] = useState('');

    // Form Fields - Öğretmen/Müdür (sadece şifre)
    const [staffPassword, setStaffPassword] = useState('');

    // Data
    const [institutions, setInstitutions] = useState<Institution[]>([]);
    const [classes, setClasses] = useState<SchoolClass[]>([]);

    // UI State
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Kurumları çek
    useEffect(() => {
        fetchInstitutions();
    }, []);

    // Seçilen kuruma göre sınıfları çek
    useEffect(() => {
        if (selectedInstitutionId) {
            fetchClasses(selectedInstitutionId);
        } else {
            setClasses([]);
        }
    }, [selectedInstitutionId]);

    const fetchInstitutions = async () => {
        try {
            const { data, error } = await supabase.from('institutions').select('id, name');
            if (error) {
                console.warn('Kurumlar çekilemedi, demo modda çalışılıyor:', error);
                // Demo kurumları elle ekle
                setInstitutions([
                    { id: 'demo-xyz', name: 'XYZ Kurumları' },
                    { id: 'demo-abc', name: 'ABC Kurumları' }
                ]);
                return;
            }
            if (data && data.length > 0) {
                setInstitutions(data);
            } else {
                // Boş gelirse demo ekle
                setInstitutions([
                    { id: 'demo-xyz', name: 'XYZ Kurumları' },
                    { id: 'demo-abc', name: 'ABC Kurumları' }
                ]);
            }
        } catch (e) {
            console.error('Kurumlar çekilemedi:', e);
            setInstitutions([
                { id: 'demo-xyz', name: 'XYZ Kurumları' },
                { id: 'demo-abc', name: 'ABC Kurumları' }
            ]);
        }
    };

    const fetchClasses = async (institutionId: string) => {
        try {
            // Demo ID ise localStorage'dan veya mock data kullan
            if (institutionId.startsWith('demo-')) {
                const mockClasses = [
                    { id: 'class-9a', institution_id: institutionId, grade: '9', branch: 'A' },
                    { id: 'class-9b', institution_id: institutionId, grade: '9', branch: 'B' },
                    { id: 'class-10a', institution_id: institutionId, grade: '10', branch: 'A' },
                    { id: 'class-11a', institution_id: institutionId, grade: '11', branch: 'A' },
                    { id: 'class-12a', institution_id: institutionId, grade: '12', branch: 'A' },
                ];
                // Check local storage for any Principal-added demo classes
                const storageKey = `classes_${institutionId.replace('demo-', '').replace(/-/g, '_').toUpperCase()}_KURUMLARI`.replace(/\s/g, '_');
                // Note: The storage key format in Dashboard is simpler, trying to match it best effort or just stick to defaults for demo auth

                setClasses(mockClasses);
                return;
            }

            const { data, error } = await supabase
                .from('classes')
                .select('*')
                .eq('institution_id', institutionId)
                .order('grade', { ascending: true });

            if (error) {
                console.warn('Sınıflar çekilemedi:', error);
                setClasses([]);
                return;
            }
            setClasses(data || []);
        } catch (e) {
            console.error('Sınıflar çekilemedi:', e);
            setClasses([]);
        }
    };

    // ÖĞRENCİ KAYIT
    const handleStudentRegister = async () => {
        // Validasyonlar - Türkçe mesajlar
        if (!username.trim()) { setError('Kullanıcı adı boş bırakılamaz.'); return; }
        if (username.trim().length < 3) { setError('Kullanıcı adı en az 3 karakter olmalıdır.'); return; }
        if (!selectedInstitutionId) { setError('Lütfen eğitim kurumunuzu seçin.'); return; }
        if (!selectedClassId) { setError('Lütfen sınıfınızı seçin.'); return; }
        if (!password) { setError('Şifre boş bırakılamaz.'); return; }
        if (password.length < 6) { setError('Şifre en az 6 karakter olmalıdır.'); return; }

        setLoading(true);
        setError(null);

        try {
            const institution = institutions.find(i => i.id === selectedInstitutionId);
            const institutionName = institution?.name || 'Bilinmeyen Kurum';
            const selectedClass = classes.find(c => c.id === selectedClassId);
            const classDisplay = selectedClass ? `${selectedClass.grade}-${selectedClass.branch}` : '';

            // DEMO REGISTRATION (LocalStorage)
            if (selectedInstitutionId.startsWith('demo-')) {
                const studentData = {
                    username: username.trim().toLowerCase(),
                    password: password,
                    institutionId: selectedInstitutionId,
                    institutionName: institutionName,
                    classId: selectedClassId,
                    classDisplay: classDisplay,
                    role: 'student',
                    createdAt: new Date().toISOString()
                };

                const existingStudents = JSON.parse(localStorage.getItem('registered_students') || '[]');
                const alreadyExists = existingStudents.find((s: any) =>
                    s.username === studentData.username &&
                    s.institutionId === studentData.institutionId
                );

                if (alreadyExists) {
                    setError('Bu kullanıcı adı bu kurumda zaten kayıtlı.');
                    setLoading(false);
                    return;
                }

                existingStudents.push(studentData);
                localStorage.setItem('registered_students', JSON.stringify(existingStudents));

                alert(`Demo Kayıt Başarılı! \nKullanıcı: ${username}`);
                setIsLogin(true);
                setUsername(''); setPassword('');
                return;
            }

            // REAL REGISTRATION (Supabase)
            // 1. Sign up user
            const normalizeString = (str: string) => {
                return str.toLowerCase()
                    .replace(/ğ/g, 'g')
                    .replace(/ü/g, 'u')
                    .replace(/ş/g, 's')
                    .replace(/ı/g, 'i')
                    .replace(/i̇/g, 'i')
                    .replace(/ö/g, 'o')
                    .replace(/ç/g, 'c')
                    .replace(/[^a-z0-9]/g, '_');
            };

            const email = `${normalizeString(username.trim())}@studyflow.com`;
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        username: username.trim(),
                        role: 'student',
                        institution_id: selectedInstitutionId,
                        class_id: selectedClassId
                    }
                }
            });

            if (authError) {
                if (authError.status === 429) {
                    setError('Çok fazla deneme yaptınız. Lütfen 30 saniye bekleyip tekrar deneyin.');
                    return;
                }
                throw authError;
            }

            // 2. Profile creation is handled by DB trigger (handle_new_user)

            if (authData.user) {
                alert('Kayıt Başarılı! \n\nHesabınız oluşturuldu ve otomatik onaylandı. Giriş yapabilirsiniz.');
                setIsLogin(true);
                setUsername(''); setPassword('');
            } else {
                // Sometimes auto-confirm acts weird, user is created but session null
                alert('Kayıt isteği alındı. Lütfen giriş yapmayı deneyin.');
                setIsLogin(true);
            }

        } catch (err: any) {
            console.error('Kayıt hatası:', err);
            setError(err.message || 'Kayıt sırasında hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    // ÖĞRENCİ GİRİŞ
    const handleStudentLogin = async () => {
        if (!username.trim()) { setError('Kullanıcı adı boş bırakılamaz.'); return; }
        if (!selectedInstitutionId) { setError('Lütfen eğitim kurumunuzu seçin.'); return; }
        if (!selectedClassId) { setError('Lütfen sınıfınızı seçin.'); return; }
        if (!password) { setError('Şifre boş bırakılamaz.'); return; }

        setLoading(true);
        setError(null);

        try {
            // DEMO LOGIN
            if (selectedInstitutionId.startsWith('demo-')) {
                const registeredStudents = JSON.parse(localStorage.getItem('registered_students') || '[]');
                const matchedStudent = registeredStudents.find((s: any) =>
                    s.username === username.trim().toLowerCase() &&
                    s.institutionId === selectedInstitutionId &&
                    s.classId === selectedClassId &&
                    s.password === password
                );

                if (!matchedStudent) {
                    setError('Giriş bilgileri hatalı veya demo hesabı bulunamadı.');
                    setLoading(false);
                    return;
                }

                localStorage.setItem('user_role', 'student');
                localStorage.setItem('institution_id', matchedStudent.institutionId);
                localStorage.setItem('institution_name', matchedStudent.institutionName);
                localStorage.setItem('class_id', matchedStudent.classId);
                localStorage.setItem('class_display', matchedStudent.classDisplay);
                localStorage.setItem('current_username', matchedStudent.username);
                localStorage.setItem('student_authenticated', 'true');

                navigate('/');
                return;
            }

            // REAL LOGIN (Supabase)
            // Normalization helper (can be moved to utils if reused)
            const normalizeString = (str: string) => {
                return str.toLowerCase()
                    .replace(/ğ/g, 'g')
                    .replace(/ü/g, 'u')
                    .replace(/ş/g, 's')
                    .replace(/ı/g, 'i')
                    .replace(/i̇/g, 'i')
                    .replace(/ö/g, 'o')
                    .replace(/ç/g, 'c')
                    .replace(/[^a-z0-9]/g, '_');
            };

            const email = `${normalizeString(username.trim())}@studyflow.com`;
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) {
                setError('Giriş başarısız. Kullanıcı adı veya şifre hatalı.');
                setLoading(false);
                return;
            }

            if (data.user) {
                // Fetch profile to verify institution and class MATCH what was selected in dropdown
                // This prevents students from logging into other institutions by just knowing creds
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('institution_id, class_id')
                    .eq('user_id', data.user.id)
                    .single();

                if (profile) {
                    // Strict check: Selected Insitution MUST match Profile Institution
                    if (profile.institution_id !== selectedInstitutionId) {
                        await supabase.auth.signOut();
                        setError('Seçtiğiniz kurum hesabınızla eşleşmiyor.');
                        setLoading(false);
                        return;
                    }
                    // Strict check: Selected Class MUST match Profile Class
                    if (profile.class_id !== selectedClassId) {
                        await supabase.auth.signOut();
                        setError('Seçtiğiniz sınıf hesabınızla eşleşmiyor.');
                        setLoading(false);
                        return;
                    }

                    // Save basic info for UI helpers (optional, since auth context has it)
                    // We can fetch institution name for display if needed
                    const institution = institutions.find(i => i.id === selectedInstitutionId);
                    localStorage.setItem('user_role', 'student');
                    localStorage.setItem('institution_id', selectedInstitutionId);
                    localStorage.setItem('institution_name', institution?.name || '');

                    const cls = classes.find(c => c.id === selectedClassId);
                    if (cls) localStorage.setItem('class_display', `${cls.grade}-${cls.branch}`);

                    navigate('/');
                } else {
                    setError('Kullanıcı profili bulunamadı.');
                    await supabase.auth.signOut();
                }
            }

        } catch (err: any) {
            setError('Giriş sırasında beklenmeyen bir hata oluştu.');
            console.error('Giriş hatası:', err);
        } finally {
            setLoading(false);
        }
    };

    // ÖĞRETMEN/MÜDÜR GİRİŞ (Sadece şifre ile)
    const handleStaffLogin = async () => {
        if (!staffPassword) { setError('Kurum şifresi boş bırakılamaz.'); return; }

        setLoading(true);
        setError(null);

        try {
            const staffInfo = STAFF_CREDENTIALS[staffPassword];
            if (!staffInfo) {
                setError('Geçersiz kurum şifresi!');
                setLoading(false);
                return;
            }

            // Map Code to Real Supabase Identity
            const normalizeString = (str: string) => {
                return str.toLowerCase()
                    .replace(/ğ/g, 'g')
                    .replace(/ü/g, 'u')
                    .replace(/ş/g, 's')
                    .replace(/ı/g, 'i')
                    .replace(/i̇/g, 'i')
                    .replace(/ö/g, 'o')
                    .replace(/ç/g, 'c')
                    .replace(/[^a-z0-9]/g, '_');
            };

            const normalizedInstName = normalizeString(staffInfo.institutionName);
            const email = `${staffInfo.role}_${normalizedInstName}@studyflow.com`; // Changed .local to .com for validation
            const securePassword = `studyflow_${staffPassword}`;

            console.log('Attempting login with:', email);

            // 1. Try Login
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password: securePassword
            });

            let user = signInData.user;
            let error = signInError;

            // 2. If User Not Found -> Auto Register (First time setup)
            if (error && error.message.includes('Invalid login credentials')) {
                console.log('User not found or pass wrong, attempting auto-provision for staff code...');

                // Fetch Institution ID
                const { data: instData } = await supabase.from('institutions').select('id').eq('name', staffInfo.institutionName).single();
                let instId = instData?.id;

                // Create Institution if missing (Demo fallback)
                if (!instId) {
                    const { data: newInst } = await supabase.from('institutions').insert([{
                        name: staffInfo.institutionName,
                        teacher_code: staffInfo.role === 'teacher' ? staffPassword : '000',
                        principal_code: staffInfo.role === 'principal' ? staffPassword : '000'
                    }]).select().single();
                    instId = newInst?.id;
                }

                // Register
                const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                    email,
                    password: securePassword,
                    options: {
                        data: {
                            role: staffInfo.role,
                            institution_id: instId,
                            username: `${staffInfo.role}_${normalizedInstName}`
                        }
                    }
                });

                if (signUpError) throw signUpError;
                user = signUpData.user;
            } else if (error) {
                throw error;
            }

            if (user) {
                // Fetch Profile to ensure local storage sync
                const { data: profile } = await supabase.from('profiles').select('institution_id').eq('user_id', user.id).single();

                localStorage.setItem('user_role', staffInfo.role);
                localStorage.setItem('institution_id', profile?.institution_id || '');
                localStorage.setItem('institution_name', staffInfo.institutionName);
                localStorage.setItem('staff_authenticated', 'true');

                navigate('/');
            }

        } catch (err: any) {
            setError(err.message || 'Giriş işlemi başarısız.');
            console.error('Staff Login Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (selectedRole === 'student') {
            if (isLogin) {
                await handleStudentLogin();
            } else {
                await handleStudentRegister();
            }
        } else {
            await handleStaffLogin();
        }
    };

    const resetForm = () => {
        setUsername('');
        setPassword('');
        setStaffPassword('');
        setSelectedInstitutionId('');
        setSelectedClassId('');
        setError(null);
    };

    const switchMode = () => {
        setIsLogin(!isLogin);
        resetForm();
        // Kayıt moduna geçince otomatik öğrenci seç
        if (isLogin) {
            setSelectedRole('student');
        }
    };

    // Buton Rengi
    const getButtonColor = () => {
        if (selectedRole === 'student') return 'bg-purple-600 hover:bg-purple-500 shadow-purple-500/20';
        if (selectedRole === 'teacher') return 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20';
        return 'bg-amber-600 hover:bg-amber-500 shadow-amber-500/20';
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#09090b] text-white relative px-4 overflow-hidden font-sans">
            {/* Background Effects */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full"></div>

            <div className="w-full max-w-[420px] animate-fade-in-up z-10">
                {/* Branding */}
                <div className="flex flex-col items-center mb-8 text-center">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-black text-3xl font-black mb-6 shadow-[0_0_40px_rgba(255,255,255,0.2)] rotate-3">
                        S
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter mb-2">StudyFlow</h1>
                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em]">
                        {!isLogin
                            ? 'ÖĞRENCİ KAYIT'
                            : (selectedRole === 'student'
                                ? 'ÖĞRENCİ GİRİŞİ'
                                : (selectedRole === 'teacher' ? 'ÖĞRETMEN GİRİŞİ' : 'MÜDÜR GİRİŞİ')
                            )
                        }
                    </p>
                </div>

                {/* Hata Mesajı */}
                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] font-bold text-center animate-fade-in flex items-center justify-center gap-2">
                        <i className="fas fa-exclamation-circle text-sm"></i> {error}
                    </div>
                )}

                {/* Main Form */}
                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* ROL SEÇİCİ - Sadece Giriş modunda 3'ü göster, Kayıt modunda sadece Öğrenci */}
                    {isLogin ? (
                        <div className="grid grid-cols-3 gap-2 mb-6">
                            <button
                                type="button"
                                onClick={() => { setSelectedRole('student'); resetForm(); }}
                                className={`p-4 rounded-2xl text-xs font-bold border transition-all flex flex-col items-center gap-2 ${selectedRole === 'student'
                                    ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/20'
                                    : 'bg-[#121214] border-white/5 text-gray-500 hover:bg-[#1C1C21] hover:border-white/10'
                                    }`}
                            >
                                <i className="fas fa-user-graduate text-xl"></i>
                                Öğrenci
                            </button>
                            <button
                                type="button"
                                onClick={() => { setSelectedRole('teacher'); resetForm(); }}
                                className={`p-4 rounded-2xl text-xs font-bold border transition-all flex flex-col items-center gap-2 ${selectedRole === 'teacher'
                                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                                    : 'bg-[#121214] border-white/5 text-gray-500 hover:bg-[#1C1C21] hover:border-white/10'
                                    }`}
                            >
                                <i className="fas fa-chalkboard-teacher text-xl"></i>
                                Öğretmen
                            </button>
                            <button
                                type="button"
                                onClick={() => { setSelectedRole('principal'); resetForm(); }}
                                className={`p-4 rounded-2xl text-xs font-bold border transition-all flex flex-col items-center gap-2 ${selectedRole === 'principal'
                                    ? 'bg-amber-600 border-amber-500 text-white shadow-lg shadow-amber-500/20'
                                    : 'bg-[#121214] border-white/5 text-gray-500 hover:bg-[#1C1C21] hover:border-white/10'
                                    }`}
                            >
                                <i className="fas fa-user-tie text-xl"></i>
                                Müdür
                            </button>
                        </div>
                    ) : (
                        // Kayıt modunda sadece Öğrenci göster
                        <div className="mb-6">
                            <div className="p-4 rounded-2xl bg-purple-600 border border-purple-500 text-white shadow-lg shadow-purple-500/20 flex items-center justify-center gap-3">
                                <i className="fas fa-user-graduate text-2xl"></i>
                                <span className="font-bold">Öğrenci Kayıt Formu</span>
                            </div>
                            <p className="text-center text-[10px] text-zinc-500 mt-2">
                                Öğretmen ve Müdürler için kayıt gerekmez. Kurum şifresiyle giriş yapabilirler.
                            </p>
                        </div>
                    )}

                    {/* ÖĞRENCİ FORMU */}
                    {(selectedRole === 'student' || !isLogin) && (
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-zinc-600 ml-2 uppercase tracking-widest">KULLANICI ADI</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    autoComplete="username"
                                    className="w-full bg-[#121214] border border-white/5 rounded-2xl px-6 py-4 text-sm text-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all placeholder-zinc-700"
                                    placeholder="ornek_kullanici"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-zinc-600 ml-2 uppercase tracking-widest">EĞİTİM KURUMU</label>
                                <select
                                    value={selectedInstitutionId}
                                    onChange={(e) => { setSelectedInstitutionId(e.target.value); setSelectedClassId(''); }}
                                    className="w-full bg-[#121214] border border-white/5 rounded-2xl px-6 py-4 text-sm text-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all appearance-none cursor-pointer"
                                >
                                    <option value="">Kurum Seçin...</option>
                                    {institutions.map(inst => (
                                        <option key={inst.id} value={inst.id}>{inst.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-zinc-600 ml-2 uppercase tracking-widest">SINIF</label>
                                <select
                                    value={selectedClassId}
                                    onChange={(e) => setSelectedClassId(e.target.value)}
                                    className="w-full bg-[#121214] border border-white/5 rounded-2xl px-6 py-4 text-sm text-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all appearance-none cursor-pointer disabled:opacity-50"
                                    disabled={!selectedInstitutionId || classes.length === 0}
                                >
                                    <option value="">{classes.length === 0 ? (selectedInstitutionId ? 'Sınıf bulunamadı' : 'Önce kurum seçin') : 'Sınıf Seçin...'}</option>
                                    {classes.map(cls => (
                                        <option key={cls.id} value={cls.id}>{cls.grade}-{cls.branch}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-zinc-600 ml-2 uppercase tracking-widest">ŞİFRE</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoComplete={isLogin ? "current-password" : "new-password"}
                                    className="w-full bg-[#121214] border border-white/5 rounded-2xl px-6 py-4 text-sm text-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all placeholder-zinc-700"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                    )}

                    {/* ÖĞRETMEN/MÜDÜR FORMU (Sadece Şifre - Sadece Giriş modunda) */}
                    {isLogin && (selectedRole === 'teacher' || selectedRole === 'principal') && (
                        <div className="space-y-4">
                            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center mb-4">
                                <i className={`fas ${selectedRole === 'teacher' ? 'fa-chalkboard-teacher text-indigo-400' : 'fa-user-tie text-amber-400'} text-2xl mb-2`}></i>
                                <p className="text-xs text-zinc-400">
                                    {selectedRole === 'teacher'
                                        ? 'Öğretmen girişi için kurumunuzun size verdiği şifreyi girin'
                                        : 'Müdür girişi için kurumunuzun size verdiği şifreyi girin'
                                    }
                                </p>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-zinc-600 ml-2 uppercase tracking-widest">KURUM ŞİFRESİ</label>
                                <input
                                    type="password"
                                    value={staffPassword}
                                    onChange={(e) => setStaffPassword(e.target.value)}
                                    autoComplete="current-password"
                                    className={`w-full bg-[#121214] border border-white/5 rounded-2xl px-6 py-4 text-sm text-white outline-none transition-all placeholder-zinc-700 text-center tracking-[0.3em] font-mono ${selectedRole === 'teacher'
                                        ? 'focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'
                                        : 'focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10'
                                        }`}
                                    placeholder="••••"
                                />
                            </div>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full font-black py-4 rounded-2xl transition-all text-sm mt-6 shadow-lg active:scale-95 flex items-center justify-center gap-3 text-white ${loading ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed opacity-40' : getButtonColor()}`}
                    >
                        {loading
                            ? <i className="fas fa-circle-notch fa-spin text-sm"></i>
                            : (isLogin ? 'GİRİŞ YAP' : 'KAYIT OL')
                        }
                    </button>
                </form>

                {/* Giriş/Kayıt Geçişi */}
                <p className="mt-10 text-center text-[11px] text-zinc-600 font-bold uppercase tracking-widest">
                    {isLogin ? 'Hesabın yok mu?' : 'Zaten hesabın var mı?'}
                    <button
                        type="button"
                        onClick={switchMode}
                        className="text-white hover:text-purple-400 ml-2 transition-colors border-b-2 border-white hover:border-purple-400"
                    >
                        {isLogin ? 'KAYIT OL' : 'GİRİŞ YAP'}
                    </button>
                </p>

                {/* Kurum Bilgisi */}
                <div className="mt-8 text-center">
                    <p className="text-[9px] text-zinc-700 uppercase tracking-widest">
                        Demo Kurumlar: XYZ Kurumları • ABC Kurumları
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Auth;
