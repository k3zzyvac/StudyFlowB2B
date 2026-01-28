
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { aiHelper } from '../lib/aiHelper';
import { ExamQuestion } from '../types';
import { useLanguage } from '../lib/LanguageContext';

const Exam: React.FC = () => {
    const navigate = useNavigate();
    const { t, language } = useLanguage();
    const [step, setStep] = useState<'setup' | 'quiz' | 'result'>('setup');

    const [topics, setTopics] = useState('');
    const [questionCount, setQuestionCount] = useState(10);
    const [difficulty, setDifficulty] = useState('Orta');
    const [loading, setLoading] = useState(false);

    const [questions, setQuestions] = useState<ExamQuestion[]>([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [answers, setAnswers] = useState<{ [key: number]: number }>({});
    const [showExplanation, setShowExplanation] = useState(false);

    // PDF Export State
    const [showPdfMenu, setShowPdfMenu] = useState(false);
    const [pdfMode, setPdfMode] = useState<'none' | 'study' | 'exam'>('none');
    const pdfContainerRef = useRef<HTMLDivElement>(null);

    // ⚖️ BALANCED SHUFFLE ALGORITHM
    const balanceAndShuffleQuestions = (rawQuestions: ExamQuestion[]): ExamQuestion[] => {
        const n = rawQuestions.length;
        const optionCount = 4; // A, B, C, D
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
        if (!topics.trim()) return;
        setLoading(true);
        try {
            const generated = await aiHelper.generateExam(topics, difficulty, questionCount, language);
            // Apply balancing algorithm
            const balancedQuestions = balanceAndShuffleQuestions(generated);
            setQuestions(balancedQuestions);
            setStep('quiz');
        } catch (e) { alert("Error generating exam."); } finally { setLoading(false); }
    };

    const handleAnswer = (optionIdx: number) => {
        if (showExplanation) return;
        setAnswers(prev => ({ ...prev, [currentIdx]: optionIdx }));
        setShowExplanation(true);
    };

    const nextQuestion = () => {
        if (currentIdx < questions.length - 1) {
            setCurrentIdx(prev => prev + 1);
            setShowExplanation(false);
        } else {
            setStep('result');
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
            navigate('/notes', { state: { initialContent: noteHtml, initialTitle: `Analiz: ${topics}`, isNew: true } });
        } catch (e) { setLoading(false); alert("Error"); }
    };

    // PDF TRIGGER LOGIC
    const triggerPdfExport = (mode: 'study' | 'exam') => {
        setPdfMode(mode);
        setShowPdfMenu(false);
        setLoading(true);

        // Wait to ensure React has updated states and the container is ready
        setTimeout(() => {
            const element = document.getElementById('exam-pdf-container');
            const html2pdf = (window as any).html2pdf;

            if (element && html2pdf) {
                // PDF modunda body'e class ekle
                document.body.classList.add('pdf-mode');

                // CRITICAL: Scroll to top to ensure absolute origin capture matches viewport
                window.scrollTo(0, 0);

                const opt = {
                    margin: [0, 0, 0, 0], // Margins handled by CSS padding
                    filename: `Sinav_${topics.replace(/[^a-z0-9]/gi, '_')}_${mode}.pdf`,
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: {
                        scale: 2,
                        useCORS: true,
                        letterRendering: true,
                        backgroundColor: '#ffffff',
                        logging: true, // Logları açtık
                        scrollX: 0,
                        scrollY: 0
                    },
                    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
                    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
                };

                html2pdf().set(opt).from(element).save().then(() => {
                    document.body.classList.remove('pdf-mode');
                    setPdfMode('none');
                    setLoading(false);
                }).catch((err: any) => {
                    document.body.classList.remove('pdf-mode');
                    setLoading(false);
                    console.error("PDF Export Error:", err);
                    alert("PDF indirilemedi.");
                });
            } else {
                setLoading(false);
                alert("PDF Container bulunamadı.");
            }
        }, 3000);
    };

    return (
        <div className="h-full overflow-y-auto bg-[var(--bg-main)] p-4 md:p-8 flex items-center justify-center">
            {loading && (
                <div className="fixed inset-0 bg-black/80 z-[60] flex flex-col items-center justify-center loading-overlay">
                    <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <h3 className="text-white font-bold text-xl animate-pulse">PDF Hazırlanıyor...</h3>
                </div>
            )}

            {/* 📄 HIDDEN PDF CONTAINER (Dynamic Content based on pdfMode) */}
            <div className="fixed left-[-9999px] top-0 w-[800px]">
                <div id="exam-pdf-container" ref={pdfContainerRef} className="p-10 bg-white text-black font-serif">
                    <div className="max-w-4xl mx-auto">
                        <div>
                            <div className="mb-8 border-b-2 border-black pb-4">
                                <h1 className="text-3xl font-bold uppercase tracking-wider text-center">{t('exam_center')}</h1>
                                <h2 className="text-xl mt-2 font-semibold text-center">{topics}</h2>

                                <div className="mt-6 flex justify-between items-end border border-black p-4 rounded-lg">
                                    <div className="space-y-4 w-2/3">
                                        <div className="flex gap-2">
                                            <span className="font-bold">Adı Soyadı:</span>
                                            <div className="border-b border-black border-dotted flex-1"></div>
                                        </div>
                                        <div className="flex gap-2">
                                            <span className="font-bold">Sınıfı / No:</span>
                                            <div className="border-b border-black border-dotted flex-1"></div>
                                        </div>
                                    </div>
                                    <div className="w-1/3 flex flex-col items-center justify-center border-l border-black pl-4">
                                        <span className="font-bold text-lg">PUAN</span>
                                        <div className="w-20 h-12 border-2 border-black mt-1 rounded"></div>
                                    </div>
                                </div>

                                <div className="flex justify-between text-sm text-gray-500 mt-2 px-2">
                                    <span>Tarih: {new Date().toLocaleDateString()}</span>
                                    <span>Soru Sayısı: {questions.length}</span>
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
                </div>
            </div>

            {/* AKTİVE APP STEPS */}
            {step === 'setup' && (
                <div className="w-full max-w-2xl bg-[#18181B] border border-[#27272A] rounded-3xl p-8 shadow-2xl animate-fade-in-up">
                    <div className="text-center mb-8"><div className="w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl text-white shadow-lg shadow-purple-900/50"><i className="fas fa-graduation-cap"></i></div><h1 className="text-3xl font-bold text-white">{t('exam_setup')}</h1><p className="text-gray-400 mt-2">{t('exam_desc')}</p></div>
                    <div className="space-y-6">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">{t('topics')}</label>
                            <input value={topics} onChange={(e) => setTopics(e.target.value)} className="w-full bg-[#0F0F12] border border-[#27272A] rounded-xl p-4 text-white outline-none focus:border-purple-500 transition-colors" placeholder={t('ph_exam_topic')} />
                            <p className="text-[10px] text-gray-500 mt-1 ml-1">İpucu: "Konu SoruSayısı" formatını kullanabilirsiniz. Örn: "Fonksiyonlar 3, Türev 2"</p>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Zorluk Seviyesi</label>
                            <div className="flex gap-4">
                                {['Kolay', 'Orta', 'Zor'].map(level => (
                                    <button
                                        key={level}
                                        onClick={() => setDifficulty(level)}
                                        className={`flex-1 py-3 rounded-xl border font-bold transition-all ${difficulty === level ? 'bg-purple-600 border-purple-600 text-white' : 'bg-[#27272A] border-[#3F3F46] text-gray-400 hover:border-gray-500'}`}
                                    >
                                        {level}
                                    </button>
                                ))}
                            </div>
                        </div>

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
