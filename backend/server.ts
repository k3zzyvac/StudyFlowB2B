
import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from "@google/genai";
import path from 'path';
import { fileURLToPath } from 'url';
import { YoutubeTranscript } from 'youtube-transcript';
import dotenv from 'dotenv';

// 1. Load env vars from root directory (Local Dev Fix)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
// Fallback for production or if .env is in same dir
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// CORS configuration
app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }) as any);

// ⚠️ API Key .env’den okunur
const apiKey = process.env.API_KEY || process.env.VITE_GOOGLE_API_KEY || "";

if (!apiKey) {
    console.warn("⚠️ UYARI: API_KEY bulunamadı!");
}

const ai = new GoogleGenAI({ apiKey: apiKey || "dummy" });
const MODEL_NAME = 'gemini-2.5-flash-preview-09-2025';

// --- ROUTES ---

app.get('/api/models/status', (req, res) => {
  res.json({ status: 'ok', provider: 'Google Gemini', mode: apiKey ? 'active' : 'demo' });
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: message,
      config: { systemInstruction: "Sen yardımsever bir öğretmensin." },
    });
    res.json({ reply: response.text });
  } catch (error: any) {
    console.error('Chat error:', error);
    res.status(500).json({ reply: "⚠️ API Hatası: " + (error.message || "Bağlantı kısıtlı.") });
  }
});

app.post('/api/transcript', async (req, res) => {
    try {
        const { youtubeUrl, manualText } = req.body;
        let transcriptText = manualText || "";
        
        if (!manualText && youtubeUrl) {
          try {
            const transcriptItems = await YoutubeTranscript.fetchTranscript(youtubeUrl);
            transcriptText = transcriptItems.map((t: any) => t.text).join(' ');
          } catch (ytError) { 
             res.status(422).json({ error: "TRANSCRIPT_FAILED", message: "Alt yazı çekilemedi." }); 
             return;
          }
        }

        if (!transcriptText) {
            res.status(400).json({ error: "No text provided" });
            return;
        }

        const prompt = `
          Aşağıdaki video transkriptini/metnini analiz et.
          
          GÖREV:
          1. Konuyu anlatan harika bir ders notu çıkar.
          2. HTML formatında olsun (sadece body içeriği).
          3. CSS Class'larını kullan: .summary-box (özet için), .tip (ipuçları), .warning (uyarılar), .quiz-box (3 soru).
          4. Dil: Türkçe.
          5. Uzun ve detaylı olsun.

          Metin:
          ${transcriptText.substring(0, 25000)}...
        `;

        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt
        });

        let html = response.text || "";
        html = html.replace(/```html/g, '').replace(/```/g, '');
        
        res.json({ summary: html });

    } catch (e: any) { 
        console.error("Backend Error:", e);
        res.status(500).json({ error: 'Summarize failed', details: e.message }); 
    }
});

app.listen(PORT, () => {
  console.log(`🚀 BACKEND READY ON PORT ${PORT}`);
});
