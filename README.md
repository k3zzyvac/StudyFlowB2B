
# 🚀 StudyFlow - Kurulum Rehberi

Reis, bu dosyayı açtıysan projeyi bilgisayarına indirmişsin demektir. Şimdi bu canavarı ayağa kaldıralım.

## 🛠️ ADIM 1: Gerekli Programlar
Bilgisayarında **Node.js** yüklü olmalı. Yüklü değilse [nodejs.org](https://nodejs.org) sitesinden indirip kur (LTS sürümü iyidir).

## 🛠️ ADIM 2: Hazırlık
1. İndirdiğin zip dosyasını klasöre çıkart (Örn: `Masaüstü/StudyFlow`).
2. Klasörün içinde **`package.json`** ve **`vite.config.ts`** dosyalarını gördüğünden emin ol.

## 🛠️ ADIM 3: Veritabanı (Supabase)
Bilgisayarına veritabanı kurmana gerek yok. Supabase kullanıyoruz.
1. [supabase.com](https://supabase.com) adresine git, giriş yap.
2. **New Project** diyerek bir proje oluştur.
3. Sol menüden **SQL Editor**'e tıkla.
4. **New Query** de.
5. Proje klasöründeki `components/DATABASE_KODLARI.md` dosyasını aç, içindeki kodları kopyala ve Supabase'e yapıştırıp **RUN** butonuna bas.
   *(Bu işlem tabloları, level sistemini ve her şeyi kurar)*

## 🛠️ ADIM 4: Şifreler (.env)
1. Ana klasörde `.env` adında bir dosya oluştur.
2. İçine şunları yapıştır ve kendi bilgilerini gir:

```env
# ⚠️ ÖNEMLİ: API Key'in başına VITE_ koymalısın ki Frontend de görsün.
# Google Gemini API Key (aistudio.google.com'dan al)
VITE_GOOGLE_API_KEY=AIzaSy......

# Backend uyumluluğu için aynısını buraya da yazabilirsin (veya backend VITE_ olanı da okur)
API_KEY=AIzaSy......

# Supabase Bilgileri (Supabase > Settings > API kısmından al)
VITE_SUPABASE_URL=https://.....supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci.....

# Backend Portu (Değiştirme)
BACKEND_PORT=8080
VITE_API_BASE_URL=http://localhost:8080
```

## 🚀 ADIM 5: ÇALIŞTIRMA (Büyük An)

İki tane terminal açman lazım (VS Code kullanıyorsan Terminal > New Terminal diyerek 2 tane açabilirsin).

**Terminal 1 (Backend - Yapay Zeka Motoru):**
```bash
cd backend
npm install
npm start
```
*(Ekranda "Backend running on port 8080" yazınca tamamdır)*

**Terminal 2 (Frontend - Arayüz):**
```bash
# Ana dizindeyken
npm install
npm run dev
```
*(Ekranda "Local: http://localhost:5173" yazacak. O linke tıkla ve projene gir!)*

---

### ⚠️ Google ile Giriş Notu
Google ile giriş butonunu ekledik ama çalışması için Supabase panelinden "Authentication > Providers > Google" ayarını yapman gerekir. Bunu projeyi yayınlayacağın zaman yapabilirsin, şimdilik acelesi yok.

**Yolun açık olsun Reis!** 🎓