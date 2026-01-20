# 🚀 TurboLearn Kurulum ve Anahtar Rehberi

Reis, projeyi ayağa kaldırmak için bu 3 anahtarı bulup `.env` dosyasına yapıştırman lazım.

## 1. Supabase (Veritabanı) Anahtarları Nerede?
Veritabanını bağlamak için bunlara ihtiyacımız var.

1. [supabase.com](https://supabase.com) adresine gir ve "Sign In" yap.
2. "New Project" diyerek bir proje oluştur (Adı: StudyFlow).
3. Proje oluştuktan sonra sol menüden en alttaki **Settings (Ayarlar / Dişli Çark)** ikonuna tıkla.
4. Açılan menüden **API** seçeneğine tıkla.
5. Karşına çıkan sayfada:
   - **Project URL**: Bu senin `NEXT_PUBLIC_SUPABASE_URL` değerindir.
   - **Project API Keys (anon public)**: Bu senin `NEXT_PUBLIC_SUPABASE_ANON_KEY` değerindir.
   *(service_role yazanı alma, o backend içindir, anon olanı al)*.

## 2. Google Gemini (Yapay Zeka) Anahtarı Nerede?
Yapay zekanın çalışması için bu lazım.

1. [aistudio.google.com](https://aistudio.google.com) adresine gir.
2. Sol üstten "Get API Key" butonuna tıkla.
3. "Create API Key" de.
4. Çıkan `AIza...` ile başlayan uzun şifreyi kopyala.
5. Bunu `.env` dosyasındaki `API_KEY` kısmına yapıştır.

## 3. Kurulumu Başlat
Anahtarları `.env` dosyasına yapıştırdıktan sonra terminale gel:

```bash
# Bağımlılıkları yükle
npm install

# Backend'i başlat (Ayrı bir terminalde)
cd backend
npm install
npm start

# Frontend'i başlat (Ana dizinde)
npm run start
```
