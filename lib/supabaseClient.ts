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

// Öncelik: Hardcoded > Config (Env) > Fallback (Yeni Proje)
const supabaseUrl = HARDCODED_SUPABASE_URL || envUrl || 'https://yaqzwigwnrzzqczcxeel.supabase.co';
const supabaseAnonKey = HARDCODED_SUPABASE_KEY || envKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhcXp3aWd3bnJ6enFjemN4ZWVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyNTA4MzIsImV4cCI6MjA4NDgyNjgzMn0.AVnBRZOrckFpFYKNIntUP1sObZw2su_zo6c4sCujPYU';

console.log("🔌 Supabase Client Başlatılıyor...");
console.log("   URL:", supabaseUrl ? "✅ Tanımlı" : "❌ Eksik");
console.log("   KEY:", supabaseAnonKey ? "✅ Tanımlı" : "❌ Eksik");

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
