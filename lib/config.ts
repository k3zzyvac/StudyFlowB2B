
// ⚠️ DİKKAT: SUPABASE BAĞLANTISI
// Veritabanı (Sınıf ekleme vb.) işlemleri için Supabase URL ve Key gereklidir.

const getEnv = (key: string) => {
  try {
    // Vite context check
    return (import.meta as any).env?.[key];
  } catch (e) {
    // Fallback for non-vite environments if needed
    return process.env[key];
  }
};

// URL ve Key'i güvenli hale getiren yardımcı fonksiyon
const sanitizeUrl = (url: string | undefined) => {
  if (!url) return "";
  let cleanUrl = url.trim();
  if (!cleanUrl.startsWith("http")) {
    cleanUrl = `https://${cleanUrl}`;
  }
  // Sonunda slash varsa kaldır
  if (cleanUrl.endsWith("/")) {
    cleanUrl = cleanUrl.slice(0, -1);
  }
  return cleanUrl;
};

const sanitizeKey = (key: string | undefined) => {
  if (!key) return "";
  return key.trim();
};

// ENV üzerinden oku
const RAW_URL = getEnv('VITE_SUPABASE_URL') || "";
const RAW_KEY = getEnv('VITE_SUPABASE_ANON_KEY') || "";

if (!RAW_URL || !RAW_KEY) {
  console.error("❌ KRİTİK: Supabase URL veya Key bulunamadı! Lütfen .env dosyasını kontrol edin.");
}

export const config = {
  // Backend Adresi
  API_BASE_URL: getEnv('VITE_API_BASE_URL') || "http://localhost:8080",

  // Supabase (Otomatik temizlenmiş hali)
  SUPABASE_URL: sanitizeUrl(RAW_URL),
  SUPABASE_KEY: sanitizeKey(RAW_KEY),

  // Gemini API
  GEMINI_KEY: getEnv('VITE_GOOGLE_API_KEY') || ""
};
