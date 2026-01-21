-- 🗄️ STUDYFLOW B2B VERİTABANI KODLARI (FAZ 3 - GERÇEK GİRİŞ SİSTEMİ)
-- Bu dosya, kurum bazlı ayrıştırma ve gerçek giriş sistemi için optimize edilmiştir.
-- Son Güncelleme: Faz 3 - Gerçek Auth Sistemi

-- ⚠️ 1. TEMİZLİK (DİKKAT: Bu komutlar mevcut verileri siler!)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TABLE IF EXISTS weekly_reports CASCADE;
DROP TABLE IF EXISTS assignments CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS feedbacks CASCADE;
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS chats CASCADE;
DROP TABLE IF EXISTS notes CASCADE;
DROP TABLE IF EXISTS folders CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS institutions CASCADE;

-- ⚠️ 2. KURUMLAR (Institutions)
-- Her kurumun kendine özel öğretmen ve müdür kodları vardır.
create table public.institutions (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  teacher_code text not null,   -- Örn: '444' (XYZ için), '333' (ABC için)
  principal_code text not null, -- Örn: '4444' (XYZ için), '3333' (ABC için)
  created_at timestamptz default now()
);

-- Demo Kurumlar (Uygulama başlangıcı için)
INSERT INTO public.institutions (name, teacher_code, principal_code) VALUES 
('XYZ Kurumları', '444', '4444'),
('ABC Kurumları', '333', '3333');

-- ⚠️ 3. PROFİLLER (Kurum Bağlantılı - Gerçek Auth için güncellenmiş)
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  email text,                    -- Supabase Auth'tan gelen email (fake bile olsa)
  username text,                 -- Öğrenci girişi için kullanıcı adı
  role text default 'student' check (role in ('student','teacher','principal')),
  institution_id uuid references public.institutions(id),
  class_id uuid,                 -- Öğrenciler için (classes tablosundan)
  xp int default 0,
  level int default 1,
  created_at timestamptz default now()
);

-- Username için index (hızlı arama)
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- ⚠️ 4. SINIFLAR (Kuruma Özel)
-- Müdür kendi panelinden sınıf ekler, öğrenciler kayıt olurken bu listeyi görür
create table public.classes (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid references public.institutions(id) not null,
  grade text not null,   -- '9', '10', '11', '12', 'Mezun'
  branch text not null,  -- 'A', 'B', 'C', vb.
  created_at timestamptz default now(),
  unique (institution_id, grade, branch)
);

-- Demo Sınıflar (Test için)
-- XYZ Kurumları için
INSERT INTO public.classes (institution_id, grade, branch)
SELECT id, '9', 'A' FROM public.institutions WHERE name = 'XYZ Kurumları';
INSERT INTO public.classes (institution_id, grade, branch)
SELECT id, '9', 'B' FROM public.institutions WHERE name = 'XYZ Kurumları';
INSERT INTO public.classes (institution_id, grade, branch)
SELECT id, '10', 'A' FROM public.institutions WHERE name = 'XYZ Kurumları';
INSERT INTO public.classes (institution_id, grade, branch)
SELECT id, '10', 'B' FROM public.institutions WHERE name = 'XYZ Kurumları';
INSERT INTO public.classes (institution_id, grade, branch)
SELECT id, '11', 'A' FROM public.institutions WHERE name = 'XYZ Kurumları';
INSERT INTO public.classes (institution_id, grade, branch)
SELECT id, '12', 'A' FROM public.institutions WHERE name = 'XYZ Kurumları';

-- ABC Kurumları için
INSERT INTO public.classes (institution_id, grade, branch)
SELECT id, '9', 'A' FROM public.institutions WHERE name = 'ABC Kurumları';
INSERT INTO public.classes (institution_id, grade, branch)
SELECT id, '9', 'B' FROM public.institutions WHERE name = 'ABC Kurumları';
INSERT INTO public.classes (institution_id, grade, branch)
SELECT id, '10', 'A' FROM public.institutions WHERE name = 'ABC Kurumları';
INSERT INTO public.classes (institution_id, grade, branch)
SELECT id, '11', 'A' FROM public.institutions WHERE name = 'ABC Kurumları';
INSERT INTO public.classes (institution_id, grade, branch)
SELECT id, '12', 'A' FROM public.institutions WHERE name = 'ABC Kurumları';

-- ⚠️ 5. KLASÖRLER (Kişisel)
create table public.folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  color text default 'bg-gray-600',
  icon text default 'fa-folder',
  created_at timestamptz default now()
);

-- ⚠️ 6. NOTLAR (Kurum İçi İyileştirilmiş)
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  institution_id uuid references public.institutions(id), -- Kurum izolasyonu
  folder_id uuid references public.folders(id) on delete set null,
  title text,
  body_html text,
  type text default 'normal',
  is_public boolean default false,
  meta jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ⚠️ 7. AKTİVİTE LOGLARI
create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  action_type text,
  xp_amount int default 0,
  created_at timestamptz default now()
);

-- ⚠️ 8. HAFTALIK RAPORLAR (Müdür Panelinde Görünür)
create table public.weekly_reports (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid references public.institutions(id) not null,
  class_id text not null, -- '9-A' formatı (display için)
  teacher_name text not null,
  lesson text not null,
  rating int not null check (rating between 1 and 5),
  topic text,
  note text,
  week text,
  date date not null,
  created_at timestamptz default now()
);

-- ⚠️ 9. ATAMALAR (Öğretmen -> Öğrenci)
create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid references public.institutions(id) not null,
  class_id uuid references public.classes(id), -- Sınıfa atama için
  title text not null,
  type text not null check (type in ('note','exam')),
  content_id text, -- Not veya Sınav ID'si
  student_id uuid references auth.users(id),
  teacher_id uuid references auth.users(id) not null,
  due_date date,
  created_at timestamptz default now()
);

-- ⚠️ 10. GÜVENLİK (RLS) - KURUMSAL İZOLASYON (RECURSION FREE)
alter table public.profiles enable row level security;
alter table public.institutions enable row level security;
alter table public.classes enable row level security;
alter table public.folders enable row level security;
alter table public.notes enable row level security;
alter table public.activity_logs enable row level security;
alter table public.weekly_reports enable row level security;
alter table public.assignments enable row level security;

-- HELPER FUNCTIONS (To prevent infinite recursion)
CREATE OR REPLACE FUNCTION public.get_my_institution_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT institution_id FROM profiles WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM profiles WHERE user_id = auth.uid();
$$;

-- Kurumlar: Herkes isimleri görebilir (kayıt/giriş için dropdown)
create policy "Kurum İsimlerini Görme" on public.institutions for select using (true);

-- Profil Okuma: Kendi profilini veya aynı kurumdaki yetkilileri görebilir
create policy "Profil Okuma" on public.profiles
  for select using (
    auth.uid() = user_id OR 
    (
      public.get_my_role() IN ('teacher', 'principal') AND 
      public.get_my_institution_id() = institution_id
    )
  );

-- Profil Güncelleme: Sadece kendisi
create policy "Profil Güncelleme" on public.profiles
  for update using (auth.uid() = user_id);

-- Profil Insert: Auth trigger veya authenticated kullanıcı
create policy "Profil Ekleme" on public.profiles
  for insert with check (auth.uid() = user_id);

-- Sınıflar: Herkes görebilir (kayıt için), sadece müdür yönetebilir
create policy "Sınıf Görme (Herkes)" on public.classes
  for select using (true);

create policy "Sınıf Yönetimi (Müdür)" on public.classes
  for all to authenticated
  using (
    public.get_my_role() = 'principal' AND 
    public.get_my_institution_id() = institution_id
  )
  with check (
    public.get_my_role() = 'principal' AND 
    public.get_my_institution_id() = institution_id
  );

-- Klasörler: Sadece sahibi
create policy "Klasör Erişimi" on public.folders
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Notlar: Sahibi veya aynı kurumdaki public notlar
create policy "Not Okuma" on public.notes
  for select using (
    auth.uid() = user_id OR 
    (
      is_public = true AND 
      public.get_my_institution_id() = institution_id
    )
  );

create policy "Not Yazma/Silme" on public.notes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Aktivite Logları: Sadece sahibi
create policy "Aktivite Erişimi" on public.activity_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Haftalık Raporlar: Aynı kurumdaki öğretmen/müdürler
create policy "Rapor Okuma" on public.weekly_reports
  for select using (
    public.get_my_role() IN ('teacher', 'principal') AND 
    public.get_my_institution_id() = institution_id
  );

create policy "Rapor Yönetimi" on public.weekly_reports
  for all using (
    public.get_my_role() IN ('teacher', 'principal') AND 
    public.get_my_institution_id() = institution_id
  );

-- Atamalar: İlgili öğrenci veya öğretmen
create policy "Atama Okuma" on public.assignments
  for select using (
    (auth.uid() = student_id) OR
    (auth.uid() = teacher_id) OR
    (
       public.get_my_institution_id() = institution_id AND
       public.get_my_role() IN ('teacher', 'principal')
    )
  );

create policy "Atama Yönetimi (Öğretmen)" on public.assignments
  for all using (
    public.get_my_role() = 'teacher' AND 
    public.get_my_institution_id() = institution_id
  );

-- ⚠️ 11. INDEXES (Performans)
CREATE INDEX IF NOT EXISTS idx_profiles_inst ON public.profiles(institution_id);
CREATE INDEX IF NOT EXISTS idx_profiles_class ON public.profiles(class_id);
CREATE INDEX IF NOT EXISTS idx_classes_inst ON public.classes(institution_id);
CREATE INDEX IF NOT EXISTS idx_notes_inst ON public.notes(institution_id);
CREATE INDEX IF NOT EXISTS idx_notes_user ON public.notes(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_inst ON public.weekly_reports(institution_id);
CREATE INDEX IF NOT EXISTS idx_assignments_inst ON public.assignments(institution_id);
CREATE INDEX IF NOT EXISTS idx_assignments_student ON public.assignments(student_id);

-- ⚠️ 12. OTOMATİK PROFİL TETİKLEYİCİSİ (SignUp sonrası)
-- Yeni kullanıcı oluşturulduğunda otomatik profil kaydı yapar
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.profiles (user_id, email, username, role, institution_id, class_id, xp, level)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'username',
    COALESCE(new.raw_user_meta_data->>'role', 'student'),
    (new.raw_user_meta_data->>'institution_id')::uuid,
    (new.raw_user_meta_data->>'class_id')::uuid,
    0, 
    1
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ⚠️ 13. NOTLAR
-- =====================================
-- GİRİŞ SİSTEMİ AKIŞI:
-- =====================================
-- 
-- ÖĞRENCİ KAYIT:
-- 1. Kullanıcı adı girer
-- 2. Kurumu seçer (institutions tablosundan)
-- 3. Sınıfını seçer (classes tablosundan, kuruma göre filtrelenir)
-- 4. Şifre belirler
-- -> Supabase Auth ile kayıt yapılır
-- -> Trigger otomatik profil oluşturur
-- -> Frontend profili günceller (username, role, institution_id, class_id)
--
-- ÖĞRETMEN KAYIT:
-- 1. Kurum kodunu girer (örn: 444 veya 333)
-- 2. Şifre belirler
-- -> Kod, institutions.teacher_code ile eşleştirilir
-- -> Eşleşen kurumun ID'si profile yazılır
--
-- MÜDÜR KAYIT:
-- 1. Kurum kodunu girer (örn: 4444 veya 3333)
-- 2. Şifre belirler
-- -> Kod, institutions.principal_code ile eşleştirilir
-- -> Eşleşen kurumun ID'si profile yazılır
--
-- GİRİŞ:
-- - Öğrenci: username + kurum + sınıf + şifre
-- - Öğretmen: sadece şifre
-- - Müdür: sadece şifre
--
-- KURUM İZOLASYONU:
-- - Her kurum kendi ekosistemi
-- - XYZ'deki 10-A ile ABC'deki 10-A farklı
-- - Öğretmenler sadece kendi kurumlarındaki sınıfları/öğrencileri görür
-- - Müdürler sadece kendi kurumlarının raporlarını görür