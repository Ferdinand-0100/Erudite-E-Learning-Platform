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
-- course_key examples: 'english_GET', 'english_IELTS', 'english_PTE',
--                      'mandarin', 'computer'
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


-- ─── SAMPLE DATA ────────────────────────────────────────────
-- Replace embed URLs with your actual YouTube embed links.

insert into public.videos (course_key, title, embed_url, duration_label, difficulty, sort_order) values
  ('english_GET',   'GET — Lesson 1: Grammar Fundamentals',    'https://www.youtube.com/embed/dQw4w9WgXcQ', '12 min', 'Beginner',     1),
  ('english_GET',   'GET — Lesson 2: Vocabulary Building',     'https://www.youtube.com/embed/dQw4w9WgXcQ', '15 min', 'Beginner',     2),
  ('english_IELTS', 'IELTS — Band Score Strategies',           'https://www.youtube.com/embed/dQw4w9WgXcQ', '20 min', 'Intermediate', 1),
  ('english_IELTS', 'IELTS — Writing Task 2 Masterclass',      'https://www.youtube.com/embed/dQw4w9WgXcQ', '25 min', 'Intermediate', 2),
  ('english_PTE',   'PTE Academic — Speaking & Writing',       'https://www.youtube.com/embed/dQw4w9WgXcQ', '18 min', 'Intermediate', 1),
  ('mandarin',      'Mandarin Lesson 1: Tones & Pinyin',        'https://www.youtube.com/embed/dQw4w9WgXcQ', '20 min', 'Beginner',     1),
  ('mandarin',      'Mandarin Lesson 2: Basic Greetings',       'https://www.youtube.com/embed/dQw4w9WgXcQ', '14 min', 'Beginner',     2),
  ('computer',      'Intro to Python Programming',              'https://www.youtube.com/embed/dQw4w9WgXcQ', '25 min', 'Beginner',     1),
  ('computer',      'Microsoft Office Essentials',              'https://www.youtube.com/embed/dQw4w9WgXcQ', '18 min', 'Beginner',     2),
  ('computer',      'Database Basics with SQL',                 'https://www.youtube.com/embed/dQw4w9WgXcQ', '30 min', 'Intermediate', 3)
on conflict do nothing;

insert into public.materials (course_key, title, file_url, file_size_label, sort_order) values
  ('english_GET',   'GET Study Guide — Module 1',    'https://example.com/files/get-module1.pdf',    '2.4 MB', 1),
  ('english_GET',   'GET Vocabulary Worksheet',       'https://example.com/files/get-vocab.pdf',      '1.1 MB', 2),
  ('english_IELTS', 'IELTS Band Descriptors',         'https://example.com/files/ielts-bands.pdf',    '800 KB', 1),
  ('english_PTE',   'PTE Score Guide',                'https://example.com/files/pte-guide.pdf',      '1.3 MB', 1),
  ('mandarin',      'Pinyin Reference Sheet',          'https://example.com/files/pinyin.pdf',         '850 KB', 1),
  ('mandarin',      'Character Writing Practice',      'https://example.com/files/characters.pdf',     '3.2 MB', 2),
  ('computer',      'Python Cheat Sheet',              'https://example.com/files/python-cheat.pdf',   '512 KB', 1),
  ('computer',      'Office 365 Lab Manual',           'https://example.com/files/office-lab.docx',   '1.8 MB', 2)
on conflict do nothing;

insert into public.quiz_questions (course_key, question, options, correct_answer_index, sort_order) values
  ('english_GET',
   'Which sentence is grammatically correct?',
   '["She don''t like apples.", "She doesn''t likes apples.", "She doesn''t like apples.", "She not like apples."]',
   2, 1),
  ('english_GET',
   'Choose the correct article: "I saw ___ elephant at the zoo."',
   '["a", "an", "the", "(none)"]',
   1, 2),
  ('english_IELTS',
   'In IELTS Writing Task 2, what is the minimum recommended word count?',
   '["150 words", "250 words", "300 words", "200 words"]',
   1, 1),
  ('english_PTE',
   'PTE Academic scores are reported on a scale of:',
   '["0–9", "0–100", "1–500", "0–50"]',
   1, 1),
  ('mandarin',
   'How many tones does Standard Mandarin have?',
   '["3", "4", "5", "6"]',
   1, 1),
  ('mandarin',
   'What is the pinyin for "hello" in Mandarin?',
   '["Xièxie", "Zàijiàn", "Nǐ hǎo", "Duìbuqǐ"]',
   2, 2),
  ('computer',
   'Which of the following is a Python data type?',
   '["integer", "character", "record", "pointer"]',
   0, 1),
  ('computer',
   'What does CPU stand for?',
   '["Central Processing Unit", "Computer Power Unit", "Central Program Utility", "Core Processing Utility"]',
   0, 2)
on conflict do nothing;
