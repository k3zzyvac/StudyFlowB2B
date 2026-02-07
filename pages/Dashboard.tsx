
import React, { useRef, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Note, NoteType, UserRole, SchoolClass, WeeklyReport } from '../types';
import { aiHelper } from '../lib/aiHelper';
import { useLanguage } from '../lib/LanguageContext';
import { PrincipalCharts } from '../components/PrincipalCharts';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';

const NoteRow: React.FC<{ note: Note, onClick: () => void, onShare: (e: any) => void, onDelete: (e: any) => void }> = ({ note, onClick, onShare, onDelete }) => (
    <div onClick={onClick} className="group flex items-center justify-between p-4 bg-[#18181B] border border-[#27272A] rounded-xl cursor-pointer hover:border-purple-500/50 hover:bg-[#202025] transition-all mb-2">
        <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${note.type === 'ai' ? 'bg-purple-600/20 text-purple-400' : 'bg-gray-700/30 text-gray-400'}`}>
                <i className={`fas ${note.type === 'ai' ? 'fa-robot' : 'fa-sticky-note'}`}></i>
            </div>
            <div>
                <h4 className="text-white font-bold text-sm mb-0.5">{note.title || 'Adsız Not'}</h4>
                <div className="flex items-center gap-2 text-[10px] text-gray-500">
                    <span>{new Date(note.created_at).toLocaleDateString()}</span>
                    {note.folder_id && <span className="px-1.5 py-0.5 rounded bg-gray-800 text-gray-400">Klasör</span>}
                </div>
            </div>
        </div>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={onShare} className="w-8 h-8 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors"><i className="fas fa-share-alt"></i></button>
            <button onClick={onDelete} className="w-8 h-8 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 flex items-center justify-center transition-colors"><i className="fas fa-trash"></i></button>
        </div>
    </div>
);

// --- STUDENT COMPONENTS & LOGIC ---
const StudentDashboard: React.FC<{
    notes: Note[],
    onNoteClick: (note: Note) => void,
    onDeleteNote: (id: string) => void,
    onShareNote: (id: string) => void,
    onNewNote: () => void,
    onUploadPdf: (e: React.ChangeEvent<HTMLInputElement>) => void,
    fileInputRef: React.RefObject<HTMLInputElement>,
    assignments: any[],
    onAssignmentClick: (assignment: any) => void,
    institutionName: string,
    institutionLogo: string | null,
    classDisplay: string,
    userName: string
}> = ({ notes, onNoteClick, onDeleteNote, onShareNote, onNewNote, onUploadPdf, fileInputRef, assignments, onAssignmentClick, institutionName, institutionLogo, classDisplay, userName }) => {

    const { t } = useLanguage();

    return (
        <div className="flex flex-col gap-6 pb-20">
            {/* ÖĞRENCİ BİLGİ HEADER */}
            <div className="bg-gradient-to-r from-purple-900/20 to-indigo-900/20 border border-purple-500/20 rounded-2xl p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {institutionLogo ? (
                            <img src={institutionLogo} alt="Logo" className="w-14 h-14 object-contain rounded-2xl bg-white p-1 shadow-lg" />
                        ) : (
                            <div className="w-14 h-14 bg-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black">
                                <i className="fas fa-user-graduate"></i>
                            </div>
                        )}
                        <div>
                            <h2 className="text-white font-bold text-lg">{userName}</h2>
                            <p className="text-purple-400 text-sm font-medium">
                                <i className="fas fa-building mr-2"></i>{institutionName}
                            </p>
                            <p className="text-gray-500 text-xs">
                                <i className="fas fa-users mr-1"></i>Sınıf: <strong className="text-white">{classDisplay}</strong>
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-bold">Öğrenci Paneli</div>
                        <div className="text-[10px] text-gray-500">StudyFlow Pro</div>
                    </div>
                </div>
            </div>

            <input type="file" ref={fileInputRef} onChange={onUploadPdf} accept="application/pdf" className="hidden" />

            {/* ACTION CARDS ROW */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button onClick={onNewNote} className="group flex flex-col items-center justify-center gap-2 p-5 bg-white text-black rounded-2xl transition-all hover:scale-105 shadow-xl shadow-white/5 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-white opacity-50"></div>
                    <div className="w-12 h-12 rounded-full bg-black/5 flex items-center justify-center text-2xl relative z-10 group-hover:bg-black/10 transition-colors"><i className="fas fa-plus"></i></div>
                    <div className="font-bold text-sm relative z-10">{t('new_note')}</div>
                </button>

                <button onClick={() => fileInputRef.current?.click()} className="group flex flex-col items-center justify-center gap-2 p-5 bg-[#18181B] border border-[#27272A] hover:border-indigo-500 text-white rounded-2xl transition-all hover:-translate-y-1 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-10"><i className="fas fa-file-pdf text-6xl"></i></div>
                    <div className="w-10 h-10 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center text-lg"><i className="fas fa-file-pdf"></i></div>
                    <div className="font-bold text-xs">{t('pdf_analysis')}</div>
                </button>

                <Link to="/exam" className="flex flex-col items-center justify-center gap-2 p-5 bg-[#18181B] border border-[#27272A] hover:border-purple-500 text-white rounded-2xl transition-all hover:-translate-y-1 group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-10"><i className="fas fa-graduation-cap text-6xl"></i></div>
                    <div className="w-10 h-10 rounded-full bg-purple-600/20 text-purple-400 flex items-center justify-center text-lg"><i className="fas fa-file-signature"></i></div>
                    <div className="font-bold text-xs">{t('exam_center_card')}</div>
                </Link>

                <button onClick={() => window.dispatchEvent(new Event('open-pomodoro'))} className="flex flex-col items-center justify-center gap-2 p-5 bg-[#18181B] border border-[#27272A] hover:border-green-500 text-white rounded-2xl transition-all hover:-translate-y-1 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-10"><i className="fas fa-clock text-6xl"></i></div>
                    <div className="w-10 h-10 rounded-full bg-green-600/20 text-green-400 flex items-center justify-center text-lg"><i className="fas fa-stopwatch"></i></div>
                    <div className="font-bold text-xs">{t('pomodoro')}</div>
                </button>
            </div>

            {/* ATANAN ÖDEVLER VE NOTLAR - Sadece öğrencinin sınıfına atananlar */}
            <div className="flex items-center justify-between mb-2 px-2">
                <h2 className="text-gray-400 font-bold text-xs uppercase tracking-widest">Atanan Ödevler & Notlar</h2>
                <span className="text-gray-600 text-xs font-mono">{assignments.length} Yeni</span>
            </div>

            <div className="flex flex-col space-y-2 mb-8">
                {assignments.length === 0 ? (
                    <div className="py-4 text-center border border-dashed border-[#27272A] rounded-xl text-gray-600 text-xs">Henüz atanmış bir şey yok.</div>
                ) : (
                    assignments.map((asgn: any) => (
                        <div key={asgn.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-900/10 to-transparent border border-purple-500/20 rounded-xl">
                            <div className="flex items-center gap-4">
                                <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center">
                                    <i className={`fas ${asgn.type === 'exam' ? 'fa-file-signature' : 'fa-sticky-note'}`}></i>
                                </div>
                                <div>
                                    <h4 className="text-white font-bold text-sm">{asgn.title}</h4>
                                    <span className="text-[10px] text-gray-500">Öğretmen tarafından atandı</span>
                                </div>
                            </div>
                            <button onClick={() => onAssignmentClick(asgn)} className="text-xs bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-lg font-bold transition-colors">Görüntüle</button>
                        </div>
                    ))
                )}
            </div>

            {/* LIST HEADER */}
            <div className="flex items-center justify-between mb-4 px-2">
                <h2 className="text-gray-400 font-bold text-xs uppercase tracking-widest">{t('my_files')}</h2>
                <span className="text-gray-600 text-xs font-mono">{notes.length} Dosya</span>
            </div>

            {/* NOTES LIST */}
            <div className="flex flex-col space-y-2">
                {notes.map(note => (
                    <NoteRow
                        key={note.id}
                        note={note}
                        onClick={() => onNoteClick(note)}
                        onShare={(e) => { e.stopPropagation(); onShareNote(note.id); }}
                        onDelete={(e) => { e.stopPropagation(); onDeleteNote(note.id); }}
                    />
                ))}

                {notes.length === 0 && (
                    <div className="py-20 text-center border-2 border-dashed border-[#27272A] rounded-2xl bg-[#18181B]/30">
                        <div className="w-16 h-16 bg-[#27272A] rounded-full flex items-center justify-center mx-auto mb-4"><i className="fas fa-cloud-upload-alt text-2xl text-gray-600"></i></div>
                        <h3 className="text-white font-medium">{t('empty_folder')}</h3>
                        <p className="text-gray-500 text-sm mt-2">Yeni not oluşturarak başla.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- TEACHER DASHBOARD ---
const TeacherDashboard: React.FC<{
    onAiNoteGen: () => void,
    onExamGen: () => void,
    onClassLog: () => void,
    notes: Note[],
    onAssignOpen: (id: string, type: 'note' | 'exam', title: string) => void,
    onNoteClick: (note: Note) => void,
    institutionName: string,
    institutionLogo: string | null
}> = ({ onAiNoteGen, onExamGen, onClassLog, notes, onAssignOpen, onNoteClick, institutionName, institutionLogo }) => {
    return (
        <div className="flex flex-col gap-8 h-full overflow-y-auto p-4 md:p-8">
            <div className="flex items-center gap-4">
                {institutionLogo ? (
                    <img src={institutionLogo} alt="Logo" className="w-14 h-14 object-contain rounded-2xl bg-white p-1 shadow-lg" />
                ) : (
                    <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black">
                        <i className="fas fa-chalkboard-teacher"></i>
                    </div>
                )}
                <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Öğretmen Paneli</h2>
                    <p className="text-indigo-400 text-sm font-bold">
                        <i className="fas fa-building mr-2"></i>{institutionName}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* 1. AI NOT OLUŞTURUCU (MODALI AÇAR) */}
                <button onClick={onAiNoteGen} className="group flex flex-col items-center justify-center gap-2 p-8 bg-white text-black rounded-2xl transition-all hover:scale-105 shadow-xl shadow-white/5 relative overflow-hidden h-40">
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-white opacity-50"></div>
                    <div className="w-14 h-14 rounded-full bg-black/5 flex items-center justify-center text-3xl relative z-10 group-hover:bg-black/10 transition-colors">
                        <i className="fas fa-plus"></i>
                    </div>
                    <div className="font-bold text-base relative z-10">Yeni Not (AI / Manuel)</div>
                </button>

                {/* 2. SINAV OLUŞTURUCU */}
                <div onClick={onExamGen} className="bg-[#18181B] border border-[#27272A] p-6 rounded-2xl hover:border-purple-500 transition-all cursor-pointer group relative overflow-hidden h-40 flex flex-col justify-between">
                    <div className="absolute top-0 right-0 p-4 opacity-10 text-8xl text-purple-500"><i className="fas fa-file-signature"></i></div>
                    <div className="w-12 h-12 bg-purple-600/20 text-purple-400 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                        <i className="fas fa-file-signature"></i>
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-lg">Sınav Oluşturucu</h3>
                        <p className="text-gray-400 text-xs mt-1">Konu bazlı testler hazırla.</p>
                    </div>
                </div>

                {/* 3. SINIF GÜNLÜĞÜ */}
                <div onClick={onClassLog} className="bg-gradient-to-br from-orange-900/10 to-amber-900/10 border border-orange-500/30 p-6 rounded-2xl relative overflow-hidden hover:border-orange-500 transition-all cursor-pointer group h-40 flex flex-col justify-between">
                    <div className="absolute top-2 right-2 bg-orange-500/20 text-orange-400 text-[10px] font-bold px-2 py-1 rounded border border-orange-500/30">AKTİF</div>
                    <div className="w-12 h-12 bg-orange-600/20 text-orange-400 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                        <i className="fas fa-users"></i>
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-lg">Sınıf Günlüğü</h3>
                        <p className="text-gray-400 text-xs mt-1">Haftalık ders raporlarını gir.</p>
                    </div>
                </div>
            </div>

            <div className="mt-4">
                <div className="flex items-center justify-between mb-4 px-2">
                    <h2 className="text-gray-400 font-bold text-xs uppercase tracking-widest text-white">Hazırladığım Notlar</h2>
                    <span className="text-gray-600 text-xs font-mono">{notes.length} Dosya</span>
                </div>
                <div className="flex flex-col space-y-3">
                    {notes.length === 0 ? (
                        <div className="p-8 border-2 border-dashed border-[#27272A] rounded-2xl text-center text-gray-500 bg-[#121214]">
                            <i className="fas fa-file-alt text-4xl mb-3 opacity-50 text-purple-500"></i>
                            <p>Henüz bir not oluşturmadınız.</p>
                        </div>
                    ) : (
                        notes.map(note => (
                            <div key={note.id} className="group flex items-center justify-between p-4 bg-[#18181B] border border-[#27272A] rounded-xl hover:border-purple-500/50 transition-all">
                                <div className="flex items-center gap-4 cursor-pointer" onClick={() => onNoteClick(note)}>
                                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center text-lg group-hover:bg-purple-500 group-hover:text-white transition-all">
                                        <i className="fas fa-file-alt"></i>
                                    </div>
                                    <div>
                                        <h4 className="text-white font-bold text-sm tracking-tight">{note.title}</h4>
                                        <p className="text-[10px] text-gray-500 uppercase font-black">{new Date(note.created_at).toLocaleDateString('tr-TR')}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => onAssignOpen(note.id, 'note', note.title)}
                                    className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-4 py-2 rounded-lg transition-all flex items-center gap-2"
                                >
                                    <i className="fas fa-share-square"></i> Atama Yap
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="p-8 border-2 border-dashed border-[#27272A] rounded-2xl text-center text-gray-500">
                <i className="fas fa-chart-pie text-4xl mb-3 opacity-50 text-indigo-500"></i>
                <p>Detaylı sınıf analizleri ve grafikler burada görüntülenecek.</p>
            </div>
        </div>
    );
};

// --- PRINCIPAL DASHBOARD ---
const PrincipalDashboard: React.FC<{ weeklyReports: WeeklyReport[], onClassChange: () => void, institutionName: string, institutionLogo: string | null }> = ({ weeklyReports: initialReports, onClassChange, institutionName, institutionLogo }) => {
    const [reports, setReports] = useState<WeeklyReport[]>([]);
    const [classList, setClassList] = useState<SchoolClass[]>([]);
    const [showAddClassModal, setShowAddClassModal] = useState(false);
    const [showDeleteClassModal, setShowDeleteClassModal] = useState(false);
    const [classToDelete, setClassToDelete] = useState<SchoolClass | null>(null);

    // View State: 'classes' -> 'dates' -> 'reports' -> 'detail'
    const [viewMode, setViewMode] = useState<'classes' | 'dates' | 'reports' | 'detail'>('classes');
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [activeReport, setActiveReport] = useState<WeeklyReport | null>(null);
    // Sınıf Ekleme State'leri
    const [newClassGrade, setNewClassGrade] = useState('9');
    const [newClassBranch, setNewClassBranch] = useState('A');
    const [analyticsData, setAnalyticsData] = useState({
        classDensity: [] as { name: string, value: number, color: string }[],
        assignmentTrend: [] as { day: string, count: number }[],
        activeRatio: { active: 0, total: 0 },
        totals: { students: 0, assignments: 0, classes: 0, reports: 0 }
    });

    useEffect(() => {
        fetchClasses();
        setReports(initialReports);
        fetchAnalytics();
    }, [initialReports, institutionName]);

    const fetchAnalytics = async () => {
        let instId = localStorage.getItem('institution_id');

        // Reliability: Get institution_id from profile if missing from localStorage
        if (!instId || instId === 'null') {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: prof } = await supabase.from('profiles').select('institution_id').eq('user_id', user.id).maybeSingle();
                if (prof?.institution_id) {
                    instId = prof.institution_id;
                    localStorage.setItem('institution_id', instId as string);
                }
            }
        }

        if (!instId) return;

        try {
            // 1. Class Density
            const { data: students } = await supabase.from('profiles').select('class_id').eq('institution_id', instId).eq('role', 'student');
            const { data: classes } = await supabase.from('classes').select('id, grade, branch').eq('institution_id', instId);

            if (students && classes) {
                const colors = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];
                const density = classes.map((c, i) => ({
                    name: `${c.grade}-${c.branch}`,
                    value: students.filter(s => s.class_id === c.id).length,
                    color: colors[i % colors.length]
                })).filter(d => d.value > 0);
                setAnalyticsData(prev => ({ ...prev, classDensity: density }));
            }

            // 2. Assignment Trend (Last 7 Days)
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const { data: assignments } = await supabase.from('assignments').select('created_at').eq('institution_id', instId).gte('created_at', sevenDaysAgo.toISOString());

            if (assignments) {
                const days = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
                const trend = Array.from({ length: 7 }).map((_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() - (6 - i));
                    const dayName = days[d.getDay()];
                    const count = assignments.filter(a => new Date(a.created_at).toDateString() === d.toDateString()).length;
                    return { day: dayName, count };
                });
                setAnalyticsData(prev => ({ ...prev, assignmentTrend: trend }));
            }

            // 3. Active Ratio (Used AI today)
            const today = new Date().toISOString().split('T')[0];
            const { data: allStudents } = await supabase.from('profiles').select('last_usage_reset').eq('institution_id', instId).eq('role', 'student');
            if (allStudents) {
                const active = allStudents.filter(s => s.last_usage_reset && s.last_usage_reset.startsWith(today)).length;
                setAnalyticsData(prev => ({ ...prev, activeRatio: { active, total: allStudents.length } }));
            }

            // 4. Totals for Summary Cards
            const { count: studentCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('institution_id', instId).eq('role', 'student');
            const { count: assignmentCount } = await supabase.from('assignments').select('*', { count: 'exact', head: true }).eq('institution_id', instId);
            const { count: classCount } = await supabase.from('classes').select('*', { count: 'exact', head: true }).eq('institution_id', instId);
            const { count: reportCount } = await supabase.from('weekly_reports').select('*', { count: 'exact', head: true }).eq('institution_id', instId);

            setAnalyticsData(prev => ({
                ...prev,
                totals: {
                    students: studentCount || 0,
                    assignments: assignmentCount || 0,
                    classes: classCount || 0,
                    reports: reportCount || 0
                }
            }));
        } catch (e) {
            console.error("Analytics fetch fail", e);
        }
    };

    const getSelectedClassLabel = () => {
        const cls = classList.find(c => c.id === selectedClass);
        return cls ? `${cls.grade}-${cls.branch}` : selectedClass;
    };

    const fetchClasses = async () => {
        try {
            // Get institution ID either from PC helper (via RLS) or localStorage if needed for filtering
            const instId = localStorage.getItem('institution_id');

            if (!instId || instId.trim() === '') return;

            // Supabase'den çek
            const { data, error } = await supabase
                .from('classes')
                .select('*')
                .eq('institution_id', instId) // RLS de bunu yapıyor ama extra güvenlik
                .order('grade', { ascending: true })
                .order('branch', { ascending: true });

            if (error) throw error;

            if (data) {
                setClassList(data as SchoolClass[]);
            }
        } catch (error) {
            console.error('Sınıf çekme hatası:', error);
            toast.error('Sınıflar yüklenirken hata oluştu');
        }
    };

    const handleAddClass = async () => {
        const instId = localStorage.getItem('institution_id');

        if (!instId || instId === '' || instId === 'null') {
            toast.error('Kurum kimliği eksik! Lütfen tekrar giriş yapın.');
            console.error('AddClass Error: institution_id is missing/empty');
            return;
        }

        try {
            const { data, error } = await supabase.from('classes').insert([{
                institution_id: instId,
                grade: newClassGrade,
                branch: newClassBranch.toUpperCase()
            }]).select().single();

            if (error) throw error;

            if (data) {
                setClassList([...classList, data as SchoolClass]);
                toast.success(`${newClassGrade}-${newClassBranch.toUpperCase()} sınıfı eklendi`);
                setShowAddClassModal(false);
                setNewClassGrade('9');
                setNewClassBranch('A');
            }
        } catch (error) {
            console.error('Sınıf ekleme hatası:', error);
            toast.error('Sınıf eklenirken hata oluştu');
        }
    };

    const handleDeleteClass = (cls: SchoolClass) => {
        setClassToDelete(cls);
        setShowDeleteClassModal(true);
    };

    const confirmDeleteClass = async () => {
        if (!classToDelete) return;

        try {
            const { error } = await supabase.from('classes').delete().eq('id', classToDelete.id);

            if (error) throw error;

            const updatedClasses = classList.filter(c => c.id !== classToDelete.id);
            setClassList(updatedClasses);

            toast.success(`${classToDelete.grade}-${classToDelete.branch} sınıfı silindi`);
            setShowDeleteClassModal(false);
            setClassToDelete(null);
        } catch (error) {
            console.error('Sınıf silme hatası:', error);
            toast.error('Sınıf silinirken hata oluştu');
        }
    };

    const handleDeleteReport = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Bu raporu silmek istediğinize emin misiniz?")) return;

        try {
            const { error } = await supabase.from('weekly_reports').delete().eq('id', id);

            if (error) throw error;

            const updated = reports.filter(r => r.id !== id);
            setReports(updated);

            // Parent'a da bildirmek gerekebilir ama şimdilik local state yetsin
            // Gerçek zamanlı güncellemeyi parent dashboard yapmalı

            toast.success("Rapor başarıyla silindi");
            if (activeReport?.id === id) setViewMode('reports');
        } catch (error) {
            console.error('Rapor silme hatası:', error);
            toast.error('Rapor silinirken hata oluştu');
        }
    };

    // Günlük raporlar - tarihe göre grupla
    const getUniqueDates = () => {
        // Hem ID hem de isim (eski veri) ile eşleşenleri bul
        const classReports = reports.filter(r => {
            if (r.class_id === selectedClass) return true;
            const cls = classList.find(c => c.id === selectedClass);
            if (cls && r.class_id === `${cls.grade}-${cls.branch}`) return true;
            return false;
        });
        const dates = Array.from(new Set(classReports.map(r => r.date)));
        return dates.sort().reverse();
    };

    const getReportsForDate = () => {
        return reports.filter(r => {
            const dateMatch = r.date === selectedDate;
            const classMatch = r.class_id === selectedClass || (() => {
                const cls = classList.find(c => c.id === selectedClass);
                return cls && r.class_id === `${cls.grade}-${cls.branch}`;
            })();
            return dateMatch && classMatch;
        });
    };

    const generateWeeklyPDF = () => {
        const dateReports = getReportsForDate();
        const element = document.createElement('div');
        const dateStr = selectedDate ? new Date(selectedDate).toLocaleDateString('tr-TR') : '';
        // PDF için Beyaz Arka Plan, Siyah Yazı (Light Mode)
        element.innerHTML = `
            <div style="padding: 40px; font-family: 'Segoe UI', Arial, sans-serif; background: white !important; color: black !important; width: 100%;">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px;">
                    <div style="text-align: left;">
                        <h1 style="margin: 0; font-size: 24px; color: #000; font-weight: 900; letter-spacing: 1px;">GÜNLÜK SINIF RAPORU</h1>
                        <p style="margin: 5px 0; color: #444; font-size: 14px;">${getSelectedClassLabel()} | ${dateStr} | ${institutionName}</p>
                    </div>
                    ${institutionLogo ? `<img src="${institutionLogo}" crossOrigin="anonymous" style="height: 60px; object-fit: contain;" />` : ''}
                </div>
                <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; border: 1px solid #000;">
                    <thead>
                        <tr style="background-color: #f0f0f0; color: #000;">
                            <th style="border: 1px solid #000; padding: 10px; text-align: left; font-weight: bold;">Ders / Öğretmen</th>
                            <th style="border: 1px solid #000; padding: 10px; text-align: left; font-weight: bold;">Konu</th>
                            <th style="border: 1px solid #000; padding: 10px; text-align: left; font-weight: bold;">Notlar</th>
                            <th style="border: 1px solid #000; padding: 10px; text-align: center; font-weight: bold;">Puan</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${dateReports.map((r: WeeklyReport) => `
                            <tr style="border-bottom: 1px solid #000;">
                                <td style="border: 1px solid #000; padding: 10px; color: #000;">
                                    <div style="font-weight: bold;">${r.lesson}</div>
                                    <div style="font-size: 11px; color: #444;">${r.teacher_name}</div>
                                </td>
                                <td style="border: 1px solid #000; padding: 10px; color: #000;">${r.topic}</td>
                                <td style="border: 1px solid #000; padding: 10px; color: #000;">${r.note}</td>
                                <td style="border: 1px solid #000; padding: 10px; text-align: center; font-weight: bold; color: #000;">${r.rating}/5</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <div style="margin-top: 40px; text-align: right; font-size: 10px; color: #666; border-top: 1px solid #ccc; padding-top: 10px;">
                    Rapor Oluşturulma Tarihi: ${new Date().toLocaleDateString('tr-TR')} | StudyFlow - ${institutionName}
                </div>
            </div>
        `;

        const opt = {
            margin: 0.5,
            filename: `${getSelectedClassLabel().replace(/\//g, '-')}_${dateStr}_Raporu.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' }
        };
        const html2pdf = (window as any).html2pdf;
        if (html2pdf) html2pdf().set(opt).from(element).save();
    };

    const generateDetailPDF = (report: WeeklyReport) => {
        const element = document.createElement('div');
        // PDF için Beyaz Arka Plan, Siyah Yazı (Light Mode)
        element.innerHTML = `
            <div style="padding: 50px; font-family: 'Segoe UI', Arial, sans-serif; background: white !important; color: black !important; width: 100%;">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #000; padding-bottom: 20px; margin-bottom: 40px;">
                    <div style="text-align: left;">
                        <h1 style="margin: 0; font-size: 28px; color: #000; font-weight: 900; letter-spacing: 2px;">DERS DEĞERLENDİRME FORMU</h1>
                        <p style="margin: 10px 0 0; color: #444; font-size: 14px; font-weight: bold;">STUDYFLOW EĞİTİM YÖNETİM SİSTEMİ</p>
                    </div>
                    ${institutionLogo ? `<img src="${institutionLogo}" crossOrigin="anonymous" style="height: 70px; object-fit: contain;" />` : ''}
                </div>
                
                <div style="display: grid; grid-template-cols: 1fr 1fr; gap: 30px; margin-bottom: 40px; border: 1px solid #000; padding: 20px; border-radius: 4px;">
                    <div style="font-size: 14px;"><strong>SINIF:</strong> <span style="margin-left: 10px;">${getSelectedClassLabel()}</span></div>
                    <div style="font-size: 14px;"><strong>TARİH:</strong> <span style="margin-left: 10px;">${new Date(report.date).toLocaleDateString('tr-TR')}</span></div>
                    <div style="font-size: 14px;"><strong>ÖĞRETMEN:</strong> <span style="margin-left: 10px;">${report.teacher_name}</span></div>
                    <div style="font-size: 14px;"><strong>DERS:</strong> <span style="margin-left: 10px;">${report.lesson}</span></div>
                </div>

                <div style="margin-bottom: 30px;">
                    <h3 style="margin: 0 0 10px; font-size: 16px; border-bottom: 1px solid #000; padding-bottom: 5px; color: #000;">KONU</h3>
                    <div style="background: #f9f9f9; padding: 15px; border: 1px solid #ddd; color: #000; font-size: 14px;">
                        ${report.topic}
                    </div>
                </div>

                <div style="margin-bottom: 30px;">
                    <h3 style="margin: 0 0 10px; font-size: 16px; border-bottom: 1px solid #000; padding-bottom: 5px; color: #000;">DEĞERLENDİRME & NOTLAR</h3>
                    <div style="background: #f9f9f9; padding: 15px; border: 1px solid #ddd; color: #000; font-size: 14px; min-height: 100px;">
                        ${report.note}
                    </div>
                </div>

                <div style="margin-top: 50px; text-align: center; border: 2px solid #000; padding: 20px; width: 200px; margin-left: auto; margin-right: auto;">
                    <div style="font-size: 12px; color: #666; margin-bottom: 5px;">DERS PUANI</div>
                    <div style="font-size: 32px; font-weight: 900; color: #000;">${report.rating} / 5</div>
                </div>

                <div style="margin-top: 60px; text-align: center; font-size: 10px; color: #888;">
                    Bu belge StudyFlow tarafından otomatik olarak oluşturulmuştur.
                </div>
            </div>
        `;

        const opt = {
            margin: 0,
            filename: `Rapor_Detay_${report.class_id}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
        };
        const html2pdf = (window as any).html2pdf;
        if (html2pdf) html2pdf().set(opt).from(element).save();
    };

    return (
        <div className="flex flex-col gap-8 h-full overflow-y-auto p-4 md:p-8 bg-[#09090B]">
            <header className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div
                        onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/*';
                            input.onchange = async (e: any) => {
                                const file = e.target.files[0];
                                if (!file) return;
                                try {
                                    const instId = localStorage.getItem('institution_id');
                                    if (!instId) { toast.error("Kurum ID bulunamadı"); return; }
                                    const fileExt = file.name.split('.').pop();
                                    const fileName = `${instId}_logo_${Date.now()}.${fileExt}`;
                                    const { error: uploadError } = await supabase.storage.from('logos').upload(fileName, file);
                                    if (uploadError) throw uploadError;
                                    const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(fileName);
                                    const { error: updateError } = await supabase.from('institutions').update({ logo_url: publicUrl }).eq('id', instId);
                                    if (updateError) throw updateError;
                                    toast.success("Logo başarıyla güncellendi");
                                    window.location.reload();
                                } catch (err: any) { console.error("Logo upload error:", err); toast.error("Logo yüklenirken hata oluştu"); }
                            };
                            input.click();
                        }}
                        className="cursor-pointer group relative"
                        title="Logo Değiştir"
                    >
                        {institutionLogo ? (
                            <img src={institutionLogo} alt="Logo" className="w-16 h-16 object-contain rounded-2xl bg-white p-1 shadow-lg group-hover:opacity-80 transition-opacity" />
                        ) : (
                            <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center text-white text-3xl font-black group-hover:bg-purple-700 transition-colors">
                                <i className="fas fa-building"></i>
                            </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity">
                            <i className="fas fa-camera text-white text-sm"></i>
                        </div>
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-white tracking-tight mb-0 uppercase">YÖNETİM PANELİ</h2>
                        <p className="text-purple-400 text-sm font-bold flex items-center gap-2">{institutionName}</p>
                        <p className="text-gray-500 text-xs mt-1">
                            {viewMode === 'classes' && 'Sınıf Listesi'}
                            {viewMode === 'dates' && `${getSelectedClassLabel()} - Günlük Raporlar`}
                            {viewMode === 'reports' && `${getSelectedClassLabel()} - ${new Date(selectedDate).toLocaleDateString('tr-TR')} Raporları`}
                            {viewMode === 'detail' && 'Rapor Detayı'}
                        </p>
                    </div>
                </div>
                {viewMode !== 'classes' && (
                    <button onClick={() => {
                        if (viewMode === 'detail') setViewMode('reports');
                        else if (viewMode === 'reports') setViewMode('dates');
                        else setViewMode('classes');
                    }} className="bg-[#18181B] border border-[#27272A] text-gray-400 hover:text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold transition-all shadow-lg hover:border-purple-500/50">
                        <i className="fas fa-arrow-left"></i> Geri Dön
                    </button>
                )}
            </header>

            <PrincipalCharts data={analyticsData} />

            {(() => {
                const getClassStatus = (classId: string) => {
                    const classReports = reports
                        .filter(r => r.class_id === classId)
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .slice(0, 3);
                    if (classReports.length === 0) return { color: 'text-gray-600', label: 'Veri Yok', icon: 'fa-minus', avg: 0 };
                    const avg = classReports.reduce((acc, curr) => acc + curr.rating, 0) / classReports.length;
                    if (avg >= 4.5) return { color: 'text-[#4ADE80]', label: 'Mükemmel', icon: 'fa-star', avg };
                    if (avg >= 3.0) return { color: 'text-[#16A34A]', label: 'İyi', icon: 'fa-check-circle', avg };
                    if (avg >= 2.0) return { color: 'text-[#FACC15]', label: 'Dikkat', icon: 'fa-exclamation-triangle', avg };
                    return { color: 'text-[#EF4444]', label: 'Kritik Durum', icon: 'fa-bell', avg };
                };

                return (
                    <div className="animate-fade-in pb-10">
                        {viewMode === 'classes' && (
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                {classList.map(cls => {
                                    const status = getClassStatus(cls.id);
                                    return (
                                        <div key={cls.id} className="relative group">
                                            <button onClick={() => { setSelectedClass(cls.id); setViewMode('dates'); }}
                                                className={`w-full p-6 rounded-3xl border ${status.avg < 2 && status.avg > 0 ? 'border-red-600/50 bg-red-900/10' : 'border-[#27272A] bg-[#18181B]'} hover:border-purple-500 hover:bg-[#202025] transition-all shadow-xl`}>
                                                <div className="text-3xl font-black text-white group-hover:text-purple-400 transition-colors mb-1">
                                                    {cls.grade}-{cls.branch}
                                                </div>
                                                <div className="flex flex-col items-center gap-1">
                                                    <div className={`text-[10px] uppercase font-bold ${status.color} flex items-center gap-1.5`}>
                                                        <i className={`fas ${status.icon}`}></i>
                                                        {status.label}
                                                    </div>
                                                    <div className="text-[9px] text-gray-500 font-bold opacity-60">Sınıf Dosyası</div>
                                                    {status.avg > 0 && (
                                                        <div className="flex gap-0.5 mt-1">
                                                            {[1, 2, 3, 4, 5].map(star => (
                                                                <div key={star} className={`w-1.5 h-1.5 rounded-full ${star <= Math.round(status.avg) ? status.color.replace('text-', 'bg-') : 'bg-gray-800'}`}></div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </button>
                                            <button onClick={() => handleDeleteClass(cls)} className="absolute -top-2 -right-2 w-7 h-7 bg-red-600 hover:bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-lg z-10">
                                                <i className="fas fa-times"></i>
                                            </button>
                                        </div>
                                    );
                                })}
                                <button onClick={() => setShowAddClassModal(true)} className="p-6 rounded-3xl border border-dashed border-[#27272A] hover:border-white text-gray-500 hover:text-white transition-all flex flex-col items-center justify-center gap-2 group">
                                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                                        <i className="fas fa-plus text-xl"></i>
                                    </div>
                                    <span className="text-xs font-bold">Sınıf Ekle</span>
                                </button>
                            </div>
                        )}

                        {viewMode === 'dates' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {getUniqueDates().length === 0 ? (
                                    <div className="col-span-full border border-dashed border-[#27272A] rounded-3xl py-20 text-center text-gray-500 flex flex-col items-center gap-4">
                                        <i className="fas fa-calendar-times text-4xl opacity-20"></i>
                                        <p className="font-bold">Bu sınıfa ait günlük rapor bulunamadı.</p>
                                    </div>
                                ) : (
                                    getUniqueDates().map(date => (
                                        <button key={date} onClick={() => { setSelectedDate(date); setViewMode('reports'); }}
                                            className="flex items-center gap-4 p-6 rounded-2xl border border-[#27272A] bg-[#18181B] hover:border-blue-500 hover:bg-[#202025] transition-all text-left group">
                                            <div className="w-14 h-14 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform"><i className="fas fa-calendar-day"></i></div>
                                            <div>
                                                <h4 className="text-white font-bold">{new Date(date).toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h4>
                                                <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest font-black">{reports.filter(r => r.class_id === selectedClass && r.date === date).length} YÜKLENEN RAPOR</p>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        )}

                        {viewMode === 'reports' && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center bg-[#18181B]/50 p-4 rounded-2xl border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-8 bg-purple-600 rounded-full"></div>
                                        <h3 className="text-white font-black uppercase tracking-tight">{new Date(selectedDate).toLocaleDateString('tr-TR')} - {getSelectedClassLabel()}</h3>
                                    </div>
                                    <button onClick={generateWeeklyPDF} className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-black text-sm hover:bg-emerald-500 transition-all flex items-center gap-2 shadow-lg shadow-emerald-900/40">
                                        <i className="fas fa-file-pdf"></i> GÜNLÜK PDF ÇIKTISI
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {getReportsForDate().length === 0 ? (
                                        <div className="col-span-full border border-dashed border-[#27272A] rounded-3xl py-20 text-center text-gray-500">Bu tarihe ait rapor bulunamadı.</div>
                                    ) : (
                                        getReportsForDate().map(r => (
                                            <div key={r.id} onClick={() => { setActiveReport(r); setViewMode('detail'); }} className="group bg-[#18181B] border border-[#27272A] p-5 rounded-3xl hover:border-purple-500 transition-all cursor-pointer relative shadow-lg">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="w-12 h-12 bg-purple-500/10 text-purple-400 rounded-2xl flex items-center justify-center text-xl shadow-inner"><i className="fas fa-file-alt"></i></div>
                                                    <button onClick={(e) => handleDeleteReport(r.id, e)} className="text-gray-600 hover:text-red-500 p-2 hover:bg-red-500/10 rounded-lg transition-colors"><i className="fas fa-trash"></i></button>
                                                </div>
                                                <h4 className="text-white font-black text-lg mb-1 truncate">{r.lesson}</h4>
                                                <p className="text-purple-400 font-bold text-xs uppercase mb-2">{r.teacher_name}</p>
                                                <p className="text-gray-500 text-xs line-clamp-2 leading-relaxed">{r.topic}</p>
                                                <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                                                    <div className="flex gap-1">{[...Array(5)].map((_, i) => <i key={i} className={`fas fa-star text-[10px] ${i < r.rating ? 'text-yellow-500' : 'text-gray-800'}`}></i>)}</div>
                                                    <span className="text-[10px] text-gray-400 font-black">{r.rating}/5 Puan</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {viewMode === 'detail' && activeReport && (
                            <div className="bg-white rounded-[2rem] p-10 max-w-4xl mx-auto text-black shadow-2xl animate-fade-in relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-purple-600 to-indigo-600"></div>
                                <div className="mb-10 border-b-2 border-gray-100 pb-6 flex justify-between items-end">
                                    <div>
                                        <span className="text-[10px] font-black text-purple-600 uppercase tracking-[0.3em] mb-2 block">Resmi Ders Raporu</span>
                                        <h1 className="text-4xl font-black text-gray-900 tracking-tight leading-none uppercase">RAPOR DETAYI</h1>
                                        <p className="text-gray-400 font-bold mt-2 flex items-center gap-2">
                                            <i className="fas fa-calendar-day"></i> {new Date(activeReport.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end gap-3">
                                        {institutionLogo && <img src={institutionLogo} alt="Logo" className="h-16 object-contain" />}
                                        <button onClick={() => generateDetailPDF(activeReport)} className="bg-gray-900 text-white px-6 py-3 rounded-2xl text-xs font-black hover:bg-black transition-all flex items-center gap-2 shadow-xl">
                                            <i className="fas fa-file-pdf"></i> PDF OLARAK İNDİR
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                    <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                                        <label className="text-[10px] font-black text-gray-400 block mb-2 uppercase tracking-widest">Ders Adı</label>
                                        <div className="font-black text-2xl text-gray-800">{activeReport.lesson}</div>
                                    </div>
                                    <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                                        <label className="text-[10px] font-black text-gray-400 block mb-2 uppercase tracking-widest">Öğretmen</label>
                                        <div className="font-black text-2xl text-gray-800">{activeReport.teacher_name}</div>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100 shadow-inner">
                                        <label className="text-[10px] font-black text-gray-400 block mb-3 uppercase tracking-widest">İşlenen Konu</label>
                                        <div className="font-bold text-lg text-gray-700 leading-relaxed italic">"{activeReport.topic}"</div>
                                    </div>
                                    <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100 shadow-inner">
                                        <label className="text-[10px] font-black text-gray-400 block mb-3 uppercase tracking-widest">Eğitmen Notları</label>
                                        <div className="text-lg text-gray-600 leading-relaxed whitespace-pre-wrap">{activeReport.note}</div>
                                    </div>
                                </div>
                                <div className="mt-10 flex justify-center">
                                    <div className="bg-purple-600 text-white px-8 py-3 rounded-full font-black flex items-center gap-4">
                                        <span>Ders Verimliliği:</span>
                                        <div className="flex gap-1">
                                            {[...Array(5)].map((_, i) => <i key={i} className={`fas fa-star ${i < activeReport.rating ? 'text-yellow-300' : 'text-purple-400'}`}></i>)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })()}

            {/* MODALLAR */}
            {showAddClassModal && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[200] flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-[#18181B] border border-white/5 w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 blur-[60px] rounded-full -mr-16 -mt-16"></div>
                        <h3 className="text-white font-black text-3xl mb-1 tracking-tight">Yeni Sınıf Ekle</h3>
                        <p className="text-gray-500 text-sm mb-8 font-medium">Kurum yapınıza yeni bir sınıf tanımlayın.</p>
                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] text-gray-500 font-black uppercase mb-3 block tracking-widest">Sınıf Seviyesi</label>
                                <select value={newClassGrade} onChange={(e) => setNewClassGrade(e.target.value)} className="w-full bg-[#0F0F12] border border-white/5 rounded-2xl p-4 text-white font-bold outline-none focus:border-purple-500/50 appearance-none">
                                    <option value="9">9. Sınıf</option>
                                    <option value="10">10. Sınıf</option>
                                    <option value="11">11. Sınıf</option>
                                    <option value="12">12. Sınıf</option>
                                    <option value="Mezun">Mezun</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-500 font-black uppercase mb-3 block tracking-widest">Şube (Örn: A, Fen, TM)</label>
                                <input type="text" value={newClassBranch} onChange={(e) => setNewClassBranch(e.target.value)} className="w-full bg-[#0F0F12] border border-white/5 rounded-2xl p-4 text-white font-bold outline-none focus:border-purple-500/50 transition-all" placeholder="Şube ismi girin..." />
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button onClick={() => setShowAddClassModal(false)} className="flex-1 bg-white/5 hover:bg-white/10 text-gray-400 font-black py-4 rounded-2xl transition-all">İPTAL</button>
                                <button onClick={handleAddClass} className="flex-1 bg-white text-black font-black py-4 rounded-2xl hover:bg-gray-200 transition-all shadow-xl shadow-white/5">EKLE</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showDeleteClassModal && classToDelete && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[200] flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-[#18181B] border border-red-500/20 w-full max-w-sm rounded-[2.5rem] shadow-2xl p-10 text-center">
                        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                            <i className="fas fa-trash-alt text-red-500 text-3xl"></i>
                        </div>
                        <h3 className="text-white font-black text-2xl mb-2">Sınıfı Silinsin mi?</h3>
                        <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                            <strong className="text-white font-black text-lg">{classToDelete.grade}-{classToDelete.branch}</strong> şubesini ve tüm arşivini silmek üzeresiniz.
                        </p>
                        <div className="flex flex-col gap-3">
                            <button onClick={confirmDeleteClass} className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-red-900/30">EVET, TAMAMEN SİL</button>
                            <button onClick={() => { setShowDeleteClassModal(false); setClassToDelete(null); }} className="w-full bg-white/5 hover:bg-white/10 text-gray-400 font-bold py-4 rounded-2xl transition-all">VAZGEÇ</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const { t, language } = useLanguage();
    const [role, setRole] = useState<UserRole>('student');
    const [userName, setUserName] = useState('Öğrenci'); // Default value
    const [notes, setNotes] = useState<Note[]>([]);
    const [weeklyActivity, setWeeklyActivity] = useState([0, 0, 0, 0, 0, 0, 0]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // YENİ EKLENEN/DÜZELTİLEN STATE'LER
    const [showNewNoteModal, setShowNewNoteModal] = useState(false);
    const [activeTab, setActiveTab] = useState<'manual' | 'ai'>('manual');
    const [aiTopic, setAiTopic] = useState('');
    const [aiGrade, setAiGrade] = useState('10');
    const [aiDetails, setAiDetails] = useState('');
    const [manualTitle, setManualTitle] = useState('');
    const [loadingOverlay, setLoadingOverlay] = useState<{ show: boolean, msg: string }>({ show: false, msg: '' });

    // WEEKLY REPORT STATE'LERİ
    const [showClassLogModal, setShowClassLogModal] = useState(false);
    const [weeklyReports, setWeeklyReports] = useState<WeeklyReport[]>([]);
    const [teacherClasses, setTeacherClasses] = useState<SchoolClass[]>([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedRating, setSelectedRating] = useState(5);
    const [lessonTopic, setLessonTopic] = useState('');
    const [teacherNote, setTeacherNote] = useState('');
    const [teacherName, setTeacherName] = useState('');
    const [lessonName, setLessonName] = useState('');
    const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
    const [lessonTime, setLessonTime] = useState('1');
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [assignItem, setAssignItem] = useState<{ id: string, type: 'note' | 'exam', title: string } | null>(null);
    const [assignments, setAssignments] = useState<any[]>([]);
    const [usageStats, setUsageStats] = useState({ count: 0, lastReset: '' });
    const [institutionName, setInstitutionName] = useState<string>(localStorage.getItem('institution_name') || 'Kurum');
    const [institutionLogo, setInstitutionLogo] = useState<string | null>(localStorage.getItem('institution_logo'));

    useEffect(() => {
        const fetchRole = async () => {
            // --- SESSION CHECK ---
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                console.warn('[Dashboard] No active session. Redirecting...');
                localStorage.clear();
                navigate('/auth');
                return;
            }

            const localRole = localStorage.getItem('user_role') as UserRole;
            if (localRole) setRole(localRole);

            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                let { data, error } = await supabase.from('profiles').select('role, username, class_id, institution_id, daily_usage_count, last_usage_reset').eq('user_id', user.id).maybeSingle();

                // FALLBACK: If profile record is missing (common during DB resets/mismatches)
                if (!data || error) {
                    console.warn('[Dashboard] Profil bulunamadı, fallback (metadata) kullanılıyor...');
                    data = {
                        role: user.user_metadata?.role || localRole || 'student',
                        username: user.user_metadata?.username || user.email?.split('@')[0],
                        institution_id: user.user_metadata?.institution_id || localStorage.getItem('institution_id'),
                        class_id: user.user_metadata?.class_id || localStorage.getItem('user_class_id'),
                        daily_usage_count: 0,
                        last_usage_reset: new Date().toISOString()
                    };
                }

                if (data) {
                    setRole(data.role as UserRole);
                    if (data.username) setUserName(data.username);

                    // --- USAGE LIMIT LOGIC ---
                    const today = new Date().toISOString().split('T')[0];
                    const lastResetDate = data.last_usage_reset ? new Date(data.last_usage_reset).toISOString().split('T')[0] : '';

                    if (lastResetDate !== today) {
                        // Reset count for new day
                        setUsageStats({ count: 0, lastReset: today });
                        await supabase.from('profiles').update({ daily_usage_count: 0, last_usage_reset: new Date().toISOString() }).eq('user_id', user.id);
                    } else {
                        setUsageStats({ count: data.daily_usage_count || 0, lastReset: data.last_usage_reset });
                    }

                    if (data.institution_id) {
                        localStorage.setItem('institution_id', data.institution_id);
                        // Fetch inst name & logo if possible
                        const { data: instData } = await supabase.from('institutions').select('name, logo_url').eq('id', data.institution_id).maybeSingle();
                        if (instData) {
                            setInstitutionName(instData.name);
                            localStorage.setItem('institution_name', instData.name);
                            if (instData.logo_url) {
                                setInstitutionLogo(instData.logo_url);
                                localStorage.setItem('institution_logo', instData.logo_url);
                            }
                        }
                    }
                    if (data.class_id) {
                        localStorage.setItem('user_class_id', data.class_id);
                    }
                }
                fetchNotes(user.id);
                // Öğretmen/öğrenci ekranı için sınıfları çek
                await fetchTeacherClasses();
                // Öğrenci ise atamaları çek
                await fetchAssignments(user.id, data?.class_id);
            } else {
                // Guest/Demo fetch - rol localStorage'dan alınıyor
                const localNotes = JSON.parse(localStorage.getItem('guest_notes') || '[]');
                setNotes(localNotes);
                // Mock activity for guest
                setWeeklyActivity([120, 300, 45, 200, 150, 80, 400]);
                // Demo modda da sınıfları Supabase'den çek!
                await fetchTeacherClasses();
                // Demo modda localStorage'dan atamaları çek
                const localAssignments = JSON.parse(localStorage.getItem('mock_assignments') || '[]');
                const currentInstId = localStorage.getItem('institution_id');
                const filteredAssignments = localAssignments.filter((a: any) =>
                    // Eğer assignment'da kurum ID varsa eşleşmeli, yoksa (eski veri) göster veya gizle (güvenlik için gizle)
                    a.institution_id ? a.institution_id === currentInstId : true
                );
                setAssignments(filteredAssignments);
            }
            // Load weekly reports
            loadWeeklyReports();
        };
        fetchRole();
    }, []);

    const loadWeeklyReports = async () => {
        try {
            let instId = localStorage.getItem('institution_id');

            if (!instId || instId.trim() === '') {
                // Try deep recovery from profile
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data } = await supabase.from('profiles').select('institution_id').eq('user_id', user.id).maybeSingle();
                    if (data?.institution_id) instId = data.institution_id;
                }
            }

            if (!instId || instId.trim() === '') return;

            const { data, error } = await supabase
                .from('weekly_reports')
                .select('*')
                .eq('institution_id', instId)
                .order('date', { ascending: false });

            if (error) throw error;

            if (data) {
                setWeeklyReports(data);
            }
        } catch (error) {
            console.error('Error loading weekly reports:', error);
            toast.error('Raporlar yüklenemedi');
        }
    };

    const fetchTeacherClasses = async () => {
        const instId = localStorage.getItem('institution_id');
        const role = localStorage.getItem('user_role');

        // Sadece Öğretmen ve Müdür sınıf listesini görmeli (Müdür ekler, Öğretmen seçer)
        if (role === 'student') return;

        console.log('[Dashboard] Sınıflar çekiliyor. Kurum:', instId);

        try {
            // DEMO/LOCAL MODE
            if (instId && instId.startsWith('demo-')) {
                // Kuruma özel mock sınıflar
                const storageKey = `classes_${localStorage.getItem('institution_name')?.replace(/\s/g, '_')}`;

                // Önce localStorage'daki güncel listeye bak (Müdür eklemiş olabilir)
                const localStored = JSON.parse(localStorage.getItem(storageKey) || '[]');

                if (localStored.length > 0) {
                    setTeacherClasses(localStored);
                } else {
                    // Hiç yoksa varsayılanları oluştur
                    const institutionName = localStorage.getItem('institution_name') || 'Demo Kurum';
                    const defaultClasses: SchoolClass[] = [
                        { id: `${institutionName}-9a`, institution_id: instId, grade: '9', branch: 'A' },
                        { id: `${institutionName}-9b`, institution_id: instId, grade: '9', branch: 'B' },
                        { id: `${institutionName}-10a`, institution_id: instId, grade: '10', branch: 'A' },
                        { id: `${institutionName}-11a`, institution_id: instId, grade: '11', branch: 'A' },
                        { id: `${institutionName}-12a`, institution_id: instId, grade: '12', branch: 'A' },
                    ];
                    // Bunları kaydet ki müdür görebilsin
                    localStorage.setItem(storageKey, JSON.stringify(defaultClasses));
                    setTeacherClasses(defaultClasses);
                }

                if (!selectedClass && teacherClasses.length > 0) {
                    setSelectedClass(`${teacherClasses[0].grade}-${teacherClasses[0].branch}`);
                }
                return;
            }

            // REAL SUPABASE MODE
            if (!instId || instId.trim() === '') {
                // If no institution ID is found, we can try to fetch it from the user profile as a fallback
                // or just return empty to prevent the "invalid input syntax" error.
                // Let's try to get it from the session/profile if possible, otherwise abort.
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('institution_id')
                        .eq('user_id', user.id)
                        .maybeSingle();

                    if (profile && profile.institution_id) {
                        // Found it! Use this ID and update local storage
                        localStorage.setItem('institution_id', profile.institution_id);
                        // Continue query with NEW found ID
                        const { data, error } = await supabase
                            .from('classes')
                            .select('*')
                            .eq('institution_id', profile.institution_id)
                            .order('grade', { ascending: true })
                            .order('branch', { ascending: true });
                        if (!error && data) {
                            const list = data as SchoolClass[];
                            setTeacherClasses(list);
                            if (!selectedClass && list.length > 0) setSelectedClass(`${list[0].grade}-${list[0].branch}`);
                            return;
                        }
                    }
                }

                console.warn('[Dashboard] Sınıf çekme: Institution ID hatası (boş)');
                setTeacherClasses([]);
                return;
            }

            const { data, error } = await supabase
                .from('classes')
                .select('*')
                .eq('institution_id', instId) // Sadece bu kurumun sınıfları
                .order('grade', { ascending: true })
                .order('branch', { ascending: true });

            if (!error && data) {
                const list = data as SchoolClass[];
                setTeacherClasses(list);
                if (!selectedClass && list.length > 0) {
                    setSelectedClass(`${list[0].grade}-${list[0].branch}`);
                }
            } else {
                console.warn('[Dashboard] Sınıf çekme hatası:', error);
                setTeacherClasses([]);
            }
        } catch (e) {
            console.error('[Dashboard] Sınıf çekme genel hata:', e);
            setTeacherClasses([]);
        }
    };

    const fetchNotes = async (userId: string) => {
        try {
            // HYBRID/OFFLINE MODE FOR NOTES: LocalStorage
            // User requested to switch notes to LocalStorage to avoid DB errors and allow offline access.
            // Key format: studyflow_notes_{userId}

            const storageKey = `studyflow_notes_${userId}`;
            const localData = localStorage.getItem(storageKey);

            let loadedNotes: Note[] = [];

            if (localData) {
                loadedNotes = JSON.parse(localData);
                // Sort by updated_at desc (handle potential undefined)
                loadedNotes.sort((a, b) => {
                    const tA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
                    const tB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
                    return tB - tA;
                });
            }

            setNotes(loadedNotes);

        } catch (error) {
            console.error('Notlar yüklenirken hata:', error);
            // Fallback empty
            setNotes([]);
        }
    };

    const fetchAssignments = async (userId: string, classId?: string) => {
        try {
            const currentClassId = classId || localStorage.getItem('user_class_id');

            let query = supabase
                .from('assignments')
                .select('*');

            if (currentClassId) {
                query = query.or(`student_id.eq.${userId},class_id.eq.${currentClassId}`);
            } else {
                query = query.eq('student_id', userId);
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (!error && data) {
                setAssignments(data);
            }
        } catch (e) {
            console.error("fetchAssignments Error:", e);
        }
    };

    const handleAssignmentClick = async (assignment: any) => {
        // --- OPTIMISTIC UI UPDATE ---
        // Listeden anında kaldır ki kullanıcı "açıldı mı?" diye şüphe etmesin
        setAssignments(prev => prev.filter(a => a.id !== assignment.id));

        try {
            if (assignment.id.startsWith('demo_')) {
                const local = JSON.parse(localStorage.getItem('mock_assignments') || '[]');
                const updated = local.filter((a: any) => a.id !== assignment.id);
                localStorage.setItem('mock_assignments', JSON.stringify(updated));
            } else {
                const { error } = await supabase.from('assignments').delete().eq('id', assignment.id);
                if (error) {
                    console.error("Supabase delete failed, but we removed it from UI anyway:", error);
                }
            }
        } catch (e) {
            console.error('Atama silme hatası:', e);
        }

        // --- NAVIGATE TO CONTENT ---
        const targetId = assignment.content_id || assignment.item_id || assignment.id;

        if (assignment.type === 'exam') {
            navigate('/exam', { state: { examId: targetId } });
        } else {
            navigate('/notes', { state: { noteId: targetId, initialTitle: assignment.title } });
        }
    };

    const generateSampleReports = () => {
        const sampleReports: (Omit<WeeklyReport, 'id' | 'date'> & { date?: string })[] = [
            {
                class_id: '9-A',
                teacher_name: 'Fizik Öğretmeni',
                lesson: 'Fizik',
                rating: 4,
                topic: 'Newton Yasaları',
                note: 'Sınıf katılımı yüksekti, ancak ödev tamamlanma oranı düşüktü.',
                week: getCurrentWeek()
            },
            {
                class_id: '9-A',
                teacher_name: 'Matematik Öğretmeni',
                lesson: 'Matematik',
                rating: 5,
                topic: 'İkinci Dereceden Denklemler',
                note: 'Öğrencilerin çoğu konuyu çok iyi anladı. İleri düzey konulara girildi.',
                week: getCurrentWeek()
            },
            {
                class_id: '10-B',
                teacher_name: 'Kimya Öğretmeni',
                lesson: 'Kimya',
                rating: 3,
                topic: 'Kimyasal Tepkimeler',
                note: 'Denklem dengelemede zorlanan öğrenciler oldu, daha fazla pratik gerekiyor.',
                week: getCurrentWeek()
            }
        ];

        sampleReports.forEach(report => addWeeklyReport(report));
    };

    const addWeeklyReport = async (report: Omit<WeeklyReport, 'id' | 'date'> & { date?: string }) => {
        let instId = localStorage.getItem('institution_id');
        const timestamp = new Date().toISOString().split('T')[0];

        try {
            const { data: { user } } = await supabase.auth.getUser();

            // Recovery for institution_id
            if ((!instId || instId.startsWith('demo-')) && user) {
                const { data: prof } = await supabase.from('profiles').select('institution_id').eq('user_id', user.id).maybeSingle();
                if (prof?.institution_id) {
                    instId = prof.institution_id;
                    localStorage.setItem('institution_id', instId as string);
                } else if (user.user_metadata?.institution_id) {
                    instId = user.user_metadata.institution_id;
                    localStorage.setItem('institution_id', instId as string);
                }
            }

            const newReport: any = {
                ...report,
                date: report.date || timestamp,
                institution_id: instId
            };

            const { data, error } = await supabase.from('weekly_reports').insert([newReport]).select();

            if (error) throw error;

            const savedReport = data[0];
            const updatedReports = [savedReport, ...weeklyReports]; // Newest first
            setWeeklyReports(updatedReports);

            toast.success('Rapor başarıyla kaydedildi');
            return savedReport;
        } catch (e) {
            console.error("Rapor kaydetme hatası:", e);
            toast.error('Rapor kaydedilirken hata oluştu');
            return null;
        }
    };

    const getCurrentWeek = (baseDate: Date = new Date()) => {
        const now = baseDate;
        const yearStart = new Date(now.getFullYear(), 0, 1);
        const diff = now.getTime() - yearStart.getTime();
        const oneWeek = 1000 * 60 * 60 * 24 * 7;
        const week = Math.floor(diff / oneWeek) + 1;

        // Haftanın Pazartesi ve Pazar günlerini bul
        const day = now.getDay();
        const monday = new Date(now);
        monday.setDate(now.getDate() - ((day + 6) % 7));
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);

        const format = (d: Date) => d.toLocaleDateString('tr-TR');
        const rangeText = `${format(monday)} - ${format(sunday)}`;

        // Sadece tarih aralığı döndür, "Hafta X" ibaresini kaldır
        return rangeText;
    };

    const handleSaveClassLog = async () => {
        if (!selectedClass) {
            alert('Önce sınıf seçin');
            return;
        }
        if (!lessonTopic.trim() || !teacherNote.trim() || !teacherName.trim() || !lessonName.trim()) {
            alert('Lütfen tüm alanları doldurun');
            return;
        }

        // Find the actual class UUID from teacherClasses if possible
        const classObj = teacherClasses.find(c => `${c.grade}-${c.branch}` === selectedClass);
        const classIdentifier = classObj ? classObj.id : selectedClass;

        const newReport = await addWeeklyReport({
            class_id: classIdentifier,
            teacher_name: teacherName,
            lesson: lessonName,
            rating: selectedRating,
            topic: lessonTopic,
            note: teacherNote,
            week: getCurrentWeek(new Date(reportDate)),
            date: reportDate
        });

        // Reset form
        setLessonTopic('');
        setTeacherNote('');
        setSelectedRating(5);
        setTeacherName('');
        setLessonName('');
        setReportDate(new Date().toISOString().split('T')[0]);
        setShowClassLogModal(false);

        // Show success message
        toast.success('Rapor Müdüre gönderildi');
    };

    const handleHandleAssign = async (classId: string, className?: string) => {
        if (!assignItem) return;

        try {
            let instId = localStorage.getItem('institution_id');
            const displayClassName = className || classId;

            // REAL/SUPABASE MODE
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error('Oturum süreniz dolmuş olabilir.');
                return;
            }

            // Recovery for institution_id
            if (!instId || instId === 'null' || instId.startsWith('demo-')) {
                const { data: prof } = await supabase.from('profiles').select('institution_id').eq('user_id', user.id).maybeSingle();
                if (prof?.institution_id) {
                    instId = prof.institution_id;
                    localStorage.setItem('institution_id', instId as string);
                } else if (user.user_metadata?.institution_id) {
                    instId = user.user_metadata.institution_id;
                    localStorage.setItem('institution_id', instId as string);
                }
            }

            // LOCAL/DEMO MODE fallback if still no real ID
            if (!instId || instId === 'null' || instId.startsWith('demo-')) {
                const localAssignments = JSON.parse(localStorage.getItem('mock_assignments') || '[]');
                const newAssignment = {
                    id: 'demo_' + Date.now(),
                    content_id: assignItem.id,
                    title: assignItem.title,
                    type: assignItem.type,
                    class_id: classId,
                    institution_id: instId || 'demo-1',
                    created_at: new Date().toISOString()
                };
                localAssignments.push(newAssignment);
                localStorage.setItem('mock_assignments', JSON.stringify(localAssignments));
                setAssignments(localAssignments);
                toast.success(`"${assignItem.title}" ${displayClassName} sınıfına atandı! (Demo Modu)`);
                setShowAssignModal(false);
                setAssignItem(null);
                return;
            }

            // --- SYNC LOCAL NOTE TO DB BEFORE ASSIGNING ---
            let realContentId = assignItem.id;
            const isLocal = realContentId.startsWith('ai_') || realContentId.startsWith('loc_') || realContentId.startsWith('new_') || realContentId.startsWith('note_');

            if (isLocal && assignItem.type === 'note') {
                try {
                    const storageKey = `studyflow_notes_${user.id}`;
                    const localNotes = JSON.parse(localStorage.getItem(storageKey) || '[]');
                    const note = localNotes.find((n: any) => n.id === realContentId);

                    if (note) {
                        const { data: uploadedNote, error: uploadError } = await supabase.from('notes').insert([{
                            user_id: user.id,
                            title: note.title,
                            body_html: note.body_html,
                            type: 'normal',
                            institution_id: instId
                        }]).select().maybeSingle();

                        if (uploadError) {
                            console.error("Note upload failed during assignment:", uploadError);
                        } else if (uploadedNote) {
                            realContentId = (uploadedNote as any).id;
                        }
                    }
                } catch (syncErr) {
                    console.error("Note sync error:", syncErr);
                }
            }

            // Supabase Insert
            const assignment = {
                teacher_id: user.id,
                institution_id: instId,
                class_id: classId,
                content_id: realContentId || assignItem.id,
                title: assignItem.title,
                type: assignItem.type,
                due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            };

            const { error } = await supabase.from('assignments').insert([assignment]);
            if (error) throw error;

            toast.success(`"${assignItem.title}" başarıyla ${displayClassName} sınıfına atandı!`);
            setShowAssignModal(false);
            setAssignItem(null);
        } catch (e: any) {
            console.error("Atama tam hatası:", e);
            const errorMsg = e.message || "Bilinmeyen bir hata oluştu";
            toast.error(`Atama Hatası: ${errorMsg}. Demo moduna geçiliyor.`);

            // Fallback to local
            const localAssignments = JSON.parse(localStorage.getItem('mock_assignments') || '[]');
            localAssignments.push({
                id: 'mock_' + Date.now(),
                title: assignItem.title,
                type: assignItem.type,
                class_id: classId,
                content_id: assignItem.id,
                institution_id: localStorage.getItem('institution_id')
            });
            localStorage.setItem('mock_assignments', JSON.stringify(localAssignments));
            setShowAssignModal(false);
        }
    };


    // Modal açma fonksiyonu (Öğrenci veya Öğretmen)
    const handleNewNote = () => {
        // Öğretmen için varsayılan AI sekmesi, öğrenci için Manuel açılabilir
        setActiveTab(role === 'teacher' ? 'ai' : 'manual');
        setShowNewNoteModal(true);
    };

    const handleCreateNoteAction = async () => {
        if (activeTab === 'manual') {
            if (!manualTitle.trim()) { alert("Başlık zorunlu."); return; }
            setShowNewNoteModal(false);
            const newId = 'note_' + Date.now();

            const { data: { user } } = await supabase.auth.getUser();
            const userId = user ? user.id : 'guest';

            // HYBRID/OFFLINE MODE: Save to LocalStorage
            const storageKey = `studyflow_notes_${userId}`;
            const localData = localStorage.getItem(storageKey);
            let localNotes: any[] = localData ? JSON.parse(localData) : [];

            localNotes.unshift({
                id: newId,
                user_id: userId,
                title: manualTitle,
                body_html: '<p>Not içerik...</p>',
                type: 'normal',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                institution_id: localStorage.getItem('institution_id')
            });

            localStorage.setItem(storageKey, JSON.stringify(localNotes));
            setNotes(localNotes);
            toast.success('Yeni not oluşturuldu');

            // Öğretmen ise atama modalı aç
            if (role === 'teacher') {
                setAssignItem({ id: newId, type: 'note', title: manualTitle });
                setShowAssignModal(true);
            }
            navigate('/notes', { state: { noteId: newId, isNew: true, initialTitle: manualTitle } });
            setManualTitle('');
        } else {
            if (!aiTopic) { alert("Konu zorunlu."); return; }

            // USAGE CHECK
            if (role === 'student' && usageStats.count >= 3) {
                toast.error("Günlük AI kullanım limitine ulaştınız (3/3).");
                return;
            }

            setShowNewNoteModal(false);
            setLoadingOverlay({ show: true, msg: t('ai_thinking') });
            try {
                const html = await aiHelper.generateNote(aiTopic, aiGrade, aiDetails, language);

                await incrementUsage();

                setLoadingOverlay({ show: false, msg: '' });
                const { data: { user } } = await supabase.auth.getUser();
                const userId = user ? user.id : 'guest';
                // ... rest of the logic

                // HYBRID/OFFLINE MODE: Save to LocalStorage
                const newId = 'ai_' + Date.now();
                const storageKey = `studyflow_notes_${userId}`;

                const localData = localStorage.getItem(storageKey);
                let localNotes: any[] = localData ? JSON.parse(localData) : [];

                localNotes.unshift({
                    id: newId,
                    user_id: userId,
                    title: aiTopic,
                    body_html: html,
                    type: 'normal',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    institution_id: localStorage.getItem('institution_id')
                });

                localStorage.setItem(storageKey, JSON.stringify(localNotes));
                setNotes(localNotes);

                toast.success('AI notu oluşturuldu');
                // B2B: XP removed

                // Öğretmen ise atama modalı aç
                if (role === 'teacher') {
                    setAssignItem({ id: newId, type: 'note', title: aiTopic });
                    setShowAssignModal(true);
                }
                navigate('/notes', { state: { noteId: newId, initialContent: html, initialTitle: aiTopic, isNew: true } });
                setAiTopic(''); setAiDetails('');
            } catch (error) {
                setLoadingOverlay({ show: false, msg: '' });
                alert("İçerik oluşturulamadı.");
            }
        }
    };

    const handleNoteClick = (note: Note) => {
        navigate('/notes', { state: { noteId: note.id } });
    };

    const handleDeleteNote = async (id: string) => {
        if (!confirm("Notu silmek istediğinize emin misiniz?")) return;

        const { data: { user } } = await supabase.auth.getUser();

        // HYBRID/OFFLINE MODE: Delete from LocalStorage
        const userId = user ? user.id : 'guest';
        const storageKey = `studyflow_notes_${userId}`;

        const localData = localStorage.getItem(storageKey);
        let localNotes: any[] = localData ? JSON.parse(localData) : [];

        localNotes = localNotes.filter((n: any) => n.id !== id);
        localStorage.setItem(storageKey, JSON.stringify(localNotes));
        setNotes(localNotes);

        toast.success("Not silindi");
    };

    const handleShareNote = (id: string) => {
        const url = `${window.location.origin}/#/share/${id}`;
        navigator.clipboard.writeText(url);
        alert(t('link_copied'));
    };

    const handleUploadPdf = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // LOADING OVERLAY GÖSTER - Z-INDEX EN YÜKSEK
        setLoadingOverlay({ show: true, msg: "PDF İnceleniyor..." });

        const reader = new FileReader();
        reader.onload = async (re) => {
            const base64 = re.target?.result as string;
            try {
                // USAGE CHECK
                if (role === 'student' && usageStats.count >= 3) {
                    toast.error("Günlük AI kullanım limitine ulaştınız (3/3).");
                    setLoadingOverlay({ show: false, msg: "" });
                    return;
                }

                const cleanBase64 = base64.split(',')[1];
                const html = await aiHelper.analyzePdf(cleanBase64, language);

                await incrementUsage();

                setLoadingOverlay({ show: false, msg: "" }); // Yükleme bitti
                toast.success('PDF analizi tamamlandı');
                navigate('/notes', { state: { initialTitle: file.name, initialContent: html, isNew: true } });
            } catch (err) {
                setLoadingOverlay({ show: false, msg: "" });
                alert("PDF Analizi başarısız oldu.");
            }
        };
        reader.readAsDataURL(file);
    };

    const incrementUsage = async () => {
        if (role !== 'student') return;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const newCount = usageStats.count + 1;
        setUsageStats({ ...usageStats, count: newCount });

        await supabase.from('profiles').update({ daily_usage_count: newCount }).eq('user_id', user.id);
    };

    if (role === 'principal') {
        const institutionName = localStorage.getItem('institution_name') || 'Bilinmeyen Kurum';
        return <PrincipalDashboard weeklyReports={weeklyReports} onClassChange={fetchTeacherClasses} institutionName={institutionName} institutionLogo={institutionLogo} />;
    }

    return (
        <div className="h-full overflow-y-auto p-4 md:p-8 relative">
            <Toaster position="top-right" />

            {/* LOADING OVERLAY (En Üstte - PDF Analizi İçin) */}
            {loadingOverlay.show && (
                <div className="fixed inset-0 bg-black/95 z-[9999] flex flex-col items-center justify-center backdrop-blur-md">
                    <div className="w-24 h-24 border-8 border-purple-500 border-t-transparent rounded-full animate-spin mb-6 shadow-[0_0_50px_rgba(168,85,247,0.6)]"></div>
                    <h2 className="text-3xl font-black text-white animate-pulse tracking-widest uppercase">{loadingOverlay.msg}</h2>
                    <p className="text-gray-400 mt-2 text-sm">Yapay zeka içeriği okuyor...</p>
                </div>
            )}

            {/* NOT OLUŞTURMA MODALI (TAM ESKİ HALİ) */}
            {showNewNoteModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-[#18181B] border border-[#27272A] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative">
                        <div className="bg-[#202025] p-5 flex justify-between items-center border-b border-[#27272A]">
                            <h3 className="text-white font-bold text-lg">Yeni Not Oluştur</h3>
                            <button onClick={() => setShowNewNoteModal(false)} className="text-gray-400 hover:text-white transition-colors">
                                <i className="fas fa-times text-xl"></i>
                            </button>
                        </div>

                        <div className="flex p-2 bg-[#18181B] gap-1 border-b border-[#27272A]">
                            <button onClick={() => setActiveTab('ai')} className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${activeTab === 'ai' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}>
                                <i className="fas fa magic mr-2"></i> AI Asistan
                            </button>
                            <button onClick={() => setActiveTab('manual')} className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${activeTab === 'manual' ? 'bg-[#27272A] text-white ring-1 ring-white/10' : 'text-gray-500 hover:text-gray-300'}`}>
                                <i className="fas fa-pen mr-2"></i> Manuel Giriş
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {activeTab === 'ai' ? (
                                <div className="space-y-4 animate-fade-in">
                                    <div>
                                        <label className="text-xs text-gray-500 font-bold uppercase mb-2 block">ÇALIŞILACAK KONU</label>
                                        <input
                                            type="text"
                                            value={aiTopic}
                                            onChange={(e) => setAiTopic(e.target.value)}
                                            className="w-full bg-[#0F0F12] border border-[#27272A] rounded-xl p-4 text-white outline-none focus:border-purple-500 transition-all font-medium"
                                            placeholder="Örn: Modern Fizik, Türev..."
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs text-gray-500 font-bold uppercase mb-2 block">SINIF / SEVİYE</label>
                                        <select
                                            value={aiGrade}
                                            onChange={(e) => setAiGrade(e.target.value)}
                                            className="w-full bg-[#0F0F12] border border-[#27272A] rounded-xl p-4 text-white outline-none focus:border-purple-500 transition-all font-medium appearance-none"
                                        >
                                            {[9, 10, 11, 12].map(grade => <option key={grade} value={grade}>{grade}. Sınıf</option>)}
                                            <option value="YKS">YKS (TYT/AYT)</option>
                                            <option value="Uni">Üniversite</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-xs text-gray-500 font-bold uppercase mb-2 block">EK DETAYLAR (İSTEĞE BAĞLI)</label>
                                        <textarea
                                            value={aiDetails}
                                            onChange={(e) => setAiDetails(e.target.value)}
                                            className="w-full bg-[#0F0F12] border border-[#27272A] rounded-xl p-4 text-white outline-none focus:border-purple-500 transition-all font-medium resize-none h-24"
                                            placeholder="Örn: Formüllere odaklan, tablo kullan..."
                                        ></textarea>
                                    </div>

                                    <div className="flex justify-end pt-2">
                                        <button onClick={handleCreateNoteAction} className="bg-[#52525B] hover:bg-[#3F3F46] text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg w-auto">
                                            Notu Oluştur
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-5 animate-fade-in">
                                    <div>
                                        <label className="text-xs text-gray-500 font-bold uppercase mb-2 block tracking-widest">Başlık</label>
                                        <input
                                            type="text"
                                            value={manualTitle}
                                            onChange={(e) => setManualTitle(e.target.value)}
                                            className="w-full bg-[#0F0F12] border border-[#27272A] rounded-xl p-4 text-white outline-none focus:border-purple-500 transition-all text-lg"
                                            placeholder="Not başlığını giriniz..."
                                        />
                                    </div>
                                    <button onClick={handleCreateNoteAction} className="w-full bg-white text-black font-black py-4 rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2">
                                        <i className="fas fa-plus"></i> Boş Not Sayfası Aç
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* SINIF GÜNLÜĞÜ MODALI (Öğretmen İçin) */}
            {showClassLogModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-[#18181B] border border-[#27272A] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden relative max-h-[90vh] flex flex-col">
                        <div className="bg-[#202025] p-4 flex justify-between items-center border-b border-[#27272A]">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-500/20 text-blue-400 rounded-lg flex items-center justify-center">
                                    <i className="fas fa-book"></i>
                                </div>
                                <h3 className="text-white font-bold">Sınıf Günlüğü & Rapor</h3>
                            </div>
                            <button onClick={() => setShowClassLogModal(false)} className="text-gray-400 hover:text-white"><i className="fas fa-times"></i></button>
                        </div>

                        <div className="p-6 space-y-4 overflow-y-auto">
                            <div>
                                <label className="text-xs text-gray-500 font-bold uppercase mb-2 block">Sınıf Seçin</label>
                                <select
                                    value={selectedClass}
                                    onChange={(e) => setSelectedClass(e.target.value)}
                                    className="w-full bg-[#0F0F12] border border-[#27272A] rounded-xl p-3 text-white outline-none focus:border-blue-500 transition-colors"
                                >
                                    <option value="">Sınıf Seçiniz</option>
                                    {teacherClasses.map((c) => (
                                        <option key={c.id} value={`${c.grade}-${c.branch}`}>{c.grade}-{c.branch}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-xs text-gray-500 font-bold uppercase mb-2 block">Öğretmen Adı</label>
                                <input
                                    type="text"
                                    value={teacherName}
                                    onChange={(e) => setTeacherName(e.target.value)}
                                    className="w-full bg-[#0F0F12] border border-[#27272A] rounded-xl p-3 text-white outline-none focus:border-blue-500 transition-colors"
                                    placeholder="Ad Soyad"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-gray-500 font-bold uppercase mb-2 block">Tarih</label>
                                    <input
                                        type="date"
                                        value={reportDate}
                                        onChange={(e) => setReportDate(e.target.value)}
                                        className="w-full bg-[#0F0F12] border border-[#27272A] rounded-xl p-3 text-white outline-none focus:border-blue-500 transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 font-bold uppercase mb-2 block">Ders Saati</label>
                                    <select
                                        value={lessonTime}
                                        onChange={(e) => setLessonTime(e.target.value)}
                                        className="w-full bg-[#0F0F12] border border-[#27272A] rounded-xl p-3 text-white outline-none focus:border-blue-500 transition-colors"
                                    >
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map(h => <option key={h} value={h}>{h}. Ders Saati</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-gray-500 font-bold uppercase mb-2 block">Ders Adı</label>
                                <input
                                    type="text"
                                    value={lessonName}
                                    onChange={(e) => setLessonName(e.target.value)}
                                    className="w-full bg-[#0F0F12] border border-[#27272A] rounded-xl p-3 text-white outline-none focus:border-blue-500 transition-colors"
                                    placeholder="Örn: Fizik"
                                />
                            </div>

                            <div>
                                <label className="text-xs text-gray-500 font-bold uppercase mb-2 block">Puan (1-5 Yıldız)</label>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map((rating) => (
                                        <button
                                            key={rating}
                                            type="button"
                                            onClick={() => setSelectedRating(rating)}
                                            className={`w-10 h-10 rounded-lg border transition-all ${selectedRating >= rating ? 'bg-yellow-500 border-yellow-500 text-white' : 'bg-[#0F0F12] border-[#27272A] text-gray-500 hover:border-yellow-500'}`}
                                        >
                                            ⭐
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-gray-500 font-bold uppercase mb-2 block">Konu</label>
                                <input
                                    type="text"
                                    value={lessonTopic}
                                    onChange={(e) => setLessonTopic(e.target.value)}
                                    className="w-full bg-[#0F0F12] border border-[#27272A] rounded-xl p-3 text-white outline-none focus:border-blue-500 transition-colors"
                                    placeholder="İşlenen konu..."
                                />
                            </div>

                            <div>
                                <label className="text-xs text-gray-500 font-bold uppercase mb-2 block">Öğretmen Notu</label>
                                <textarea
                                    value={teacherNote}
                                    onChange={(e) => setTeacherNote(e.target.value)}
                                    className="w-full bg-[#0F0F12] border border-[#27272A] rounded-xl p-3 text-white outline-none h-24 resize-none focus:border-blue-500 transition-colors"
                                    placeholder="Sınıfın durumu hakkında notlar..."
                                />
                            </div>

                            <button
                                onClick={handleSaveClassLog}
                                className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                                disabled={!selectedClass}
                            >
                                <i className="fas fa-paper-plane"></i> Raporu Gönder
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ATAMA MODALI */}
            {showAssignModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-[#18181B] border border-[#27272A] w-full max-w-sm rounded-2xl shadow-2xl p-6 relative">
                        <button onClick={() => { setShowAssignModal(false); setAssignItem(null); }} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">
                            <i className="fas fa-times text-xl"></i>
                        </button>

                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-purple-500/20 text-purple-400 rounded-xl flex items-center justify-center text-xl">
                                <i className="fas fa-share-square"></i>
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-lg">Öğrencilere Ata</h3>
                                <p className="text-gray-500 text-xs">"{assignItem?.title}" öğesini bir sınıfa tanımla.</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-gray-500 font-bold uppercase mb-2 block">Sınıf Seçin</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {teacherClasses.map((c) => (
                                        <button
                                            key={c.id}
                                            onClick={() => handleHandleAssign(c.id, `${c.grade}-${c.branch}`)}
                                            className="py-2 bg-[#0F0F12] border border-[#27272A] rounded-lg text-xs font-bold text-gray-400 hover:border-purple-500 hover:text-white transition-all"
                                        >
                                            {c.grade}-{c.branch}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {(role as string) === 'principal' ? (
                <PrincipalDashboard
                    weeklyReports={weeklyReports}
                    onClassChange={() => { }}
                    institutionName={institutionName}
                    institutionLogo={institutionLogo}
                />
            ) : role === 'teacher' ? (
                <TeacherDashboard
                    onAiNoteGen={handleNewNote}
                    onExamGen={() => navigate('/exam')}
                    onClassLog={() => setShowClassLogModal(true)}
                    notes={notes}
                    onAssignOpen={(id, type, title) => { setAssignItem({ id, type, title }); setShowAssignModal(true); }}
                    onNoteClick={handleNoteClick}
                    institutionName={institutionName}
                    institutionLogo={institutionLogo}
                />
            ) : (
                <StudentDashboard
                    notes={notes}
                    onNoteClick={handleNoteClick}
                    onDeleteNote={handleDeleteNote}
                    onShareNote={handleShareNote}
                    onNewNote={handleNewNote}
                    onUploadPdf={handleUploadPdf}
                    fileInputRef={fileInputRef}
                    assignments={assignments}
                    onAssignmentClick={handleAssignmentClick}
                    institutionName={institutionName}
                    institutionLogo={institutionLogo}
                    classDisplay={localStorage.getItem('class_display') || 'Sınıf Belirlenmedi'}
                    userName={userName}
                />
            )}
        </div>
    );
};

export default Dashboard;