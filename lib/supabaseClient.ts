import { createClient } from '@supabase/supabase-js';
import { config } from './config';

// ------------------------------------------------------------------
// KULLANICI İÇİN NOT:
// Eğer .env dosyası ile uğraşmak istemiyorsanız, anahtarlarınızı
// doğrudan aşağıdaki tırnak işaretlerinin içine yapıştırabilirsiniz.
// ------------------------------------------------------------------
const HARDCODED_SUPABASE_URL = "";
const HARDCODED_SUPABASE_KEY = "";
// ------------------------------------------------------------------

const envUrl = config.SUPABASE_URL;
const envKey = config.SUPABASE_KEY;

// Öncelik: Hardcoded > Config (Env) > Fallback (Demo)
const supabaseUrl = HARDCODED_SUPABASE_URL || envUrl || 'https://xuwxidhzwcvowlrdhquo.supabase.co';
const supabaseAnonKey = HARDCODED_SUPABASE_KEY || envKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1d3hpZGh6d2N2b3dscmRocXVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMTg4NTUsImV4cCI6MjA4Mzc5NDg1NX0.RP9B_rY4hQQNaYfswdhQSMaCPzwZ0wxpFDVmaWjtI1A';

console.log("🔌 Supabase Client Başlatılıyor...");
console.log("   URL:", supabaseUrl ? "✅ Tanımlı" : "❌ Eksik");
console.log("   KEY:", supabaseAnonKey ? "✅ Tanımlı" : "❌ Eksik");

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
