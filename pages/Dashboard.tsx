
import React, { useRef, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Note, NoteType, UserRole, SchoolClass, WeeklyReport } from '../types';
import { aiHelper } from '../lib/aiHelper';
import { useLanguage } from '../lib/LanguageContext';
import { useGamification } from '../lib/GamificationContext';
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
    xp: number,
    level: number,
    nextLevelXp: number,
    onNoteClick: (note: Note) => void,
    onDeleteNote: (id: string) => void,
    onShareNote: (id: string) => void,
    onNewNote: () => void,
    onUploadPdf: (e: React.ChangeEvent<HTMLInputElement>) => void,
    fileInputRef: React.RefObject<HTMLInputElement>,
    assignments: any[],
    onAssignmentClick: (assignment: any) => void,
    institutionName: string,
    classDisplay: string
}> = ({ notes, xp, level, nextLevelXp, onNoteClick, onDeleteNote, onShareNote, onNewNote, onUploadPdf, fileInputRef, assignments, onAssignmentClick, institutionName, classDisplay }) => {

    const { t } = useLanguage();

    return (
        <div className="flex flex-col gap-6 pb-20">
            {/* ÖĞRENCİ BİLGİ HEADER */}
            <div className="bg-gradient-to-r from-purple-900/20 to-indigo-900/20 border border-purple-500/20 rounded-2xl p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black">
                            <i className="fas fa-user-graduate"></i>
                        </div>
                        <div>
                            <h2 className="text-white font-bold text-lg">Öğrenci Paneli</h2>
                            <p className="text-purple-400 text-sm font-medium">
                                <i className="fas fa-building mr-2"></i>{institutionName}
                            </p>
                            <p className="text-gray-500 text-xs">
                                <i className="fas fa-users mr-1"></i>Sınıf: <strong className="text-white">{classDisplay}</strong>
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-black text-purple-400">{xp}</div>
                        <div className="text-[10px] text-gray-500 uppercase tracking-wider">Toplam XP</div>
                        <div className="text-xs text-gray-400 mt-1">Seviye {level}</div>
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
                <span className="text-gray-600 text-xs font-mono">{assignments.filter(a => a.class_id === classDisplay).length} Yeni</span>
            </div>

            <div className="flex flex-col space-y-2 mb-8">
                {assignments.filter(a => a.class_id === classDisplay).length === 0 ? (
                    <div className="py-4 text-center border border-dashed border-[#27272A] rounded-xl text-gray-600 text-xs">Henüz atanmış bir şey yok.</div>
                ) : (
                    assignments.filter(a => a.class_id === classDisplay).map((asgn: any) => (
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
    institutionName: string
}> = ({ onAiNoteGen, onExamGen, onClassLog, notes, onAssignOpen, onNoteClick, institutionName }) => {
    return (
        <div className="flex flex-col gap-8 h-full overflow-y-auto p-4 md:p-8">
            <div>
                <h2 className="text-2xl font-bold text-white mb-1">Öğretmen Paneli</h2>
                <p className="text-indigo-400 text-sm font-bold">
                    <i className="fas fa-building mr-2"></i>{institutionName}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

                {/* 4. ÖĞRENCİ DURUMLARI */}
                <div className="bg-gradient-to-br from-orange-900/10 to-amber-900/10 border border-orange-500/30 p-6 rounded-2xl relative overflow-hidden hover:border-orange-500 transition-all cursor-pointer group h-40 flex flex-col justify-between">
                    <div className="absolute top-2 right-2 bg-orange-500/20 text-orange-400 text-[10px] font-bold px-2 py-1 rounded border border-orange-500/30">AKTİF</div>
                    <div className="w-12 h-12 bg-orange-600/20 text-orange-400 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                        <i className="fas fa-users"></i>
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-lg">Öğrenci Durumları</h3>
                        <p className="text-gray-400 text-xs mt-1">Gelişim raporlarını incele.</p>
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
const PrincipalDashboard: React.FC<{ weeklyReports: WeeklyReport[], onClassChange: () => void, institutionName: string }> = ({ weeklyReports: initialReports, onClassChange, institutionName }) => {
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

    useEffect(() => {
        fetchClasses();
        // Raporları kuruma göre filtrele
        const institutionReports = initialReports.filter(r => {
            // localStorage key ile eşleştir
            const reportInstitution = localStorage.getItem('institution_name') || '';
            return true; // Şimdilik hepsini göster, gerçek filtreleme için institution_id kullanılmalı
        });
        setReports(initialReports);
    }, [initialReports, institutionName]);

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
        const classReports = reports.filter(r => r.class_id === selectedClass);
        const dates = Array.from(new Set(classReports.map(r => r.date)));
        return dates.sort().reverse();
    };

    const getReportsForDate = () => {
        return reports.filter(r => r.class_id === selectedClass && r.date === selectedDate);
    };

    const generateWeeklyPDF = () => {
        const dateReports = getReportsForDate();
        const element = document.createElement('div');
        const dateStr = selectedDate ? new Date(selectedDate).toLocaleDateString('tr-TR') : '';
        // PDF için Beyaz Arka Plan, Siyah Yazı (Light Mode)
        element.innerHTML = `
            <div style="padding: 40px; font-family: 'Segoe UI', Arial, sans-serif; background: white !important; color: black !important; width: 100%;">
                <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px;">
                    <h1 style="margin: 0; font-size: 24px; color: #000; font-weight: 900; letter-spacing: 1px;">GÜNLÜK SINIF RAPORU</h1>
                    <p style="margin: 5px 0; color: #444; font-size: 14px;">${selectedClass} | ${dateStr} | ${institutionName}</p>
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
            filename: `${selectedClass}_${dateStr}_Raporu.pdf`,
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
                <div style="text-align: center; border-bottom: 3px solid #000; padding-bottom: 20px; margin-bottom: 40px;">
                    <h1 style="margin: 0; font-size: 28px; color: #000; font-weight: 900; letter-spacing: 2px;">DERS DEĞERLENDİRME FORMU</h1>
                    <p style="margin: 10px 0 0; color: #444; font-size: 14px; font-weight: bold;">STUDYFLOW EĞİTİM YÖNETİM SİSTEMİ</p>
                </div>
                
                <div style="display: grid; grid-template-cols: 1fr 1fr; gap: 30px; margin-bottom: 40px; border: 1px solid #000; padding: 20px; border-radius: 4px;">
                    <div style="font-size: 14px;"><strong>SINIF:</strong> <span style="margin-left: 10px;">${report.class_id}</span></div>
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
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tight">YÖNETİM PANELİ</h2>
                    <p className="text-purple-400 text-sm font-bold">
                        <i className="fas fa-building mr-2"></i>{institutionName}
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                        {viewMode === 'classes' && 'Sınıf Listesi'}
                        {viewMode === 'dates' && `${selectedClass} - Günlük Raporlar`}
                        {viewMode === 'reports' && `${selectedClass} - ${new Date(selectedDate).toLocaleDateString('tr-TR')} Raporları`}
                    </p>
                </div>
                {viewMode !== 'classes' && (
                    <button onClick={() => {
                        if (viewMode === 'detail') setViewMode('reports');
                        else if (viewMode === 'reports') setViewMode('dates');
                        else setViewMode('classes');
                    }} className="text-gray-400 hover:text-white flex items-center gap-2 font-bold">
                        <i className="fas fa-arrow-left"></i> Geri
                    </button>
                )}
            </header>

            {viewMode === 'classes' && (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 animate-fade-in">
                    {classList.map(cls => (
                        <div key={cls.id} className="relative group">
                            <button onClick={() => { setSelectedClass(`${cls.grade}-${cls.branch}`); setViewMode('dates'); }}
                                className="w-full p-6 rounded-2xl border border-[#27272A] bg-[#18181B] hover:border-purple-500 hover:bg-[#202025] transition-all">
                                <div className="text-2xl font-black text-white group-hover:text-purple-400 transition-colors">{cls.grade}-{cls.branch}</div>
                                <div className="text-[10px] uppercase font-bold text-gray-500">Sınıf Dosyası</div>
                            </button>
                            <button onClick={() => handleDeleteClass(cls)} className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 hover:bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                    ))}
                    <button onClick={() => setShowAddClassModal(true)} className="p-6 rounded-2xl border border-dashed border-[#27272A] hover:border-white text-gray-500 hover:text-white transition-all flex flex-col items-center justify-center gap-2">
                        <i className="fas fa-plus text-xl"></i>
                        <span className="text-xs font-bold">Sınıf Ekle</span>
                    </button>
                </div>
            )}

            {viewMode === 'dates' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
                    {getUniqueDates().length === 0 ? (
                        <div className="col-span-full text-center py-20 text-gray-500">Bu sınıfa ait günlük rapor bulunamadı.</div>
                    ) : (
                        getUniqueDates().map(date => (
                            <button key={date} onClick={() => { setSelectedDate(date); setViewMode('reports'); }}
                                className="flex items-center gap-4 p-6 rounded-2xl border border-[#27272A] bg-[#18181B] hover:border-blue-500 hover:bg-[#202025] transition-all text-left">
                                <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center text-xl"><i className="fas fa-calendar-day"></i></div>
                                <div>
                                    <h4 className="text-white font-bold">{new Date(date).toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h4>
                                    <p className="text-xs text-gray-500 mt-1">{reports.filter(r => r.class_id === selectedClass && r.date === date).length} rapor</p>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            )}

            {viewMode === 'reports' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="flex justify-between items-center">
                        <h3 className="text-white font-bold">{new Date(selectedDate).toLocaleDateString('tr-TR')} - {selectedClass}</h3>
                        <button onClick={generateWeeklyPDF} className="bg-red-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-red-700 transition-all flex items-center gap-2">
                            <i className="fas fa-file-pdf"></i> PDF İndir
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {getReportsForDate().length === 0 ? (
                            <div className="col-span-full text-center py-20 text-gray-500">Bu tarihe ait rapor bulunamadı.</div>
                        ) : (
                            getReportsForDate().map(r => (
                                <div key={r.id} onClick={() => { setActiveReport(r); setViewMode('detail'); }} className="group bg-[#202025] border border-[#27272A] p-4 rounded-2xl hover:border-purple-500/50 cursor-pointer relative">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="w-10 h-10 bg-purple-500/10 text-purple-400 rounded-lg flex items-center justify-center"><i className="fas fa-file-alt"></i></div>
                                        <button onClick={(e) => handleDeleteReport(r.id, e)} className="text-gray-600 hover:text-red-500 p-2 hover:bg-red-500/10 rounded-lg transition-colors"><i className="fas fa-trash"></i></button>
                                    </div>
                                    <h4 className="text-white font-bold text-sm truncate">{r.lesson}</h4>
                                    <p className="text-gray-400 text-xs mt-1">{r.teacher_name}</p>
                                    <p className="text-gray-500 text-xs mt-1 truncate">{r.topic}</p>
                                    <div className="mt-3 flex gap-1">{[...Array(5)].map((_, i) => <i key={i} className={`fas fa-star text-[10px] ${i < r.rating ? 'text-yellow-500' : 'text-gray-800'}`}></i>)}</div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {viewMode === 'detail' && activeReport && (
                <div className="bg-white rounded-3xl p-8 max-w-3xl mx-auto text-black shadow-2xl animate-fade-in relative min-h-[600px]">
                    {/* Basit Detay Görünümü */}
                    <div className="absolute top-0 left-0 w-full h-2 bg-purple-600"></div>
                    <div className="mb-8 border-b pb-4 flex justify-between items-start">
                        <div>
                            <h1 className="text-2xl font-black text-gray-900">RAPOR DETAYI</h1>
                            <p className="text-gray-500">{new Date(activeReport.date).toLocaleDateString('tr-TR')}</p>
                        </div>
                        <button onClick={() => generateDetailPDF(activeReport)} className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-black"><i className="fas fa-download mr-1"></i> İndir</button>
                    </div>
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-4 rounded-xl"><label className="text-xs font-bold text-gray-400 block mb-1">DERS</label><div className="font-bold text-lg">{activeReport.lesson}</div></div>
                            <div className="bg-gray-50 p-4 rounded-xl"><label className="text-xs font-bold text-gray-400 block mb-1">ÖĞRETMEN</label><div className="font-bold text-lg">{activeReport.teacher_name}</div></div>
                        </div>
                        <div><label className="text-xs font-bold text-gray-400 block mb-1">KONU</label><div className="bg-gray-50 p-4 rounded-xl font-medium">{activeReport.topic}</div></div>
                        <div><label className="text-xs font-bold text-gray-400 block mb-1">NOTLAR</label><div className="bg-gray-50 p-4 rounded-xl leading-relaxed">{activeReport.note}</div></div>
                    </div>
                </div>
            )}

            {/* SINIF EKLEME MODALI */}
            {showAddClassModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-[#18181B] border border-[#27272A] w-full max-w-sm rounded-2xl shadow-2xl p-6">
                        <h3 className="text-white font-bold text-lg mb-4">Yeni Sınıf Ekle</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-gray-500 font-bold uppercase mb-2 block">Sınıf Seviyesi</label>
                                <select value={newClassGrade} onChange={(e) => setNewClassGrade(e.target.value)} className="w-full bg-[#0F0F12] border border-[#27272A] rounded-xl p-3 text-white outline-none focus:border-purple-500">
                                    <option value="9">9. Sınıf</option>
                                    <option value="10">10. Sınıf</option>
                                    <option value="11">11. Sınıf</option>
                                    <option value="12">12. Sınıf</option>
                                    <option value="Mezun">Mezun</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 font-bold uppercase mb-2 block">Şube</label>
                                <input type="text" value={newClassBranch} onChange={(e) => setNewClassBranch(e.target.value)} className="w-full bg-[#0F0F12] border border-[#27272A] rounded-xl p-3 text-white outline-none focus:border-purple-500" placeholder="A, B, C..." />
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button onClick={() => setShowAddClassModal(false)} className="flex-1 bg-[#27272A] hover:bg-[#3F3F46] text-white font-bold py-3 rounded-xl transition-all">İptal</button>
                                <button onClick={handleAddClass} className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-xl transition-all">Ekle</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* SINIF SİLME ONAY MODALI */}
            {showDeleteClassModal && classToDelete && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-[#18181B] border border-red-500/30 w-full max-w-sm rounded-2xl shadow-2xl p-6">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <i className="fas fa-exclamation-triangle text-red-400 text-2xl"></i>
                            </div>
                            <h3 className="text-white font-bold text-lg mb-2">Sınıfı Sil</h3>
                            <p className="text-gray-400 text-sm">
                                <strong className="text-white">{classToDelete.grade}-{classToDelete.branch}</strong> sınıfını silmek istediğinize emin misiniz?
                            </p>
                            <p className="text-red-400 text-xs mt-2">Bu işlem geri alınamaz!</p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => { setShowDeleteClassModal(false); setClassToDelete(null); }} className="flex-1 bg-[#27272A] hover:bg-[#3F3F46] text-white font-bold py-3 rounded-xl transition-all">İptal</button>
                            <button onClick={confirmDeleteClass} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition-all">Sil</button>
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
    const { xp, level, nextLevelXp, addXp } = useGamification();
    const [role, setRole] = useState<UserRole>('student');
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

    useEffect(() => {
        const fetchRole = async () => {
            const localRole = localStorage.getItem('user_role') as UserRole;
            if (localRole) setRole(localRole);

            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase.from('profiles').select('role').eq('user_id', user.id).single();
                if (data) setRole(data.role as UserRole);
                fetchNotes(user.id);
                // Öğretmen/öğrenci ekranı için sınıfları çek
                await fetchTeacherClasses();
                // Öğrenci ise atamaları çek
                await fetchAssignments(user.id);
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
            // Get institution ID just in case needed, but RLS handles filtering
            const instId = localStorage.getItem('institution_id');

            if (!instId || instId.trim() === '') {
                // Try simple recovery or abort
                console.warn('Institution ID missing for reports');
                return;
            }

            const { data, error } = await supabase
                .from('weekly_reports')
                .select('*')
                .eq('institution_id', instId) // RLS handles this, but explicit check is safer
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
                        .single();

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
            console.error('[Dashboard] Fetch hatası:', e);
            setTeacherClasses([]);
        }
    };

    const fetchAssignments = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('assignments')
                .select('*')
                .eq('student_id', userId)
                .order('created_at', { ascending: false });
            if (!error && data) {
                setAssignments(data);
            }
        } catch (e) {
            console.error("fetchAssignments Error:", e);
        }
    };

    const handleAssignmentClick = async (assignment: any) => {
        // Öğrenci atamayı görüntüleyince sil
        try {
            if (assignment.id.startsWith('demo_')) {
                const local = JSON.parse(localStorage.getItem('mock_assignments') || '[]');
                const updated = local.filter((a: any) => a.id !== assignment.id);
                localStorage.setItem('mock_assignments', JSON.stringify(updated));
                setAssignments(updated);
            } else {
                const { error } = await supabase.from('assignments').delete().eq('id', assignment.id);
                if (!error) setAssignments(prev => prev.filter(a => a.id !== assignment.id));
            }
            toast.success('Atama açıldı ve listeden kaldırıldı');
        } catch (e) {
            console.error('Atama silme hatası:', e);
        }

        // Sonra içeriği aç
        if (assignment.type === 'exam') {
            navigate('/exam', { state: { examId: assignment.content_id || assignment.item_id } });
        } else {
            navigate('/notes', { state: { noteId: assignment.content_id || assignment.item_id || assignment.id } });
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
        const instId = localStorage.getItem('institution_id');
        const timestamp = new Date().toISOString().split('T')[0];

        const newReport: any = {
            ...report,
            date: report.date || timestamp,
            institution_id: instId
        };

        try {
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

        const newReport = await addWeeklyReport({
            class_id: selectedClass,
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

    const handleHandleAssign = async (class_id: string) => {
        if (!assignItem) return;

        try {
            const instId = localStorage.getItem('institution_id');
            const isStaff = localStorage.getItem('staff_authenticated') === 'true';

            // LOCAL/DEMO MODE ASSIGNMENT
            if (instId && instId.startsWith('demo-')) {
                const localAssignments = JSON.parse(localStorage.getItem('mock_assignments') || '[]');

                const newAssignment = {
                    id: 'demo_' + Date.now(),
                    content_id: assignItem.id,
                    title: assignItem.title,
                    type: assignItem.type,
                    class_id: class_id,
                    institution_id: instId,
                    created_at: new Date().toISOString()
                };

                localAssignments.push(newAssignment);
                localStorage.setItem('mock_assignments', JSON.stringify(localAssignments));
                setAssignments(localAssignments);

                toast.success(`"${assignItem.title}" ${class_id} sınıfına atandı!`);
                setShowAssignModal(false);
                setAssignItem(null);
                return;
            }

            // REAL MODE (Supabase)
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                toast.error('Oturum süreniz dolmuş olabilir.');
                return;
            }

            const assignment = {
                teacher_id: user.id,
                institution_id: instId,
                class_id: class_id,
                title: assignItem.title,
                type: assignItem.type,
                due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                created_at: new Date().toISOString()
            };

            const { error } = await supabase.from('assignments').insert([assignment]);

            if (error) throw error;

            toast.success('Başarıyla atandı!');
            setShowAssignModal(false);
            setAssignItem(null);
        } catch (e) {
            console.error("Atama hatası:", e);
            toast.error('Atama sırasında bir hata oluştu. Demo moduna geçiliyor.');

            // Fallback
            const localAssignments = JSON.parse(localStorage.getItem('mock_assignments') || '[]');
            localAssignments.push({
                id: 'mock_' + Date.now(),
                title: assignItem.title,
                type: assignItem.type,
                class_id: class_id,
                institution_id: localStorage.getItem('institution_id')
            });
            localStorage.setItem('mock_assignments', JSON.stringify(localAssignments));
            setShowAssignModal(false);
        }
    };
    const fetchNotes = async (userId: string) => {
        // Strict filtering by user_id to prevent data leakage between teachers and students
        if (!userId) return;

        // Ensure we are filtering by the actual logged in user's ID
        const { data: { user } } = await supabase.auth.getUser();
        const activeUserId = user?.id || userId;

        const { data } = await supabase.from('notes').select('*').eq('user_id', activeUserId).order('created_at', { ascending: false });
        if (data) setNotes(data as Note[]);

        // Mock activity fetch
        const { data: activity } = await supabase.from('activity_logs').select('xp_amount, created_at').eq('user_id', activeUserId).gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
        // Calculate weekly from this data (Mocking for now)
        setWeeklyActivity([150, 230, 180, 320, 290, 140, 450]);
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
            toast.success('Yeni not oluşturuldu');

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                const local = JSON.parse(localStorage.getItem('guest_notes') || '[]');
                local.unshift({ id: newId, user_id: 'guest', title: manualTitle, body_html: '<p>Not içerik...</p>', type: 'normal', created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
                localStorage.setItem('guest_notes', JSON.stringify(local));
                setNotes(local);
            }

            // Öğretmen ise atama modalı aç
            if (role === 'teacher') {
                setAssignItem({ id: newId, type: 'note', title: manualTitle });
                setShowAssignModal(true);
            }
            navigate('/notes', { state: { noteId: newId, isNew: true, initialTitle: manualTitle } });
            setManualTitle('');
        } else {
            if (!aiTopic) { alert("Konu zorunlu."); return; }
            setShowNewNoteModal(false);
            setLoadingOverlay({ show: true, msg: t('ai_thinking') });
            try {
                const html = await aiHelper.generateNote(aiTopic, aiGrade, aiDetails, language);
                setLoadingOverlay({ show: false, msg: '' });
                const newId = 'ai_' + Date.now();
                toast.success('AI notu oluşturuldu');
                await addXp(250, 'note_create');

                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    const local = JSON.parse(localStorage.getItem('guest_notes') || '[]');
                    local.unshift({ id: newId, user_id: 'guest', title: aiTopic, body_html: html, type: 'normal', created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
                    localStorage.setItem('guest_notes', JSON.stringify(local));
                    setNotes(local);
                } else {
                    const instId = localStorage.getItem('institution_id');
                    await supabase.from('notes').insert([{
                        id: newId,
                        user_id: user.id,
                        title: aiTopic,
                        body_html: html,
                        type: 'normal',
                        institution_id: instId
                    }]);
                }

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
        if (user) {
            await supabase.from('notes').delete().eq('id', id);
        } else {
            const local = notes.filter(n => n.id !== id);
            localStorage.setItem('guest_notes', JSON.stringify(local));
        }
        setNotes(prev => prev.filter(n => n.id !== id));
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
                const cleanBase64 = base64.split(',')[1];
                const html = await aiHelper.analyzePdf(cleanBase64, language);
                setLoadingOverlay({ show: false, msg: "" }); // Yükleme bitti
                toast.success('PDF analizi tamamlandı');
                addXp(150);
                navigate('/notes', { state: { initialTitle: file.name, initialContent: html, isNew: true } });
            } catch (err) {
                setLoadingOverlay({ show: false, msg: "" });
                alert("PDF Analizi başarısız oldu.");
            }
        };
        reader.readAsDataURL(file);
    };

    if (role === 'principal') {
        const institutionName = localStorage.getItem('institution_name') || 'Bilinmeyen Kurum';
        return <PrincipalDashboard weeklyReports={weeklyReports} onClassChange={fetchTeacherClasses} institutionName={institutionName} />;
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
                                            <option value="9">9. Sınıf</option>
                                            <option value="10">10. Sınıf</option>
                                            <option value="11">11. Sınıf</option>
                                            <option value="12">12. Sınıf</option>
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
                                            onClick={() => handleHandleAssign(`${c.grade}-${c.branch}`)}
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
                    institutionName={localStorage.getItem('institution_name') || 'Kurum'}
                />
            ) : role === 'teacher' ? (
                <TeacherDashboard
                    onAiNoteGen={handleNewNote}
                    onExamGen={() => navigate('/exam')}
                    onClassLog={() => setShowClassLogModal(true)}
                    notes={notes}
                    onAssignOpen={(id, type, title) => { setAssignItem({ id, type, title }); setShowAssignModal(true); }}
                    onNoteClick={handleNoteClick}
                    institutionName={localStorage.getItem('institution_name') || 'Bilinmeyen Kurum'}
                />
            ) : (
                <StudentDashboard
                    notes={notes}
                    xp={xp}
                    level={level}
                    nextLevelXp={nextLevelXp}
                    onNoteClick={handleNoteClick}
                    onDeleteNote={handleDeleteNote}
                    onShareNote={handleShareNote}
                    onNewNote={handleNewNote}
                    onUploadPdf={handleUploadPdf}
                    fileInputRef={fileInputRef}
                    assignments={assignments}
                    onAssignmentClick={handleAssignmentClick}
                    institutionName={localStorage.getItem('institution_name') || 'Bilinmeyen Kurum'}
                    classDisplay={localStorage.getItem('class_display') || 'Sınıf Belirlenmedi'}
                />
            )}
        </div>
    );
};

export default Dashboard;