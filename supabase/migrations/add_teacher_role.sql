-- ============================================================
-- Migration: Teacher role + teacher-facing content tables
-- ============================================================

-- 1. Extend the role check constraint to include 'teacher'
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check CHECK (role IN ('student', 'admin', 'teacher'));

-- 2. ─── AUDIO FILES ──────────────────────────────────────────
-- Teacher-only content (visible on teacher course page, not students)
CREATE TABLE IF NOT EXISTS public.audio_files (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_key       text,                        -- NULL when is_private = true
  title            text NOT NULL,
  file_url         text NOT NULL,               -- Supabase Storage public URL
  duration_label   text,                        -- e.g. "8 min"
  difficulty       text DEFAULT 'Beginner',
  tags             jsonb NOT NULL DEFAULT '[]',
  is_private       boolean NOT NULL DEFAULT false,
  week_number      int NOT NULL DEFAULT 1 CHECK (week_number >= 1),
  sort_order       int DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audio_files_course_key_idx ON public.audio_files(course_key);

-- 3. ─── BOOKS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.books (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_key       text,
  title            text NOT NULL,
  file_url         text NOT NULL,
  file_size_label  text,
  difficulty       text DEFAULT 'Beginner',
  tags             jsonb NOT NULL DEFAULT '[]',
  is_private       boolean NOT NULL DEFAULT false,
  week_number      int NOT NULL DEFAULT 1 CHECK (week_number >= 1),
  sort_order       int DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS books_course_key_idx ON public.books(course_key);

-- 4. ─── ANSWER KEYS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.answer_keys (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_key       text,
  title            text NOT NULL,
  file_url         text NOT NULL,
  file_size_label  text,
  difficulty       text DEFAULT 'Beginner',
  tags             jsonb NOT NULL DEFAULT '[]',
  is_private       boolean NOT NULL DEFAULT false,
  week_number      int NOT NULL DEFAULT 1 CHECK (week_number >= 1),
  sort_order       int DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS answer_keys_course_key_idx ON public.answer_keys(course_key);

-- 5. ─── RLS ──────────────────────────────────────────────────
ALTER TABLE public.audio_files  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answer_keys  ENABLE ROW LEVEL SECURITY;

-- Teachers and admins can read; only admins can write

DROP POLICY IF EXISTS "Teacher/Admin read audio_files"  ON public.audio_files;
DROP POLICY IF EXISTS "Admin write audio_files"         ON public.audio_files;
DROP POLICY IF EXISTS "Teacher/Admin read books"        ON public.books;
DROP POLICY IF EXISTS "Admin write books"               ON public.books;
DROP POLICY IF EXISTS "Teacher/Admin read answer_keys"  ON public.answer_keys;
DROP POLICY IF EXISTS "Admin write answer_keys"         ON public.answer_keys;

CREATE POLICY "Teacher/Admin read audio_files" ON public.audio_files
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

CREATE POLICY "Admin write audio_files" ON public.audio_files
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Teacher/Admin read books" ON public.books
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

CREATE POLICY "Admin write books" ON public.books
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Teacher/Admin read answer_keys" ON public.answer_keys
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

CREATE POLICY "Admin write answer_keys" ON public.answer_keys
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- 6. Allow teachers to read all profiles (to assign study guides)
DROP POLICY IF EXISTS "Teacher read all profiles" ON public.profiles;
CREATE POLICY "Teacher read all profiles" ON public.profiles
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'teacher')
  );

-- 7. Allow teachers to read + write study_guides and study_guide_items
DROP POLICY IF EXISTS "Teacher manage study_guides"       ON public.study_guides;
DROP POLICY IF EXISTS "Teacher manage study_guide_items"  ON public.study_guide_items;

CREATE POLICY "Teacher manage study_guides" ON public.study_guides
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher')));

CREATE POLICY "Teacher manage study_guide_items" ON public.study_guide_items
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher')));

-- 8. Extend study_guide_items item_type to include the new content types
--    (existing check constraint may need removal; adjust if your DB has it)
ALTER TABLE public.study_guide_items
  DROP CONSTRAINT IF EXISTS study_guide_items_item_type_check;

-- 9. Teacher enrollments — teachers bypass enrollment checks on course pages
--    (handled in application code; no schema change needed)

-- Done.
