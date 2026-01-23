
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { aiHelper } from '../lib/aiHelper';
import { useLanguage } from '../lib/LanguageContext';
import { useGamification } from '../lib/GamificationContext';
import toast from 'react-hot-toast';


const FONTS = [
    { name: 'Modern (Inter)', value: "'Inter', sans-serif" },
    { name: 'Classic (Serif)', value: "Georgia, serif" },
    { name: 'Technical (Mono)', value: "'JetBrains Mono', monospace" }
];

const Notes: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { t, language } = useLanguage();
    const { addXp } = useGamification();
    const state = location.state as any;

    const [noteId, setNoteId] = useState<string | null>(state?.noteId || null);
    const [editorTitle, setEditorTitle] = useState(state?.initialTitle || 'Untitled');
    const [saving, setSaving] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [loadingStatus, setLoadingStatus] = useState<string | null>(null);
    const [activeStyles, setActiveStyles] = useState({ bold: false, italic: false, underline: false, justifyLeft: true, justifyCenter: false, justifyRight: false, justifyFull: false, listUl: false, listOl: false });

    const editorRef = useRef<HTMLDivElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const initNote = async () => {
            if (editorRef.current && state?.initialContent) {
                editorRef.current.innerHTML = state.initialContent;
                return;
            }

            if (noteId) {
                // Determine User ID for LocalStorage Key
                const { data: { user } } = await supabase.auth.getUser();
                const userId = user ? user.id : 'guest';
                const storageKey = `studyflow_notes_${userId}`;

                // 1. Try LocalStorage
                const localData = localStorage.getItem(storageKey);
                const localNotes = localData ? JSON.parse(localData) : [];
                const foundLocal = localNotes.find((n: any) => n.id === noteId);

                if (foundLocal && editorRef.current) {
                    editorRef.current.innerHTML = foundLocal.body_html;
                    setEditorTitle(foundLocal.title);
                } else {
                    // 2. Fallback to Supabase (Teacher assigned notes)
                    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(noteId);

                    if (isUuid) {
                        setLoadingStatus(language === 'tr' ? 'Not Yükleniyor...' : 'Loading Note...');
                        const { data, error } = await supabase.from('notes').select('*').eq('id', noteId).maybeSingle();
                        setLoadingStatus(null);

                        if (data && editorRef.current) {
                            editorRef.current.innerHTML = data.body_html || '';
                            setEditorTitle(data.title || 'Adsız Not');
                        } else if (error || !data) {
                            console.error("Supabase fetch error or no data:", error);
                            if (editorRef.current) {
                                editorRef.current.innerHTML = `<div style="padding: 40px; text-align: center; color: #666;">
                                    <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 20px; color: #f59e0b;"></i>
                                    <h3>Not Bulunamadı</h3>
                                    <p>Bu not henüz buluta yüklenmemiş veya silinmiş olabilir. Lütfen öğretmeninizle iletişime geçin.</p>
                                </div>`;
                                setEditorTitle('Hata: Not Bulunamadı');
                            }
                        }
                    } else {
                        // 3. Fallback to Guest Notes (Legacy)
                        const guestNotes = JSON.parse(localStorage.getItem('guest_notes') || '[]');
                        const foundGuest = guestNotes.find((n: any) => n.id === noteId);
                        if (foundGuest && editorRef.current) {
                            editorRef.current.innerHTML = foundGuest.body_html;
                            setEditorTitle(foundGuest.title);
                        } else if (editorRef.current) {
                            // Global fallback
                            editorRef.current.innerHTML = 'İçerik yüklenemedi...';
                        }
                    }
                }
            }
        };
        initNote();
    }, [noteId, state]);



    const saveNote = useCallback(async () => {
        if (!editorRef.current) return;
        setSaving(true);
        const { data: { user } } = await supabase.auth.getUser();
        const body = editorRef.current.innerHTML;
        const title = editorTitle;
        const timestamp = new Date().toISOString();

        try {
            // HYBRID/OFFLINE MODE: Save to LocalStorage ONLY
            // As requested, we bypass Supabase DB for notes to prevent errors and enable offline mode.

            const userId = user ? user.id : 'guest';
            const storageKey = `studyflow_notes_${userId}`;

            // Fetch existing notes
            const localData = localStorage.getItem(storageKey);
            let localNotes: any[] = localData ? JSON.parse(localData) : [];

            const isUuid = noteId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(noteId);
            const foundInLocal = noteId ? localNotes.findIndex((n: any) => n.id === noteId) : -1;

            if (noteId && !noteId.startsWith('new_') && (foundInLocal !== -1 || !isUuid)) {
                // UPDATE EXISTING LOCAL
                const index = foundInLocal;
                if (index !== -1) {
                    localNotes[index] = {
                        ...localNotes[index],
                        title,
                        body_html: body,
                        updated_at: timestamp
                    };
                } else {
                    // Not found locally? Create it.
                    localNotes.push({
                        id: noteId,
                        user_id: userId,
                        title,
                        body_html: body,
                        type: 'normal',
                        created_at: timestamp,
                        updated_at: timestamp,
                        institution_id: localStorage.getItem('institution_id')
                    });
                }
            } else {
                // CREATE NEW (OR IMPORT ASSIGNMENT)
                // If it was an assignment (UUID from teacher), we create a fresh local copy for the student
                const newId = 'loc_' + Date.now() + Math.random().toString(36).substr(2, 9);

                localNotes.push({
                    id: newId,
                    user_id: userId,
                    title,
                    body_html: body,
                    type: 'normal',
                    created_at: timestamp,
                    updated_at: timestamp,
                    institution_id: localStorage.getItem('institution_id')
                });

                setNoteId(newId);
                addXp(250);
                if (isUuid) toast.success("Not kütüphanenize kopyalandı");
            }

            // Save back to storage
            localStorage.setItem(storageKey, JSON.stringify(localNotes));

            setShowToast(true); setTimeout(() => setShowToast(false), 2000);
            toast.success("Not yerel olarak kaydedildi");

        } catch (e) {
            console.error(e);
            toast.error("Kaydetme hatası");
        } finally {
            setSaving(false);
        }
    }, [noteId, editorTitle, addXp]);

    const handlePdfExport = () => {
        const element = document.getElementById('printable-area');
        const html2pdf = (window as any).html2pdf;

        if (element && html2pdf) {
            setLoadingStatus(language === 'tr' ? 'PDF Hazırlanıyor...' : 'Generating PDF...');

            // PDF modunda body'e class ekle
            document.body.classList.add('pdf-mode');

            // CRITICAL: Scroll to top to ensure absolute origin capture matches viewport
            window.scrollTo(0, 0);

            // Bekleme süresi ekle ki CSS class tam otursun
            setTimeout(() => {
                const opt = {
                    margin: [0, 0, 0, 0], // Margins handled by CSS padding
                    filename: `${editorTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`,
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: {
                        scale: 2,
                        useCORS: true,
                        letterRendering: true,
                        backgroundColor: '#ffffff',
                        logging: true, // Hataları görmek için açtık
                        scrollX: 0,
                        scrollY: 0
                    },
                    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
                    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
                };

                html2pdf().set(opt).from(element).save().then(() => {
                    document.body.classList.remove('pdf-mode');
                    setLoadingStatus(null);
                }).catch((err: any) => {
                    console.error(err);
                    document.body.classList.remove('pdf-mode');
                    setLoadingStatus(null);
                    alert("PDF oluşturulurken hata oluştu.");
                });
            }, 2500);
        }
    };

    const updateActiveStates = () => { try { setActiveStyles({ bold: document.queryCommandState('bold'), italic: document.queryCommandState('italic'), underline: document.queryCommandState('underline'), justifyLeft: document.queryCommandState('justifyLeft'), justifyCenter: document.queryCommandState('justifyCenter'), justifyRight: document.queryCommandState('justifyRight'), justifyFull: document.queryCommandState('justifyFull'), listUl: document.queryCommandState('insertUnorderedList'), listOl: document.queryCommandState('insertOrderedList'), }); } catch (e) { } };
    const execCmd = (command: string, value: string | undefined = undefined) => { document.execCommand(command, false, value); editorRef.current?.focus(); updateActiveStates(); };



    return (
        <div className="flex h-screen bg-[#0F0F12] overflow-hidden relative font-sans">
            {showToast && <div className="fixed bottom-8 right-8 bg-[#18181B] border border-green-500/30 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-[100] animate-fade-in-up backdrop-blur-md"><i className="fas fa-check-circle text-green-500"></i><span className="font-bold text-sm tracking-tight">{t('saved')}</span></div>}
            <input type="file" ref={imageInputRef} onChange={(e) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onload = (re) => { if (re.target?.result) execCmd('insertImage', re.target.result as string); }; reader.readAsDataURL(file); } }} accept="image/*" className="hidden" />
            {loadingStatus && (<div className="fixed inset-0 bg-black/80 z-[300] flex flex-col items-center justify-center backdrop-blur-xl"><div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-6 shadow-[0_0_30px_rgba(168,85,247,0.3)]"></div><h3 className="text-white font-black text-2xl animate-pulse uppercase tracking-[0.2em]">{loadingStatus}</h3></div>)}



            <div className="flex-1 flex flex-col h-full overflow-hidden">
                <header className="h-16 flex items-center justify-between px-8 border-b border-white/5 bg-[#18181B] shrink-0 gap-6">
                    <div className="flex items-center gap-6 flex-1 min-w-0">
                        <button onClick={() => navigate('/')} className="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center text-gray-500 hover:text-white transition-all"><i className="fas fa-arrow-left"></i></button>
                        <input value={editorTitle} onChange={(e) => setEditorTitle(e.target.value)} className="bg-transparent text-white font-black focus:outline-none w-full text-xl tracking-tighter truncate" placeholder="Başlık Yazın..." />
                    </div>
                    <div className="flex items-center gap-2">
                        <NoteActionBtn icon="fas fa-save" color="hover:text-green-500" onClick={saveNote} title="Kaydet" />
                        <NoteActionBtn icon="fas fa-file-pdf" color="hover:text-red-500" onClick={handlePdfExport} title="PDF Olarak Al" />
                    </div>
                </header>

                <div className="flex items-center gap-2 px-6 py-2.5 border-b border-white/5 bg-[#1C1C21] overflow-x-auto whitespace-nowrap scrollbar-hide no-print">
                    <select onChange={(e) => execCmd('fontName', e.target.value)} className="bg-black/40 text-white text-[11px] font-black uppercase tracking-widest rounded-lg px-4 py-2 border border-white/10 outline-none focus:border-purple-500 transition-colors">
                        {FONTS.map(f => <option key={f.value} value={f.value}>{f.name}</option>)}
                    </select>
                    <div className="h-6 w-[1px] bg-white/10 mx-2"></div>
                    <ToolbarBtn icon="fas fa-bold" isActive={activeStyles.bold} onClick={() => execCmd('bold')} />
                    <ToolbarBtn icon="fas fa-italic" isActive={activeStyles.italic} onClick={() => execCmd('italic')} />
                    <ToolbarBtn icon="fas fa-underline" isActive={activeStyles.underline} onClick={() => execCmd('underline')} />
                    <div className="h-6 w-[1px] bg-white/10 mx-2"></div>
                    <ToolbarBtn icon="fas fa-align-left" isActive={activeStyles.justifyLeft} onClick={() => execCmd('justifyLeft')} />
                    <ToolbarBtn icon="fas fa-align-center" isActive={activeStyles.justifyCenter} onClick={() => execCmd('justifyCenter')} />
                    <ToolbarBtn icon="fas fa-align-right" isActive={activeStyles.justifyRight} onClick={() => execCmd('justifyRight')} />
                    <div className="h-6 w-[1px] bg-white/10 mx-2"></div>
                    <button onMouseDown={(e) => { e.preventDefault(); imageInputRef.current?.click(); }} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-all" title="Resim Ekle"><i className="far fa-image text-lg"></i></button>
                    <button onMouseDown={(e) => { e.preventDefault(); execCmd('insertHTML', '<table style="width:100%; border-collapse: collapse; margin: 2rem 0; border: 2px solid #3F3F46; border-radius: 12px; overflow: hidden;"><thead><tr style="background: #27272A;"><th style="padding: 12px; text-align: left; color: #FFF; border-bottom: 2px solid #3F3F46;">Başlık 1</th><th style="padding: 12px; text-align: left; color: #FFF; border-bottom: 2px solid #3F3F46;">Başlık 2</th></tr></thead><tbody><tr><td style="padding: 12px; border-bottom: 1px solid #27272A; color: #D4D4D8;">Veri...</td><td style="padding: 12px; border-bottom: 1px solid #27272A; color: #D4D4D8;">Veri...</td></tr></tbody></table><p><br/></p>'); }} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-all" title="Tablo Ekle"><i className="fas fa-table text-lg"></i></button>
                    <button onMouseDown={(e) => { e.preventDefault(); execCmd('insertHTML', '<div class="summary-box"><strong>Özet:</strong> Buraya özet metni gelecek...</div><p><br/></p>'); }} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-all" title="Özet Kutusu"><i className="fas fa-info-circle text-lg"></i></button>
                </div>

                <div className="flex-1 overflow-y-auto notebook-container selection:bg-purple-500/30 selection:text-white scroll-smooth" onClick={() => editorRef.current?.focus()}>
                    <div id="printable-area" ref={editorRef} contentEditable spellCheck={false} onBlur={saveNote} onKeyUp={updateActiveStates} onMouseUp={updateActiveStates} className="editor-content notebook-paper animate-fade-in"></div>
                </div>
            </div>


        </div>
    );
};

const NoteActionBtn: React.FC<{ icon: string, color: string, onClick: () => void, title: string }> = ({ icon, color, onClick, title }) => (
    <button onClick={onClick} className={`w-11 h-11 flex items-center justify-center rounded-xl text-gray-500 ${color} transition-all hover:bg-white/5 text-lg`} title={title}><i className={icon}></i></button>
);

const ToolbarBtn: React.FC<{ icon: string, isActive: boolean, onClick: () => void }> = ({ icon, isActive, onClick }) => (
    <button onMouseDown={(e) => { e.preventDefault(); onClick(); }} className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all shadow-sm ${isActive ? 'bg-purple-600 text-white scale-110 shadow-lg shadow-purple-900/40' : 'hover:bg-white/5 text-gray-400 hover:text-white'}`}><i className={icon}></i></button>
);

export default Notes;
