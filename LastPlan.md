# 🏁 StudyFlow B2B - Nihai Teknik Uygulama Planı (v3.0)

Bu doküman, StudyFlow platformunun bireysel (B2C) yapıdan profesyonel bir kurumsal (B2B SaaS) platforma geçişi için gerekli olan son teknik adımları ve mimari gereksinimleri tanımlar. Bir yapay zeka modelinin bu gereksinimleri anlayıp hatasız kodlayabilmesi için hazırlanmıştır.

---

## 🎯 Ana Hedef
Uygulamayı dershanelere ve eğitim kurumlarına sunulabilir, yüksek görsel kaliteli, maliyet kontrollü ve yönetimsel derinliği olan bir "ürün" haline getirmek.

---

## 🏗️ BİLEŞEN 1: Görsel Mükemmellik ve PDF Standartları (UI/UX - CSS)

### Mevcut Sorun
AI tarafından üretilen notlar ve PDF çıktıları sayfa sonlarında metnin ortasından bölünmekte, tablolar ve başlıklar iki sayfaya yayılmaktadır. Bu durum profesyonel olmayan bir görüntüye sebep olmaktadır.

### Teknik Gereksinimler
1.  **Page-Break Kontrolü:** `index.css` dosyasına veya ilgili bileşen stillerine CSS `break-inside: avoid;` ve `page-break-inside: avoid;` kuralları eklenmelidir.
2.  **Element Koruma:** Özellikle `.note-block`, `table`, `h2` ve `h3` etiketleri sayfa sonunda asla bölünmemeli; sığmıyorsa tamamen bir sonraki sayfaya taşınmalıdır.
3.  **PDF Görünümü:** `pdf-mode` aktifken font boyutları ve padding değerleri, ekran yerine fiziksel A4 kağıdı standartlarına (12pt font, 20mm margin) optimize edilmelidir.

---

## 🏗️ BİLEŞEN 2: Kurumsal Kimlik ve Logo Entegrasyonu (Storage & Backend)

### Mevcut Sorun
Haftalık raporlar jenerik bir yapıda çıkmaktadır. Kurumlar kendi logolarını sistemde görememektedir.

### Teknik Gereksinimler
1.  **Kurum Logosu:** Supabase `institutions` tablosuna `logo_url` sütunu eklenmelidir.
2.  **Logo Yükleme:** Müdür panelinde, profil ayarları kısmından kurumun kendi logosunu (PNG/JPG) yükleyebileceği bir arayüz oluşturulmalıdır.
3.  **PDF Enjeksiyonu:** `Dashboard.tsx` içindeki PDF oluşturma fonksiyonuna (html2pdf), oluşturulan belgenin sağ veya sol üst köşesine bu logoyu dinamik olarak yerleştiren bir katman eklenmelidir.

---

## 🏗️ BİLEŞEN 3: Hibrit AI Katmanı ve Dual-API Altyapısı (Reliability)

### Mevcut Sorun
Free Gemini API limitleri bir haftalık yoğun kullanımda çabuk dolmaktadır. Sistemin tamamen kapanma riski vardır.

### Teknik Gereksinimler
1.  **Dual Client:** `aiHelper.ts` içinde hem Google Gemini hem de Groq (Qwen 3-32B) istemcileri hazır bulunmalıdır.
2.  **Yük Paylaşımı (Load Balancing):**
    *   **Groq (Qwen 3-32B):** PDF özetleme ve anlık not oluşturma gibi hız ve Türkçe dil disiplini gerektiren görevler için kullanılmalıdır.
    *   **Gemini:** Daha büyük veri analizi gerektiren "Haftalık Verimlilik Raporu Analizi" gibi işlerde kullanılmalıdır.
3.  **Hata Yönetimi:** Birincil API hata verirse (Error 429), sistem otomatik olarak ikincil API'ye geçiş yapmalıdır.

---

## 🏗️ BİLEŞEN 4: B2B Yönetim ve Kısıtlamalar (Refactor)

### Mevcut Sorun
Uygulamada ticari değere katkısı olmayan "XP/Gamification" kalıntıları bulunmakta ve öğrenci kullanımı için bir limit bulunmamaktadır.

### Teknik Gereksinimler
1.  **XP'nin Temizlenmesi:** Kod genelindeki `xp`, `level`, `nextLevelXp` değişkenleri ve buna bağlı UI bileşenleri (XP barları, seviye yazıları) tamamen kaldırılmalıdır.
2.  **Öğrenci Kullanım Limiti:** 
    *   `profiles` tablosuna `daily_usage_count` (günlük kullanım) sütunu eklenmelidir.
    *   Öğrenci her AI işlemi yaptığında bu sayı artmalıdır.
    *   Günlük limit **3** olarak belirlenmeli; limite ulaşıldığında kullanıcıya "Bugünkü limitiniz doldu, yarın tekrar yenilenecek" uyarısı verilmelidir.
3.  **Müdür Dashboard Analitiği:** Müdür paneline dershanenin durumunu özetleyen şu 3 grafik eklenmelidir:
    *   Sınıf bazlı öğrenci yoğunluğu (Pie Chart).
    *   Haftalık verilen ödev sayısı trendi (Bar Chart).
    *   Aktiflik oranı (Ödev tamamlayan vs. Tamamlamayan).

---

## 🚀 Sonuç
Bu dördül yapının tamamlanmasıyla birlikte StudyFlow, bir prototipten gerçek bir **Educational Tech SaaS** ürününe dönüşecektir.
