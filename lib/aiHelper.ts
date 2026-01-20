
import { GoogleGenAI } from "@google/genai";

// Çevresel değişkenden (Vite) Gemini API anahtarını oku
const apiKey = (() => {
  try { return (import.meta as any).env?.VITE_GOOGLE_API_KEY || ""; } catch (e) { return ""; }
})();

const getAiClient = () => {
  // API Key kontrolü (Boşsa uyarı verelim)
  if (!apiKey) console.warn("API Key tanımlı değil. Lütfen .env içinde VITE_GOOGLE_API_KEY ayarlayın.");
  return new GoogleGenAI({ apiKey: apiKey || "" });
};

const DEFAULT_MODEL = 'gemini-2.5-flash-preview-09-2025';
const PDF_MODEL = DEFAULT_MODEL; // 404 hatalarını önlemek için çalışan modele çekildi

export const aiHelper = {
  // 1. NOT ÜRETME
  generateNote: async (title: string, year: string, extra: string, lang: 'tr' | 'en') => {
    try {
      const ai = getAiClient();

      const prompt = `
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

        5. UYARI KUTUSU (En Altta veya Gerekli Yerde):
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
      `;

      const response = await ai.models.generateContent({
        model: DEFAULT_MODEL,
        contents: [{ role: "user", parts: [{ text: prompt }] }]
      });
      let html = response.text || "";
      // Temizlik
      return html.replace(/```html/g, '').replace(/```/g, '').replace(/<html>/g, '').replace(/<body>/g, '').replace(/<\/body>/g, '').replace(/<\/html>/g, '').trim();
    } catch (error) {
      console.error("AI Error", error);
      throw new Error("İçerik üretilemedi.");
    }
  },

  // 2. SINAV (TAM TÜRKÇE)
  async generateExam(topic: string, difficulty: string, questionCount: number = 10, language: string = 'tr'): Promise<any[]> {
    try {
      const ai = getAiClient();

      const prompt = `
        Sen bir öğretmensin. Aşağıdaki konu ve zorluk seviyesine göre bir sınav hazırla.
        
        Konu: "${topic}"
        Zorluk: ${difficulty}
        
        ÖNEMLİ: Kullanıcı konu kısmına "Konu Adı Soru Sayısı" formatında giriş yapmış olabilir.
        Örneğin: "Fonksiyonlar 3, Türev 2, İntegral 5" gibi.
        Eğer böyle bir format varsa, HER KONUDAN BELİRTİLEN SAYIDA soru sor.
        Eğer sadece konu adı varsa (örn: "Tarih"), toplam ${questionCount} adet soru sor.
        
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
        4. Zorluk seviyesi "${difficulty}" olsun. Eğer "Zor" ise, çeldiriciler güçlü olsun ama yine de 4 seçenek dolu olsun.
        5. Sadece JSON döndür. Markdown kullanma.

        6. SEMBOLLER VE MATEMATİKSEL İFADELER:
           - Matematiksel formülleri veya sembolleri yazarken asla '$', '\(', '\[' gibi Latex işaretleri kullanma.
           - Karmaşık semboller yerine düz metin kullan ve formülleri Türkçe kelimelerle açıkla.
        `;

      const response = await ai.models.generateContent({
        model: DEFAULT_MODEL,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: { responseMimeType: 'application/json' }
      });

      let text = response.text || "[]";
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      text = text.replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F-\u009F]/g, ' ');

      const parsed = JSON.parse(text);

      const sanitized = parsed.map((q: any) => {
        let safeOptions = q.options.map((opt: string, idx: number) => {
          if (!opt || typeof opt !== 'string' || opt.trim() === "") {
            return `Seçenek ${String.fromCharCode(65 + idx)}`;
          }
          return opt;
        });

        let cIndex = safeOptions.findIndex((o: string) => o === q.correctAnswer);
        if (cIndex === -1 && q.correctAnswer) {
          cIndex = safeOptions.findIndex((o: string) => o.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim());
        }

        if (cIndex === -1) {
          cIndex = 0;
          if (q.correctAnswer && q.correctAnswer.trim() !== "") {
            safeOptions[0] = q.correctAnswer;
          }
        }

        return {
          ...q,
          options: safeOptions,
          correctIndex: cIndex,
          correctAnswer: safeOptions[cIndex]
        };
      });

      return sanitized;
    } catch (error) {
      console.error("Exam Error", error);
      throw new Error("Sınav oluşturulamadı");
    }
  },

  // 3. PDF ANALİZ
  analyzePdf: async (base64: string, language: string = 'tr'): Promise<string> => {
    try {
      const ai = getAiClient();
      const prompt = `
        Sen uzman bir eğitim asistanısın.
        GÖREV: Bu PDF içeriğini analiz et ve öğrenciler için mükemmel bir ders notuna dönüştür.
        
        KRİTİK VE KESİN KURALLAR:
        1. ASLA SORU SORMA: Soru, test, quiz, "kendimizi deneyelim" GİBİ BÖLÜMLER KESİNLİKLE YASAK. Sadece konu anlatımı.
        2. DİL: %100 TÜRKÇE.
        3. TASARIM (DARK MODE & ÇERÇEVE):
           - Çıktı bir "Container" div içinde olmalı: <div class="note-frame" style="background-color: #09090B; color: #E4E4E7; font-family: 'Segoe UI', sans-serif; padding: 30px; border: 1px solid #27272A; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5);">
           - Başlık en üstte büyük ve ortalanmış: <h1 style="text-align:center; color: #F4F4F5; margin-bottom: 30px; font-size: 28px; font-weight: 800; border-bottom: 2px solid #3F3F46; padding-bottom: 15px;">PDF DERS NOTU</h1>
           - Önemli kavramları şu şekilde vurgula: <span style="color: #A78BFA; font-weight: bold;">Kavram</span> veya <span style="color: #FB923C; font-weight: bold;">Diğer Kavram</span>. ASLA "(Mor Vurgu)" veya "(Turuncu Vurgu)" diye yazı yazma, sadece stili uygula.
        
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

        5. UYARI KUTUSU:
           <div style="margin-top: 30px; background-color: #450A0A; border: 1px solid #7F1D1D; border-left: 5px solid #EF4444; border-radius: 8px; padding: 20px;">
             <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                <span style="font-size: 20px;">⚠️</span>
                <strong style="color: #FCA5A5; font-size: 16px; text-transform: uppercase;">KRİTİK UYARI</strong>
             </div>
             <p style="color: #FECACA; margin: 0; font-size: 14px; line-height: 1.6;">Önemli uyarı metni buraya...</p>
           </div>
           
        6. SEMBOLLER VE MATEMATİKSEL İFADELER:
           - Matematiksel formülleri veya sembolleri yazarken asla '$', '\(', '\[' gibi Latex işaretleri kullanma.
           - Karmaşık semboller yerine düz metin kullan ve formülleri Türkçe kelimelerle açıkla.
          
        7. ANALİZ VE EKSTRAKSİYON PRENSİPLERİ:
           - PDF dosyasını statik bir metin olarak değil, bir bilgi havuzu olarak gör.
           - İçerikteki "neden", "nasıl" ve "sonuç" ilişkilerini bulup çıkar.
           - Yüzeysel bir özet yerine, PDF'deki tüm teknik detayları, püf noktalarını ve sınavda çıkabilecek kritik bilgileri cımbızla çekip hiyerarşik bir yapıya oturt.
           - Eğer PDF'de tablolar varsa, bu tabloları analiz et ve kendi tasarım sistemine uygun (koyu tema) şekilde yeniden oluştur.
           - Öğrenci bu özeti okuduğunda, orijinal PDF'i okumuş kadar derin bir bilgiye sahip olmalı.
      `;

      const result = await ai.models.generateContent({
        model: PDF_MODEL,
        contents: [
          {
            role: "user", parts: [
              { text: prompt },
              { inlineData: { data: base64, mimeType: "application/pdf" } }
            ]
          }
        ]
      });
      let text = result.text || "";
      text = text.replace(/```html/g, '').replace(/```/g, '');
      return text;
    } catch (error) {
      console.error("PDF Error", error);
      throw new Error("PDF Analizi başarısız oldu.");
    }
  },

  summarizeText: async (text: string, lang: 'tr' | 'en' = 'tr') => {
    return aiHelper.generateNote("Video Özeti", "Genel", `Bu içeriği bir ders notu titizliğiyle özetle: ${text}`, lang);
  }
};
