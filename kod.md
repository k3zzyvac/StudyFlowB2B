NOTES.TSX:

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { aiHelper } from '../lib/aiHelper';
import { useLanguage } from '../lib/LanguageContext';
import { useGamification } from '../lib/GamificationContext';
import { Flashcard } from '../types';

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
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [activeStyles, setActiveStyles] = useState({ bold: false, italic: false, underline: false, justifyLeft: true, justifyCenter: false, justifyRight: false, justifyFull: false, listUl: false, listOl: false });
  const [isChatOpen, setIsChatOpen] = useState(false); 
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{role:'user'|'model', content:string}[]>([{ role: 'model', content: language === 'tr' ? "Merhaba! Notun hakkında istediğini sorabilirsin." : "Hello! Feel free to ask anything about your note." }]);
  const [showMindMap, setShowMindMap] = useState(false);
  const [mindMapCode, setMindMapCode] = useState('');
  const [mapScale, setMapScale] = useState(1);
  const [mapPos, setMapPos] = useState({ x: 0, y: 0 });
  
  const [showFlashcards, setShowFlashcards] = useState(false);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const isDraggingMap = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  useEffect(() => {
     const initNote = async () => {
         if (noteId && !state?.initialContent) {
             const { data } = await supabase.from('notes').select('*').eq('id', noteId).single();
             if (data && editorRef.current) { 
                 editorRef.current.innerHTML = data.body_html; 
                 setEditorTitle(data.title); 
             } else {
                 const localNotes = JSON.parse(localStorage.getItem('guest_notes') || '[]');
                 const found = localNotes.find((n: any) => n.id === noteId);
                 if (found && editorRef.current) {
                     editorRef.current.innerHTML = found.body_html;
                     setEditorTitle(found.title);
                 }
             }
         } else if (state?.initialContent && editorRef.current) {
             editorRef.current.innerHTML = state.initialContent;
         }
         if ((window as any).mermaid) {
            (window as any).mermaid.initialize({ startOnLoad: true, theme: 'dark' });
         }
     };
     initNote();
  }, [noteId, state]);

  useEffect(() => {
    if (chatBottomRef.current) chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const saveNote = useCallback(async () => {
      if (!editorRef.current) return;
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      const body = editorRef.current.innerHTML;
      const title = editorTitle;
      const timestamp = new Date().toISOString();

      try {
          if (!user) {
              const localNotes = JSON.parse(localStorage.getItem('guest_notes') || '[]');
              if (noteId) {
                  const updated = localNotes.map((n: any) => n.id === noteId ? { ...n, title, body_html: body, updated_at: timestamp } : n);
                  localStorage.setItem('guest_notes', JSON.stringify(updated));
              } else {
                  const newId = 'guest_' + Date.now();
                  localNotes.push({ id: newId, user_id: 'guest', title, body_html: body, type: 'normal', created_at: timestamp, updated_at: timestamp });
                  localStorage.setItem('guest_notes', JSON.stringify(localNotes));
                  setNoteId(newId);
                  addXp(250);
              }
          } else {
              const payload: any = { user_id: user.id, title, body_html: body, type: 'normal', updated_at: timestamp };
              if (noteId) await supabase.from('notes').update(payload).eq('id', noteId);
              else { 
                const { data } = await supabase.from('notes').insert([payload]).select().single(); 
                if (data) { setNoteId(data.id); addXp(250); }
              }
          }
          setShowToast(true); setTimeout(() => setShowToast(false), 2000);
      } catch (e) { console.error(e); } finally { setSaving(false); }
  }, [noteId, editorTitle, addXp]);

  const handlePdfExport = () => { 
      const element = document.getElementById('printable-area'); 
      const html2pdf = (window as any).html2pdf; 
      if(element && html2pdf) { 
          setLoadingStatus(language === 'tr' ? 'PDF Hazırlanıyor...' : 'Generating PDF...');
          document.body.classList.add('pdf-mode'); 
          
          const opt = { 
              margin: [10, 10, 10, 10], 
              filename: `${editorTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`, 
              image: { type: 'jpeg', quality: 0.98 },
              html2canvas: { 
                  scale: 3, 
                  useCORS: true, 
                  letterRendering: true,
                  scrollX: 0,
                  scrollY: 0,
                  backgroundColor: '#ffffff' // Zorunlu beyaz arka plan
              }, 
              jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
              pagebreak: { mode: ['avoid-all', 'css', 'legacy'] } 
          };
          
          html2pdf().set(opt).from(element).save().then(() => { 
              document.body.classList.remove('pdf-mode'); 
              setLoadingStatus(null);
          }).catch(() => {
             document.body.classList.remove('pdf-mode');
             setLoadingStatus(null);
             alert("PDF oluşturulurken hata oluştu.");
          }); 
      } 
  };

  const updateActiveStates = () => { try { setActiveStyles({ bold: document.queryCommandState('bold'), italic: document.queryCommandState('italic'), underline: document.queryCommandState('underline'), justifyLeft: document.queryCommandState('justifyLeft'), justifyCenter: document.queryCommandState('justifyCenter'), justifyRight: document.queryCommandState('justifyRight'), justifyFull: document.queryCommandState('justifyFull'), listUl: document.queryCommandState('insertUnorderedList'), listOl: document.queryCommandState('insertOrderedList'), }); } catch(e) { } };
  const execCmd = (command: string, value: string | undefined = undefined) => { document.execCommand(command, false, value); editorRef.current?.focus(); updateActiveStates(); };

  const handleChatSend = async () => {
    if(!chatInput.trim()) return;
    const currentNote = editorRef.current?.innerText || "";
    const userMsg = { role: 'user' as const, content: chatInput };
    setChatHistory(prev => [...prev, userMsg]);
    setChatInput(''); setIsChatLoading(true); 
    try { 
      const reply = await aiHelper.chat(userMsg.content, chatHistory, currentNote, language); 
      setChatHistory(prev => [...prev, { role: 'model', content: reply }]); 
    } catch (e) { 
      setChatHistory(prev => [...prev, { role: 'model', content: "Bir hata oluştu." }]); 
    } finally { setIsChatLoading(false); }
  };

  const handleMapMouseDown = (e: React.MouseEvent) => { isDraggingMap.current = true; lastMousePos.current = { x: e.clientX, y: e.clientY }; };
  const handleMapMouseMove = (e: React.MouseEvent) => { if (!isDraggingMap.current) return; const dx = e.clientX - lastMousePos.current.x; const dy = e.clientY - lastMousePos.current.y; setMapPos(prev => ({ x: prev.x + dx, y: prev.y + dy })); lastMousePos.current = { x: e.clientX, y: e.clientY }; };
  const handleMapMouseUp = () => { isDraggingMap.current = false; };

  const handleGenerateMindMap = async () => {
    if (!editorRef.current) return;
    setLoadingStatus(t('map_drawing')); setShowMindMap(true);
    try { 
        const code = await aiHelper.generateMindMap(editorRef.current.innerText, language); 
        setMindMapCode(code);
        setTimeout(() => {
            if ((window as any).mermaid) (window as any).mermaid.contentLoaded();
        }, 100);
    } 
    catch (e) { setMindMapCode("graph TD; A[Hata] --> B[Tekrar Dene]"); } 
    finally { setLoadingStatus(null); }
  };

  const handleGenerateFlashcards = async () => {
    if (!editorRef.current) return;
    setLoadingStatus("Kartlar Hazırlanıyor...");
    try {
        const cards = await aiHelper.generateFlashcards(editorRef.current.innerText, language);
        if (cards?.length > 0) { setFlashcards(cards); setCurrentCardIndex(0); setIsCardFlipped(false); setShowFlashcards(true); }
    } catch (error) { console.error(error); } finally { setLoadingStatus(null); }
  };

  return (
    <div className="flex h-screen bg-[#0F0F12] overflow-hidden relative font-sans">
        {showToast && <div className="fixed bottom-8 right-8 bg-[#18181B] border border-green-500/30 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-[100] animate-fade-in-up backdrop-blur-md"><i className="fas fa-check-circle text-green-500"></i><span className="font-bold text-sm tracking-tight">{t('saved')}</span></div>}
        <input type="file" ref={imageInputRef} onChange={(e) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onload = (re) => { if (re.target?.result) execCmd('insertImage', re.target.result as string); }; reader.readAsDataURL(file); } }} accept="image/*" className="hidden" />
        {loadingStatus && (<div className="fixed inset-0 bg-black/80 z-[300] flex flex-col items-center justify-center backdrop-blur-xl"><div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-6 shadow-[0_0_30px_rgba(168,85,247,0.3)]"></div><h3 className="text-white font-black text-2xl animate-pulse uppercase tracking-[0.2em]">{loadingStatus}</h3></div>)}
        
        {/* Flashcards Modal */}
        {showFlashcards && (
            <div className="absolute inset-0 bg-black/95 z-[250] flex flex-col items-center justify-center p-4 backdrop-blur-2xl">
                <button onClick={() => setShowFlashcards(false)} className="absolute top-10 right-10 text-gray-500 hover:text-white text-4xl transition-all hover:scale-125 hover:rotate-90"><i className="fas fa-times"></i></button>
                <div className="w-full max-w-2xl h-96 cursor-pointer group perspective-1000" onClick={() => setIsCardFlipped(!isCardFlipped)}>
                    <div className={`flip-card w-full h-full transition-all duration-700 ${isCardFlipped ? 'flipped' : ''}`}>
                        <div className="flip-card-inner">
                            <div className="flip-card-front bg-[#1C1C21] border-2 border-white/5 rounded-[40px] flex items-center justify-center p-12 text-center shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7)]">
                                <p className="text-3xl font-black text-white leading-snug tracking-tight">{flashcards[currentCardIndex].front}</p>
                            </div>
                            <div className="flip-card-back bg-gradient-to-br from-purple-800 to-indigo-900 border-2 border-purple-500/50 rounded-[40px] flex items-center justify-center p-12 text-center text-white shadow-[0_30px_60px_-15px_rgba(147,51,234,0.4)]">
                                <p className="text-3xl font-black leading-snug tracking-tight">{flashcards[currentCardIndex].back}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex gap-8 mt-16">
                    <button onClick={() => { if (currentCardIndex > 0) { setCurrentCardIndex(p => p - 1); setIsCardFlipped(false); } }} disabled={currentCardIndex === 0} className="w-16 h-16 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 disabled:opacity-20 transition-all flex items-center justify-center text-2xl"><i className="fas fa-arrow-left"></i></button>
                    <div className="flex items-center text-gray-500 font-black tracking-widest uppercase text-xs px-6 bg-white/5 rounded-full">{currentCardIndex + 1} / {flashcards.length}</div>
                    <button onClick={() => { if (currentCardIndex < flashcards.length - 1) { setCurrentCardIndex(p => p + 1); setIsCardFlipped(false); } }} disabled={currentCardIndex === flashcards.length - 1} className="w-16 h-16 rounded-full bg-white text-black hover:scale-110 disabled:opacity-20 transition-all flex items-center justify-center text-2xl shadow-[0_10px_30px_rgba(255,255,255,0.2)]"><i className="fas fa-arrow-right"></i></button>
                </div>
            </div>
        )}

        {/* MindMap Modal */}
        {showMindMap && (
            <div className="absolute inset-0 bg-[#09090B] z-[200] flex flex-col items-center justify-center overflow-hidden" onMouseMove={handleMapMouseMove} onMouseUp={handleMapMouseUp} onMouseLeave={handleMapMouseUp}>
                <div className="absolute top-10 right-10 flex gap-4 z-[210]">
                    <button onClick={() => setShowMindMap(false)} className="w-14 h-14 bg-red-500/10 text-red-500 rounded-2xl border border-red-500/20 flex items-center justify-center text-2xl transition-all hover:bg-red-500 hover:text-white"><i className="fas fa-times"></i></button>
                </div>
                <div className="absolute top-10 left-10 flex flex-col gap-3 z-[210]">
                    <button onClick={() => setMapScale(s => s + 0.1)} className="w-12 h-12 bg-[#1C1C21] text-white rounded-xl border border-white/5 shadow-xl hover:bg-[#27272A]"><i className="fas fa-plus"></i></button>
                    <button onClick={() => setMapScale(s => Math.max(0.1, s - 0.1))} className="w-12 h-12 bg-[#1C1C21] text-white rounded-xl border border-white/5 shadow-xl hover:bg-[#27272A]"><i className="fas fa-minus"></i></button>
                    <button onClick={() => { setMapScale(1); setMapPos({x:0, y:0}); }} className="w-12 h-12 bg-[#1C1C21] text-white rounded-xl border border-white/5 shadow-xl hover:bg-[#27272A]"><i className="fas fa-sync-alt"></i></button>
                </div>
                <div className="cursor-grab active:cursor-grabbing p-40 transition-transform duration-75" onMouseDown={handleMapMouseDown} style={{ transform: `translate(${mapPos.x}px, ${mapPos.y}px) scale(${mapScale})` }}>
                    <div className="mermaid bg-white p-20 rounded-[40px] shadow-2xl ring-1 ring-white/10">{mindMapCode}</div>
                </div>
            </div>
        )}

        <div className="flex-1 flex flex-col h-full overflow-hidden">
            <header className="h-16 flex items-center justify-between px-8 border-b border-white/5 bg-[#18181B] shrink-0 gap-6">
                <div className="flex items-center gap-6 flex-1 min-w-0">
                    <button onClick={() => navigate('/')} className="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center text-gray-500 hover:text-white transition-all"><i className="fas fa-arrow-left"></i></button>
                    <input value={editorTitle} onChange={(e) => setEditorTitle(e.target.value)} className="bg-transparent text-white font-black focus:outline-none w-full text-xl tracking-tighter truncate" placeholder="Başlık Yazın..."/>
                </div>
                <div className="flex items-center gap-2">
                    <NoteActionBtn icon="fas fa-layer-group" color="hover:text-yellow-400" onClick={handleGenerateFlashcards} title="Ezber Kartları" />
                    <NoteActionBtn icon="fas fa-project-diagram" color="hover:text-blue-400" onClick={handleGenerateMindMap} title="Zihin Haritası" />
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

            <div className="flex-1 overflow-y-auto bg-[#09090B] selection:bg-purple-500/30 selection:text-white scroll-smooth" onClick={() => editorRef.current?.focus()}>
                {/* 
                    GÜNCELLENEN KISIM (Tam Ekran):
                    - max-w-full (Tüm alanı kapla)
                    - paddingler p-4 olarak azaltıldı (Kenar boşluğu minimum)
                */}
                <div className="w-full min-h-full">
                    <div id="printable-area" ref={editorRef} contentEditable spellCheck={false} onBlur={saveNote} onKeyUp={updateActiveStates} onMouseUp={updateActiveStates} className="editor-content outline-none min-h-[1200px] pb-80 animate-fade-in w-full p-4 max-w-full"></div>
                </div>
            </div>
        </div>

        <div className={`fixed right-0 top-0 h-screen w-full md:w-[460px] bg-[#141417] border-l border-white/5 shadow-[-30px_0_60px_-15px_rgba(0,0,0,0.6)] transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) z-[90] flex flex-col pt-16 ${isChatOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <button onClick={() => setIsChatOpen(!isChatOpen)} className="absolute left-[-44px] top-32 w-11 h-16 bg-[#141417] border border-r-0 border-white/10 rounded-l-[20px] flex items-center justify-center text-purple-500 shadow-[-10px_0_30px_rgba(0,0,0,0.5)] transition-all hover:text-white group">
                <i className={`fas fa-chevron-${isChatOpen ? 'right' : 'left'} text-xl transition-transform group-hover:scale-110`}></i>
            </button>
            
            <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-6 scrollbar-hide">
                <div className="flex flex-col items-center mb-4 text-center">
                    <div className="w-14 h-14 bg-purple-600 rounded-2xl flex items-center justify-center text-2xl text-white mb-3 shadow-lg shadow-purple-500/20"><i className="fas fa-brain"></i></div>
                    <h3 className="text-white font-black text-lg tracking-tight">Akıllı Ders Asistanı</h3>
                    <p className="text-gray-500 text-xs font-medium uppercase tracking-[0.2em] mt-1">Notlarına Dayalı Analiz</p>
                </div>
                {chatHistory.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
                        <div className={`p-5 rounded-3xl text-[13px] font-medium max-w-[90%] shadow-2xl leading-relaxed ${msg.role === 'user' ? 'bg-purple-600 text-white font-bold ring-4 ring-purple-500/10' : 'bg-[#1C1C21] text-gray-200 border border-white/5'}`}>{msg.content}</div>
                    </div>
                ))}
                {isChatLoading && <div className="flex items-center gap-3 text-purple-400 font-black text-xs animate-pulse bg-purple-500/5 p-4 rounded-2xl border border-purple-500/20">Öğretmen düşünüyor...</div>}
                <div ref={chatBottomRef}></div>
            </div>
            <div className="p-8 border-t border-white/5 bg-[#0D0D0F]">
                <div className="bg-[#1C1C21] rounded-[24px] p-3 flex gap-3 border border-white/5 focus-within:border-purple-500/50 transition-all shadow-inner group">
                    <textarea value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleChatSend())} placeholder="Soru sor..." className="flex-1 bg-transparent text-white text-sm resize-none outline-none h-14 p-2 font-medium scrollbar-hide"></textarea>
                    <button onClick={handleChatSend} className="w-14 h-14 rounded-2xl bg-purple-600 text-white flex items-center justify-center hover:bg-purple-500 transition-all shadow-xl active:scale-90 shrink-0"><i className="fas fa-paper-plane text-lg"></i></button>
                </div>
            </div>
        </div>
    </div>
  );
};

const NoteActionBtn: React.FC<{icon: string, color: string, onClick: () => void, title: string}> = ({icon, color, onClick, title}) => (
    <button onClick={onClick} className={`w-11 h-11 flex items-center justify-center rounded-xl text-gray-500 ${color} transition-all hover:bg-white/5 text-lg`} title={title}><i className={icon}></i></button>
);

const ToolbarBtn: React.FC<{icon: string, isActive: boolean, onClick: () => void}> = ({icon, isActive, onClick}) => (
    <button onMouseDown={(e) => { e.preventDefault(); onClick(); }} className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all shadow-sm ${isActive ? 'bg-purple-600 text-white scale-110 shadow-lg shadow-purple-900/40' : 'hover:bg-white/5 text-gray-400 hover:text-white'}`}><i className={icon}></i></button>
);

export default Notes;







EXAM.TSX:

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { aiHelper } from '../lib/aiHelper';
import { ExamQuestion } from '../types';
import { useLanguage } from '../lib/LanguageContext';
import { useGamification } from '../lib/GamificationContext';

const Exam: React.FC = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { addXp } = useGamification();
  const [step, setStep] = useState<'setup' | 'quiz' | 'result'>('setup');
  
  const [topics, setTopics] = useState('');
  const [questionCount, setQuestionCount] = useState(10);
  const [loading, setLoading] = useState(false);

  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<{[key: number]: number}>({}); 
  const [showExplanation, setShowExplanation] = useState(false);
  
  // PDF Export State
  const [showPdfMenu, setShowPdfMenu] = useState(false);
  const [pdfMode, setPdfMode] = useState<'none' | 'study' | 'exam'>('none');
  const pdfContainerRef = useRef<HTMLDivElement>(null);

  // ⚖️ BALANCED SHUFFLE ALGORITHM
  // Ensures equal distribution of A, B, C, D, E options
  const balanceAndShuffleQuestions = (rawQuestions: ExamQuestion[]): ExamQuestion[] => {
      const n = rawQuestions.length;
      const optionCount = 5; // A, B, C, D, E
      const targetIndices: number[] = [];

      // 1. Fill target indices to ensure balance (e.g. 2 As, 2 Bs...)
      for (let i = 0; i < n; i++) {
          targetIndices.push(i % optionCount);
      }

      // 2. Fisher-Yates Shuffle for targets
      for (let i = targetIndices.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [targetIndices[i], targetIndices[j]] = [targetIndices[j], targetIndices[i]];
      }

      // 3. Re-map questions to match target correct index
      return rawQuestions.map((q, i) => {
          const originalCorrectText = q.options[q.correctIndex];
          const distractors = q.options.filter((_, idx) => idx !== q.correctIndex);

          // Shuffle distractors too so they aren't always in same relative order
          for (let k = distractors.length - 1; k > 0; k--) {
              const j = Math.floor(Math.random() * (k + 1));
              [distractors[k], distractors[j]] = [distractors[j], distractors[k]];
          }

          const targetIndex = targetIndices[i] % q.options.length; // Safety mod
          const newOptions = new Array(q.options.length);
          
          // Place correct answer at target
          newOptions[targetIndex] = originalCorrectText;
          
          // Fill rest
          let d = 0;
          for (let x = 0; x < newOptions.length; x++) {
              if (x !== targetIndex) {
                  newOptions[x] = distractors[d++];
              }
          }

          return {
              ...q,
              options: newOptions,
              correctIndex: targetIndex
          };
      });
  };

  const handleStartExam = async () => {
    if(!topics.trim()) return;
    setLoading(true);
    try {
        const generated = await aiHelper.generateExam(topics, questionCount, language);
        // Apply balancing algorithm
        const balancedQuestions = balanceAndShuffleQuestions(generated);
        setQuestions(balancedQuestions);
        setStep('quiz');
    } catch (e) { alert("Error generating exam."); } finally { setLoading(false); }
  };

  const handleAnswer = (optionIdx: number) => {
    if (showExplanation) return; 
    setAnswers(prev => ({...prev, [currentIdx]: optionIdx}));
    setShowExplanation(true);
  };

  const nextQuestion = () => {
    if (currentIdx < questions.length - 1) {
        setCurrentIdx(prev => prev + 1);
        setShowExplanation(false);
    } else {
        setStep('result');
        const score = calculateScore();
        const wrongs = questions.length - score;
        const totalXp = (score * 25) - (wrongs * 5);
        if (totalXp > 0) addXp(totalXp);
    }
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((q, idx) => { if (answers[idx] === q.correctIndex) correct++; });
    return correct;
  };

  const handleSaveMistakes = async () => {
    setLoading(true);
    const mistakes = questions.filter((q, idx) => answers[idx] !== q.correctIndex);
    const mistakeText = mistakes.map(q => `Q: ${q.question}\nCorrect: ${q.options[q.correctIndex]}\nExplanation: ${q.explanation}`).join('\n---\n');
    try {
        const noteHtml = await aiHelper.generateNote(`Exam Analysis: ${topics}`, 'General', `Teach me these mistakes:\n${mistakeText}`, language);
        await addXp(100);
        navigate('/notes', { state: { initialContent: noteHtml, initialTitle: `Analiz: ${topics}`, isNew: true } });
    } catch(e) { setLoading(false); alert("Error"); }
  };

  // PDF TRIGGER LOGIC
  const triggerPdfExport = (mode: 'study' | 'exam') => {
      setPdfMode(mode);
      setShowPdfMenu(false);
      // Wait for React to render the hidden container with new mode
      setTimeout(() => {
          const element = document.getElementById('exam-pdf-container');
          const html2pdf = (window as any).html2pdf;
          if (element && html2pdf) {
              document.body.classList.add('pdf-mode');
              
              const opt = {
                  margin: [15, 15, 15, 15],
                  filename: `Sinav_${topics.replace(/[^a-z0-9]/gi, '_')}_${mode}.pdf`,
                  image: { type: 'jpeg', quality: 0.98 },
                  html2canvas: { scale: 2, useCORS: true, letterRendering: true },
                  jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
                  pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
              };

              html2pdf().set(opt).from(element).save().then(() => {
                  document.body.classList.remove('pdf-mode');
                  setPdfMode('none'); // Reset to save memory/dom
              });
          }
      }, 100);
  };

  return (
    <div className="h-full overflow-y-auto bg-[var(--bg-main)] p-4 md:p-8 flex items-center justify-center">
      {loading && (<div className="absolute inset-0 bg-black/80 z-50 flex flex-col items-center justify-center"><div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div><h3 className="text-white font-bold text-xl animate-pulse">{step === 'setup' ? '...' : '...'}</h3></div>)}

      {/* 📄 HIDDEN PDF CONTAINER (Dynamic Content based on pdfMode) */}
      <div className="fixed left-[-9999px] top-0 w-[800px]">
        <div id="exam-pdf-container" ref={pdfContainerRef} className="p-10 bg-white text-black font-serif">
             <div className="text-center mb-8 border-b-2 border-black pb-4">
                 <h1 className="text-3xl font-bold uppercase tracking-wider">{t('exam_center')}</h1>
                 <h2 className="text-xl mt-2 font-semibold">{topics}</h2>
                 <div className="flex justify-between text-sm text-gray-500 mt-2 px-10">
                    <span>{new Date().toLocaleDateString()}</span>
                    <span>{questions.length} Soru</span>
                    <span>{pdfMode === 'exam' ? 'Cevap Anahtarlı' : 'Çözümlü'}</span>
                 </div>
             </div>
             
             {questions.map((q, idx) => (
                 <div key={idx} className="exam-question-block mb-6 p-4 rounded-lg break-inside-avoid page-break-inside-avoid">
                     <h3 className="exam-question-title font-bold text-lg mb-3 flex gap-2">
                        <span className="bg-black text-white w-6 h-6 flex items-center justify-center rounded text-sm">{idx + 1}</span> 
                        {q.question}
                     </h3>
                     <ul className="list-none space-y-2 mb-4 pl-4">
                         {q.options.map((opt, oIdx) => (
                             <li key={oIdx} className="exam-option text-gray-900 font-medium">
                                 <span className="font-bold mr-2 inline-block w-6">{String.fromCharCode(65 + oIdx)})</span> {opt}
                             </li>
                         ))}
                     </ul>
                     
                     {/* STUDY MODE: Show Answer Immediately */}
                     {pdfMode === 'study' && (
                         <div className="exam-explanation mt-4 pt-3 border-t border-dashed border-gray-400 text-sm text-gray-800 bg-gray-100 p-3 rounded">
                             <div className="font-bold text-black mb-1 flex items-center gap-2">
                                <i className="fas fa-check-circle"></i> Doğru Cevap: {String.fromCharCode(65 + q.correctIndex)}
                             </div>
                             <div>{q.explanation}</div>
                         </div>
                     )}
                 </div>
             ))}

             {/* EXAM MODE: Show Answer Key Table at the End */}
             {pdfMode === 'exam' && (
                <>
                    <div className="html2pdf__page-break"></div>
                    <div className="mt-10 page-break-before-always">
                        <h2 className="text-2xl font-bold text-center mb-6 border-b border-black pb-2">CEVAP ANAHTARI</h2>
                        <table className="w-full border-collapse border border-black text-center">
                            <thead>
                                <tr className="bg-gray-200">
                                    <th className="border border-black p-2">Soru</th>
                                    <th className="border border-black p-2">Cevap</th>
                                    <th className="border border-black p-2">Soru</th>
                                    <th className="border border-black p-2">Cevap</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Array.from({ length: Math.ceil(questions.length / 2) }).map((_, i) => {
                                    const q1 = questions[i];
                                    const q2 = questions[i + Math.ceil(questions.length / 2)];
                                    return (
                                        <tr key={i}>
                                            <td className="border border-black p-2 font-bold">{i + 1}</td>
                                            <td className="border border-black p-2">{String.fromCharCode(65 + q1.correctIndex)}</td>
                                            <td className="border border-black p-2 font-bold">{q2 ? i + 1 + Math.ceil(questions.length / 2) : '-'}</td>
                                            <td className="border border-black p-2">{q2 ? String.fromCharCode(65 + q2.correctIndex) : '-'}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </>
             )}
        </div>
      </div>

      {step === 'setup' && (
        <div className="w-full max-w-2xl bg-[#18181B] border border-[#27272A] rounded-3xl p-8 shadow-2xl animate-fade-in-up">
            <div className="text-center mb-8"><div className="w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl text-white shadow-lg shadow-purple-900/50"><i className="fas fa-graduation-cap"></i></div><h1 className="text-3xl font-bold text-white">{t('exam_setup')}</h1><p className="text-gray-400 mt-2">{t('exam_desc')}</p></div>
            <div className="space-y-6">
                <div><label className="text-xs font-bold text-gray-500 uppercase mb-2 block">{t('topics')}</label><input value={topics} onChange={(e) => setTopics(e.target.value)} className="w-full bg-[#0F0F12] border border-[#27272A] rounded-xl p-4 text-white outline-none focus:border-purple-500 transition-colors" placeholder={t('ph_exam_topic')} /></div>
                <div><label className="text-xs font-bold text-gray-500 uppercase mb-2 block">{t('question_count')}</label><div className="flex gap-4">{[10, 15, 20].map(num => (<button key={num} onClick={() => setQuestionCount(num)} className={`flex-1 py-3 rounded-xl border font-bold transition-all ${questionCount === num ? 'bg-purple-600 border-purple-600 text-white' : 'bg-[#27272A] border-[#3F3F46] text-gray-400 hover:border-gray-500'}`}>{num}</button>))}</div></div>
                <button onClick={handleStartExam} disabled={!topics.trim()} className="w-full bg-white text-black font-bold py-4 rounded-xl text-lg hover:bg-gray-200 transition-colors disabled:opacity-50">{t('start_exam')}</button>
            </div>
        </div>
      )}

      {step === 'quiz' && questions.length > 0 && (
          <div className="w-full max-w-3xl animate-fade-in">
              <div className="flex justify-between items-center mb-6 text-sm font-bold text-gray-500 uppercase">
                  <span>Q {currentIdx + 1} / {questions.length}</span>
                  <div className="flex items-center gap-4 relative">
                      <span>{topics}</span>
                      <button onClick={() => setShowPdfMenu(!showPdfMenu)} className="bg-[#27272A] hover:bg-red-600 text-white p-2 rounded-lg transition-colors flex items-center gap-2" title="PDF İndir">
                          <i className="fas fa-file-pdf"></i> PDF
                      </button>
                      
                      {/* PDF MENU DROPDOWN */}
                      {showPdfMenu && (
                          <div className="absolute top-10 right-0 bg-[#18181B] border border-[#3F3F46] rounded-xl shadow-2xl p-2 w-48 z-50 animate-fade-in">
                              <button onClick={() => triggerPdfExport('study')} className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-[#27272A] hover:text-white rounded-lg mb-1">
                                <i className="fas fa-book-open mr-2 text-green-400"></i> Çözümlü (Çalış)
                              </button>
                              <button onClick={() => triggerPdfExport('exam')} className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-[#27272A] hover:text-white rounded-lg">
                                <i className="fas fa-tasks mr-2 text-blue-400"></i> Cevap Anahtarlı
                              </button>
                          </div>
                      )}
                  </div>
              </div>
              <div className="bg-[#18181B] border border-[#27272A] rounded-3xl p-8 mb-6 shadow-xl relative overflow-hidden"><h2 className="text-2xl font-bold text-white mb-8 leading-relaxed">{questions[currentIdx].question}</h2>
                  <div className="space-y-3">{questions[currentIdx].options.map((opt, idx) => {
                          const isSelected = answers[currentIdx] === idx;
                          const isCorrect = questions[currentIdx].correctIndex === idx;
                          let btnClass = "bg-[#27272A] border-[#3F3F46] text-gray-300 hover:bg-[#3F3F46]";
                          if (showExplanation) { if (isCorrect) btnClass = "bg-green-600/20 border-green-500 text-green-400"; else if (isSelected) btnClass = "bg-red-600/20 border-red-500 text-red-400"; } else if (isSelected) { btnClass = "bg-purple-600 border-purple-500 text-white"; }
                          return (<button key={idx} onClick={() => handleAnswer(idx)} disabled={showExplanation} className={`w-full text-left p-4 rounded-xl border transition-all flex items-center gap-4 ${btnClass}`}><span className="w-8 h-8 rounded-full bg-black/20 flex items-center justify-center font-bold text-sm">{String.fromCharCode(65 + idx)}</span>{opt}</button>)
                      })}</div>
              </div>
              {showExplanation && (<div className="bg-[#0F0F12] border border-blue-500/20 rounded-2xl p-6 mb-6 animate-fade-in"><h4 className="text-blue-400 font-bold mb-2"><i className="fas fa-info-circle mr-2"></i>{t('explanation')}</h4><p className="text-gray-300">{questions[currentIdx].explanation}</p></div>)}
              <div className="flex justify-end"><button onClick={nextQuestion} disabled={!showExplanation} className="bg-white text-black font-bold py-3 px-8 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50">{currentIdx === questions.length - 1 ? t('finish_exam') : t('next_question')} <i className="fas fa-arrow-right ml-2"></i></button></div>
          </div>
      )}

      {step === 'result' && (
          <div className="w-full max-w-md bg-[#18181B] border border-[#27272A] rounded-3xl p-8 text-center shadow-2xl animate-fade-in-up">
              <div className="mb-6"><div className="text-6xl font-bold text-white mb-2">{calculateScore()} <span className="text-2xl text-gray-500">/ {questions.length}</span></div><p className="text-gray-400">{t('correct_count')}</p></div>
              <div className="h-2 bg-[#27272A] rounded-full mb-8 overflow-hidden"><div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500" style={{ width: `${(calculateScore() / questions.length) * 100}%` }}></div></div>
              <div className="space-y-3"><button onClick={handleSaveMistakes} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl transition-colors"><i className="fas fa-save mr-2"></i> {t('save_mistakes')}</button><button onClick={() => navigate('/')} className="w-full bg-[#27272A] hover:bg-[#3F3F46] text-white font-bold py-3 rounded-xl transition-colors">{t('return_menu')}</button></div>
          </div>
      )}
    </div>
  );
};

export default Exam;
