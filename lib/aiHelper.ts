
import { GoogleGenAI } from "@google/genai";

// API Keys
const GEMINI_KEY = (() => {
  try { return (import.meta as any).env?.VITE_GOOGLE_API_KEY || ""; } catch (e) { return ""; }
})();

const GROQ_KEY = (() => {
  try { return (import.meta as any).env?.VITE_GROQ_API_KEY || ""; } catch (e) { return ""; }
})();

// Modeller (Kralın İstediği Modeller)
const GEMINI_MODEL = 'gemini-2.5-flash-preview-09-2025';
const QWEN_MODEL = 'qwen/qwen3-32b';

// --- PROMPT TEMPLATES (Pırlanta Gibi Türkçeleştirilmiş Promptlar) ---
const PROMPTS = {
  NOTE: (title: string, year: string, extra: string) => `
        Sen profesyonel bir eğitim asistanısın.
        GÖREV: Aşağıdaki konu için SADECE KONU ANLATIMI içeren bir ders notu hazırla.
        
        Konu: "${title}"
        Sınıf Seviyesi: ${year}
        Ek Detaylar: "${extra}"
        
        KRİTİK VE KESİN KURALLAR:
        1. ASLA SORU SORMA: Soru, test, quiz, "kendimizi deneyelim", "örnek soru" GİBİ BÖLÜMLER KESİNLİKLE YASAK. Sadece konu anlatımı ver.
        2. DİL: %100 TÜRKÇE. Başlıklar, açıklamalar, uyarılar DAHİL her şey Türkçe olacak. İngilizce terim varsa parantez içinde Türkçesi yazılacak.
        3. TASARIM (DARK MODE & ÇERÇEVE):
           - Çıktı bir "Container" div içinde olmalı: <div class="note-frame" style="background-color: #09090B; color: #E4E4E7; font-family: 'Segoe UI', sans-serif; padding: 30px; border: 1px solid #27272A; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5);">
           - Başlık en üstte büyük ve ortalanmış: <h1 style="text-align:center; color: #F4F4F5; margin-bottom: 30px; font-size: 28px; font-weight: 800; border-bottom: 2px solid #3F3F46; padding-bottom: 15px;">${title}</h1>
           - Önemli kavramları şu şekilde vurgula: <span style="color: #A78BFA; font-weight: bold;">Kavram</span> veya <span style="color: #FB923C; font-weight: bold;">Diğer Kavram</span>. ASLA "(Mor Vurgu)" veya "(Turuncu Vurgu)" diye yazı yazma, sadece stili uygula.
        
        4. TABLO TASARIMI (DARK THEME):
           Tablo yaparken tam olarak bu stili kullan:
           <table style="width: 100%; border-collapse: collapse; margin: 25px 0; border: 1px solid #3F3F46; background-color: #18181B; overflow: hidden; border-radius: 8px;">
             <thead>
               <tr style="background-color: #27272A; text-align: left;">
                 <th style="padding: 15px; color: #F4F4F5; border-bottom: 2px solid #3F3F46; font-weight: 700;">Başlık</th>
               </tr>
             </thead>
             <tbody>
               <tr style="border-bottom: 1px solid #3F3F46;">
                 <td style="padding: 15px; color: #D4D4D8;">İçerik</td>
               </tr>
             </tbody>
           </table>

        5. UYARI KUTUSU:
           <div style="margin-top: 30px; background-color: #450A0A; border: 1px solid #7F1D1D; border-left: 5px solid #EF4444; border-radius: 8px; padding: 20px;">
             <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                <span style="font-size: 20px;">⚠️</span>
                <strong style="color: #FCA5A5; font-size: 16px; text-transform: uppercase;">KRİTİK UYARI</strong>
             </div>
             <p style="color: #FECACA; margin: 0; font-size: 14px; line-height: 1.6;">Önemli uyarı metni buraya...</p>
           </div>
        
        6. ÇIKTI FORMATI:
           - Sadece HTML kodunu döndür.
           - <html>, <head>, <body> etiketlerini EKLEME. Direkt <div> ile başla.
           - Markdown blokları (kullanma).

        7. SEMBOLLER VE MATEMATİKSEL İFADELER:
           - Matematiksel formülleri veya sembolleri yazarken asla '$', '\(', '\[' gibi Latex işaretleri kullanma.
           - Karmaşık semboller yerine düz metin kullan ve formülleri Türkçe kelimelerle açıkla (Örn: "x'in karesi", "limit x giderken 5'e", "integral" vb.).
  `,
  EXAM: (topic: string, difficulty: string, count: number) => `
        Sen bir öğretmensin. Aşağıdaki konu ve zorluk seviyesine göre bir sınav hazırla.
        
        Konu: "${topic}"
        Zorluk: ${difficulty}
        Soru Sayısı: ${count}
        
        Çıktı JSON formatında olmalı ve şu yapıda olmalı:
        [
          {
            "question": "Soru metni",
            "options": ["Seçenek 1 İçeriği", "Seçenek 2 İçeriği", "Seçenek 3 İçeriği", "Seçenek 4 İçeriği"],
            "correctAnswer": "Seçenek 1 İçeriği" (Tam metin, options içindekiyle aynı),
            "explanation": "Çözüm açıklaması"
          }
        ]
        
        KRİTİK KURALLAR:
        1. "options" dizisinde KESİNLİKLE "A)", "B)" gibi harfler/önekler KULLANMA. Sadece cevap metnini yaz. (Örnek: "Ankara").
        2. Her soru için KESİNLİKLE 4 adet DOLU seçenek üret (A, B, C, D). Hiçbir seçenek boş ("") olmamalı.
        3. Doğru cevap, seçeneklerden biriyle BİREBİR AYNI olmalı.
        4. Sadece JSON döndür. Markdown kullanma.
  `,
  PDF: `
        Sen uzman bir eğitim asistanısın.
        GÖREV: Bu PDF içeriğini analiz et ve öğrenciler için mükemmel bir ders notuna dönüştür.
        
        KRİTİK VE KESİN KURALLAR:
        1. ASLA SORU SORMA: Soru, test, quiz, "kendimizi deneyelim" GİBİ BÖLÜMLER KESİNLİKLE YASAK. Sadece konu anlatımı.
        2. DİL: %100 TÜRKÇE.
        3. TASARIM (DARK MODE & ÇERÇEVE):
           - Çıktı bir "Container" div içinde olmalı: <div class="note-frame" style="background-color: #09090B; color: #E4E4E7; font-family: 'Segoe UI', sans-serif; padding: 30px; border: 1px solid #27272A; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5);">
           - Başlık en üstte büyük ve ortalanmış: <h1 style="text-align:center; color: #F4F4F5; margin-bottom: 30px; font-size: 28px; font-weight: 800; border-bottom: 2px solid #3F3F46; padding-bottom: 15px;">PDF DERS NOTU</h1>
           - Önemli kavramları şu şekilde vurgula: <span style="color: #A78BFA; font-weight: bold;">Kavram</span> veya <span style="color: #FB923C; font-weight: bold;">Diğer Kavram</span>.
        
        4. TABLO TASARIMI (DARK THEME):
           <table style="width: 100%; border-collapse: collapse; margin: 25px 0; border: 1px solid #3F3F46; background-color: #18181B; overflow: hidden; border-radius: 8px;">
             <thead>
               <tr style="background-color: #27272A; text-align: left;">
                 <th style="padding: 15px; color: #F4F4F5; border-bottom: 2px solid #3F3F46; font-weight: 700;">Başlık</th>
               </tr>
             </thead>
             <tbody>
               <tr style="border-bottom: 1px solid #3F3F46;">
                 <td style="padding: 15px; color: #D4D4D8;">İçerik</td>
               </tr>
             </tbody>
           </table>
           
        5. ANALİZ VE EKSTRAKSİYON PRENSİPLERİ:
           - PDF dosyasını statik bir metin olarak değil, bir bilgi havuzu olarak gör.
           - Yüzeysel bir özet yerine, PDF'deki tüm teknik detayları, püf noktalarını ve sınavda çıkabilecek kritik bilgileri cımbızla çekip hiyerarşik bir yapıya oturt.
      `
};

// --- CLIENT ---
const ai = new GoogleGenAI({ apiKey: GEMINI_KEY });

const callGroq = async (prompt: string, isJson: boolean = false) => {
  if (!GROQ_KEY) throw new Error("GROQ_API_KEY_MISSING");

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${GROQ_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: QWEN_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.6,
      response_format: isJson ? { type: "json_object" } : undefined
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || "Groq Error");
  }

  const data = await response.json();
  let content = data.choices[0].message.content;

  // AI'nın (Özellikle Qwen) iç sesini ve gevezeliklerini temizle (Thinking & Chatter)
  content = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  if (content.toLowerCase().startsWith("okay") || content.toLowerCase().includes("i need to")) {
    const splitIndex = content.indexOf("<div");
    if (splitIndex !== -1) content = content.substring(splitIndex);
  }

  return content;
};

export const aiHelper = {
  // 1. NOT OLUŞTURMA (Gemini -> Qwen)
  generateNote: async (title: string, year: string, extra: string, _lang: 'tr' | 'en' = 'tr'): Promise<string> => {
    const prompt = PROMPTS.NOTE(title, year, extra);

    try {
      console.log("[AI] Not için Gemini deneniyor...");
      const response = await (ai as any).models.generateContent({
        model: GEMINI_MODEL,
        contents: [{ role: "user", parts: [{ text: prompt }] }]
      });
      let text = response.text || "";
      return text.replace(/```html/g, '').replace(/```/g, '').replace(/<html>/g, '').replace(/<body>/g, '').replace(/<\/body>/g, '').replace(/<\/html>/g, '').trim();
    } catch (error: any) {
      console.warn("[AI] Gemini hatası, Qwen'e (Groq) geçiliyor:", error.message);
      try {
        const text = await callGroq(prompt);
        return text.replace(/```html/g, '').replace(/```/g, '').replace(/<html>/g, '').replace(/<body>/g, '').replace(/<\/body>/g, '').replace(/<\/html>/g, '').trim();
      } catch (groqError: any) {
        console.error("[AI] İki model de başarısız oldu:", groqError.message);
        throw new Error("İçerik üretilemedi. Lütfen daha sonra tekrar deneyin.");
      }
    }
  },

  // 2. SINAV (Gemini -> Qwen)
  generateExam: async (topic: string, difficulty: string, questionCount: number = 10, _language: string = 'tr'): Promise<any[]> => {
    const prompt = PROMPTS.EXAM(topic, difficulty, questionCount);

    const parseRes = (text: string) => {
      const clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
      let parsed;
      try {
        parsed = JSON.parse(clean);
      } catch (e) {
        console.error("JSON Parse Error:", e);
        return [];
      }
      const questions = Array.isArray(parsed) ? parsed : (parsed.questions || parsed.questions_list || []);

      return questions.map((q: any) => {
        let rawOptions = Array.isArray(q.options)
          ? q.options.map((o: any) => String(o || "").replace(/^[A-E][).]\s*/, "").trim())
          : [];

        let cleanOptions = Array.from(new Set(rawOptions.filter((o: string) => o.length > 0)));

        const placeholders = ["Hatalı Bilgi", "Eksik Yaklaşım", "Alternatif Seçenek", "Diğer Durum"];
        while (cleanOptions.length < 4) {
          const p = placeholders[cleanOptions.length] || `Seçenek ${cleanOptions.length + 1}`;
          if (!cleanOptions.includes(p)) cleanOptions.push(p);
          else cleanOptions.push(p + " (Farklı)");
        }

        const finalOptions = cleanOptions.slice(0, 4);

        let correctStr = String(q.correctAnswer || "").replace(/^[A-E][).]\s*/, "").trim();
        let correctIdx = finalOptions.indexOf(correctStr);
        if (correctIdx === -1) correctIdx = 0;

        return {
          question: q.question || "Soru üretilemedi",
          options: finalOptions,
          correctIndex: correctIdx,
          explanation: q.explanation || "Açıklama mevcut değil"
        };
      }).filter((q: any) => q.question && q.question.length > 5);
    };

    try {
      console.log("[AI] Sınav için Qwen (Birincil) deneniyor...");
      const text = await callGroq(prompt, true);
      return parseRes(text);
    } catch (error: any) {
      console.warn("[AI] Sınav için Qwen hatası, Gemini'ye geçiliyor:", error.message);
      try {
        const response = await (ai as any).models.generateContent({
          model: GEMINI_MODEL,
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          config: { responseMimeType: 'application/json' }
        });
        return parseRes(response.text || "");
      } catch (geminiError: any) {
        throw new Error("Sınav oluşturulamadı.");
      }
    }
  },

  // 3. PDF ANALİZ (Multimodal - Sadece Gemini)
  // NOT: Qwen multimodal değildir. PDF analizi için Gemini zorunludur.
  // Qwen'e fallback yapılırsa içerik görmediği için hayal ürünü (Hallucination) bilgiler üretir.
  analyzePdf: async (base64: string, _language: string = 'tr'): Promise<string> => {
    try {
      console.log("[AI] PDF Analizi için Gemini deneniyor...");
      const response = await (ai as any).models.generateContent({
        model: GEMINI_MODEL,
        contents: [
          {
            role: "user", parts: [
              { text: PROMPTS.PDF },
              { inlineData: { data: base64, mimeType: "application/pdf" } }
            ]
          }
        ]
      });
      let text = response.text || "";
      return text.replace(/```html/g, '').replace(/```/g, '').trim();
    } catch (error: any) {
      console.error("[AI] PDF Analizi Başarısız:", error.message);
      throw new Error("PDF şu an analiz edilemiyor. Gemini servisi meşgul olabilir.");
    }
  },

  summarizeText: async (text: string, lang: 'tr' | 'en' = 'tr') => {
    return aiHelper.generateNote("Video Özeti", "Genel", `Bu içeriği bir ders notu titizliğiyle özetle: ${text}`, lang);
  },

  runDiagnostics: async () => {
    const results = { gemini: "Pending", groq: "Pending" };
    try {
      await (ai as any).models.generateContent({
        model: GEMINI_MODEL,
        contents: [{ role: "user", parts: [{ text: "ping" }] }]
      });
      results.gemini = "✅ OK";
    } catch (e: any) { results.gemini = "❌ Error: " + e.message; }
    try {
      await callGroq("ping");
      results.groq = "✅ OK";
    } catch (e: any) { results.groq = "❌ Error: " + (e.message.includes("API_KEY") ? "API Key Eksik" : e.message); }
    return results;
  }
};
