-- ============================================================
-- EduLearn Platform — Supabase / PostgreSQL Schema
-- Run this in your Supabase project: SQL Editor → New Query
-- ============================================================

-- ─── PROFILES ───────────────────────────────────────────────
-- Extends Supabase auth.users with student-specific fields.
-- A row is auto-created on signup via the trigger below.
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  role        text not null default 'student' check (role in ('student', 'admin')),
  created_at  timestamptz not null default now()
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Auto-create a profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ─── VIDEOS ─────────────────────────────────────────────────
-- course_key format: {course}_{subclass}_{level}  (3 segments, all lowercase)
-- examples: 'english_GET_beginner', 'english_IELTS_band5', 'english_PTE_pte_academic_65',
--           'mandarin_GM_hsk1', 'mandarin_HSK_hsk3', 'mandarin_TOCFL_band_a',
--           'computer_web_beginner', 'computer_IOT_intermediate'
create table if not exists public.videos (
  id               uuid primary key default gen_random_uuid(),
  course_key       text not null,
  title            text not null,
  embed_url        text not null,        -- YouTube embed URL
  duration_label   text,                 -- e.g. "12 min"
  difficulty       text default 'Beginner',
  sort_order       int  default 0,
  created_at       timestamptz not null default now()
);

create index if not exists videos_course_key_idx on public.videos(course_key);


-- ─── MATERIALS ──────────────────────────────────────────────
-- course_key format: {course}_{subclass}_{level}  (3 segments, all lowercase)
-- examples: 'english_GET_beginner', 'mandarin_GM_hsk1', 'computer_web_beginner'
create table if not exists public.materials (
  id               uuid primary key default gen_random_uuid(),
  course_key       text not null,
  title            text not null,
  file_url         text not null,        -- Supabase Storage public URL
  file_size_label  text,                 -- e.g. "2.4 MB"
  sort_order       int  default 0,
  created_at       timestamptz not null default now()
);

create index if not exists materials_course_key_idx on public.materials(course_key);


-- ─── QUIZ QUESTIONS ─────────────────────────────────────────
-- course_key format: {course}_{subclass}_{level}  (3 segments, all lowercase)
-- examples: 'english_GET_beginner', 'mandarin_GM_hsk1', 'computer_web_beginner'
create table if not exists public.quiz_questions (
  id                   uuid primary key default gen_random_uuid(),
  course_key           text not null,
  question             text not null,
  options              jsonb not null,   -- ["Option A", "Option B", "Option C", "Option D"]
  correct_answer_index int  not null,    -- 0-based index into options array
  explanation          text,             -- optional explanation shown after answering
  sort_order           int  default 0,
  created_at           timestamptz not null default now()
);

create index if not exists quiz_questions_course_key_idx on public.quiz_questions(course_key);


-- ─── QUIZ ATTEMPTS ──────────────────────────────────────────
create table if not exists public.quiz_attempts (
  id            uuid primary key default gen_random_uuid(),
  student_id    uuid not null references public.profiles(id) on delete cascade,
  question_id   uuid not null references public.quiz_questions(id) on delete cascade,
  chosen_index  int  not null,
  created_at    timestamptz not null default now()
);

create index if not exists quiz_attempts_student_idx on public.quiz_attempts(student_id);


-- ─── PROGRESS ───────────────────────────────────────────────
create table if not exists public.progress (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references public.profiles(id) on delete cascade,
  course_key  text not null,
  percent     int  not null default 0 check (percent between 0 and 100),
  updated_at  timestamptz not null default now(),
  unique (student_id, course_key)
);


-- ─── ROW LEVEL SECURITY ─────────────────────────────────────
-- Only allow authenticated users to read/write their own data.

alter table public.profiles       enable row level security;
alter table public.videos         enable row level security;
alter table public.materials      enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_attempts  enable row level security;
alter table public.progress       enable row level security;

-- Drop policies before recreating (policies don't support IF NOT EXISTS)
drop policy if exists "Own profile"                    on public.profiles;
drop policy if exists "Authenticated read videos"      on public.videos;
drop policy if exists "Authenticated read materials"   on public.materials;
drop policy if exists "Authenticated read quiz questions" on public.quiz_questions;
drop policy if exists "Own quiz attempts"              on public.quiz_attempts;
drop policy if exists "Own progress"                   on public.progress;

-- Profiles: users see and edit only their own row
create policy "Own profile" on public.profiles
  for all using (auth.uid() = id);

-- Videos & materials: any authenticated user can read
create policy "Authenticated read videos" on public.videos
  for select using (auth.role() = 'authenticated');

create policy "Authenticated read materials" on public.materials
  for select using (auth.role() = 'authenticated');

create policy "Authenticated read quiz questions" on public.quiz_questions
  for select using (auth.role() = 'authenticated');

-- Quiz attempts: students insert/read their own
create policy "Own quiz attempts" on public.quiz_attempts
  for all using (auth.uid() = student_id);

-- Progress: students read/write their own
create policy "Own progress" on public.progress
  for all using (auth.uid() = student_id);

-- Admin write policies
drop policy if exists "Admin write videos"         on public.videos;
drop policy if exists "Admin write materials"      on public.materials;
drop policy if exists "Admin write quiz_questions" on public.quiz_questions;
drop policy if exists "Admin update profiles"      on public.profiles;

create policy "Admin write videos" on public.videos
  for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admin write materials" on public.materials
  for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admin write quiz_questions" on public.quiz_questions
  for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admin update profiles" on public.profiles
  for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );


-- ─── SAMPLE DATA ────────────────────────────────────────────
-- course_key format: {course}_{subclass}_{level}
-- Replace embed URLs with your actual YouTube embed links.

insert into public.videos (course_key, title, embed_url, duration_label, difficulty, sort_order) values
  ('english_get_beginner',        'GET Beginner — Grammar Fundamentals',         'https://www.youtube.com/embed/dQw4w9WgXcQ', '12 min', 'Beginner',     1),
  ('english_ielts_band5',         'IELTS Band 5 — Reading Strategies',           'https://www.youtube.com/embed/dQw4w9WgXcQ', '20 min', 'Intermediate', 1),
  ('english_pte_pte_academic_65', 'PTE Academic 65 — Speaking & Writing',        'https://www.youtube.com/embed/dQw4w9WgXcQ', '18 min', 'Intermediate', 1),
  ('mandarin_gm_hsk1',            'GM HSK 1 — Tones & Pinyin Introduction',      'https://www.youtube.com/embed/dQw4w9WgXcQ', '20 min', 'Beginner',     1),
  ('mandarin_hsk_hsk1',           'HSK 1 — Basic Vocabulary & Phrases',          'https://www.youtube.com/embed/dQw4w9WgXcQ', '15 min', 'Beginner',     1),
  ('mandarin_tocfl_band_a',       'TOCFL Band A — Everyday Conversations',       'https://www.youtube.com/embed/dQw4w9WgXcQ', '17 min', 'Beginner',     1),
  ('computer_web_beginner',       'Web Beginner — Intro to HTML & CSS',          'https://www.youtube.com/embed/dQw4w9WgXcQ', '25 min', 'Beginner',     1),
  ('computer_iot_beginner',       'IOT Beginner — Introduction to IoT Concepts', 'https://www.youtube.com/embed/dQw4w9WgXcQ', '22 min', 'Beginner',     1)
on conflict do nothing;

insert into public.materials (course_key, title, file_url, file_size_label, sort_order) values
  ('english_get_beginner',        'GET Beginner Study Guide',               'https://example.com/files/get-beginner-guide.pdf',      '2.4 MB', 1),
  ('english_ielts_band5',         'IELTS Band 5 Practice Workbook',         'https://example.com/files/ielts-band5-workbook.pdf',    '1.8 MB', 1),
  ('english_pte_pte_academic_65', 'PTE Academic 65 Score Guide',            'https://example.com/files/pte-academic-65-guide.pdf',   '1.3 MB', 1),
  ('mandarin_gm_hsk1',            'GM HSK 1 Pinyin Reference Sheet',        'https://example.com/files/gm-hsk1-pinyin.pdf',          '850 KB', 1),
  ('mandarin_hsk_hsk1',           'HSK 1 Vocabulary List',                  'https://example.com/files/hsk1-vocab.pdf',              '600 KB', 1),
  ('mandarin_tocfl_band_a',       'TOCFL Band A Character Writing Practice','https://example.com/files/tocfl-band-a-writing.pdf',    '3.2 MB', 1),
  ('computer_web_beginner',       'Web Beginner HTML & CSS Cheat Sheet',    'https://example.com/files/web-beginner-cheatsheet.pdf', '512 KB', 1),
  ('computer_iot_beginner',       'IOT Beginner Lab Manual',                'https://example.com/files/iot-beginner-lab.pdf',        '1.5 MB', 1)
on conflict do nothing;

insert into public.quiz_questions (course_key, question, options, correct_answer_index, sort_order) values
  ('english_get_beginner',
   'Which sentence is grammatically correct?',
   '["She don''t like apples.", "She doesn''t likes apples.", "She doesn''t like apples.", "She not like apples."]',
   2, 1),
  ('english_ielts_band5',
   'In IELTS Writing Task 2, what is the minimum recommended word count?',
   '["150 words", "250 words", "300 words", "200 words"]',
   1, 1),
  ('english_pte_pte_academic_65',
   'PTE Academic scores are reported on a scale of:',
   '["0–9", "0–100", "1–500", "0–50"]',
   1, 1),
  ('mandarin_gm_hsk1',
   'How many tones does Standard Mandarin have?',
   '["3", "4", "5", "6"]',
   1, 1),
  ('mandarin_hsk_hsk1',
   'What is the pinyin for "hello" in Mandarin?',
   '["Xièxie", "Zàijiàn", "Nǐ hǎo", "Duìbuqǐ"]',
   2, 1),
  ('mandarin_tocfl_band_a',
   'Which of the following is a TOCFL Band A level topic?',
   '["Academic writing", "Everyday greetings", "Business negotiation", "Literary analysis"]',
   1, 1),
  ('computer_web_beginner',
   'Which HTML tag is used to create a hyperlink?',
   '["<link>", "<a>", "<href>", "<url>"]',
   1, 1),
  ('computer_iot_beginner',
   'What does IoT stand for?',
   '["Internet of Things", "Integration of Technology", "Input/Output Terminal", "Interconnected Online Tools"]',
   0, 1)
on conflict do nothing;


-- ─── ACTIVITY LOG ───────────────────────────────────────────
create table if not exists public.activity_log (
  id          uuid        primary key default gen_random_uuid(),
  student_id  uuid        not null references public.profiles(id) on delete cascade,
  course_key  text        not null,
  event_type  text        not null check (event_type in ('video_watched', 'quiz_completed', 'material_downloaded')),
  label       text        not null,
  created_at  timestamptz not null default now()
);

create index if not exists activity_log_student_time_idx
  on public.activity_log (student_id, created_at desc);

alter table public.activity_log enable row level security;

drop policy if exists "Own activity_log" on public.activity_log;
create policy "Own activity_log" on public.activity_log
  for all using (auth.uid() = student_id);


-- ─── ENROLLMENTS ────────────────────────────────────────────
-- Stores per-level course access for each student.
-- course_key format: {course}_{subclass}_{level} (all lowercase)
-- e.g. 'english_ielts_band5', 'computer_web_beginner'
create table if not exists public.enrollments (
  id          uuid        primary key default gen_random_uuid(),
  student_id  uuid        not null references public.profiles(id) on delete cascade,
  course_key  text        not null,
  created_at  timestamptz not null default now(),
  unique (student_id, course_key)
);

create index if not exists enrollments_student_idx on public.enrollments(student_id);

alter table public.enrollments enable row level security;

drop policy if exists "Own enrollments"           on public.enrollments;
drop policy if exists "Admin manage enrollments"  on public.enrollments;

-- Students can only read their own enrollments
create policy "Own enrollments" on public.enrollments
  for select using (auth.uid() = student_id);

-- Admins can read and write all enrollments
create policy "Admin manage enrollments" on public.enrollments
  for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  )
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
