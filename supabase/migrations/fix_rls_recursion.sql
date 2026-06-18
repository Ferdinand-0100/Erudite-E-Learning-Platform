-- ============================================================
-- Fix: infinite recursion in RLS policies on profiles table
-- ============================================================
-- The problem: policies on profiles (and other tables) used
--   EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
-- When Postgres evaluates this on the profiles table itself, it re-enters
-- the same RLS policies → infinite recursion.
--
-- Solution: a SECURITY DEFINER helper function that reads the role
-- bypassing RLS entirely. This is the standard Supabase pattern.
-- ============================================================

-- 1. Create a stable, security-definer function to get the current user's role
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;


-- 2. Rebuild ALL policies that reference public.profiles to use get_my_role()

-- ── profiles ────────────────────────────────────────────────

DROP POLICY IF EXISTS "Own profile"               ON public.profiles;
DROP POLICY IF EXISTS "Admin read all profiles"   ON public.profiles;
DROP POLICY IF EXISTS "Admin insert profiles"     ON public.profiles;
DROP POLICY IF EXISTS "Admin update profiles"     ON public.profiles;
DROP POLICY IF EXISTS "Teacher read all profiles" ON public.profiles;

-- Each user can fully manage their own row
CREATE POLICY "Own profile" ON public.profiles
  FOR ALL USING (auth.uid() = id);

-- Admins can read every profile
CREATE POLICY "Admin read all profiles" ON public.profiles
  FOR SELECT USING (public.get_my_role() = 'admin');

-- Admins can insert profiles (create-student upsert)
CREATE POLICY "Admin insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (public.get_my_role() = 'admin');

-- Admins can update any profile
CREATE POLICY "Admin update profiles" ON public.profiles
  FOR UPDATE USING (public.get_my_role() = 'admin');

-- Teachers can read all profiles (to assign study guides)
CREATE POLICY "Teacher read all profiles" ON public.profiles
  FOR SELECT USING (public.get_my_role() = 'teacher');


-- ── videos ──────────────────────────────────────────────────

DROP POLICY IF EXISTS "Admin write videos" ON public.videos;

CREATE POLICY "Admin write videos" ON public.videos
  FOR ALL
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');


-- ── materials ───────────────────────────────────────────────

DROP POLICY IF EXISTS "Admin write materials" ON public.materials;

CREATE POLICY "Admin write materials" ON public.materials
  FOR ALL
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');


-- ── quiz_questions ───────────────────────────────────────────

DROP POLICY IF EXISTS "Admin write quiz_questions" ON public.quiz_questions;

CREATE POLICY "Admin write quiz_questions" ON public.quiz_questions
  FOR ALL
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');


-- ── enrollments ─────────────────────────────────────────────

DROP POLICY IF EXISTS "Admin manage enrollments" ON public.enrollments;

CREATE POLICY "Admin manage enrollments" ON public.enrollments
  FOR ALL
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');


-- ── study_guides ─────────────────────────────────────────────
-- (created in add_teacher_role.sql — rebuild here with safe function)

DROP POLICY IF EXISTS "Teacher manage study_guides"      ON public.study_guides;
DROP POLICY IF EXISTS "Admin manage study_guides"        ON public.study_guides;

CREATE POLICY "Admin or Teacher manage study_guides" ON public.study_guides
  FOR ALL
  USING (public.get_my_role() IN ('admin', 'teacher'))
  WITH CHECK (public.get_my_role() IN ('admin', 'teacher'));


-- ── study_guide_items ────────────────────────────────────────

DROP POLICY IF EXISTS "Teacher manage study_guide_items" ON public.study_guide_items;
DROP POLICY IF EXISTS "Admin manage study_guide_items"   ON public.study_guide_items;

CREATE POLICY "Admin or Teacher manage study_guide_items" ON public.study_guide_items
  FOR ALL
  USING (public.get_my_role() IN ('admin', 'teacher'))
  WITH CHECK (public.get_my_role() IN ('admin', 'teacher'));


-- ── audio_files ──────────────────────────────────────────────

DROP POLICY IF EXISTS "Teacher/Admin read audio_files" ON public.audio_files;
DROP POLICY IF EXISTS "Admin write audio_files"        ON public.audio_files;

CREATE POLICY "Teacher or Admin read audio_files" ON public.audio_files
  FOR SELECT USING (public.get_my_role() IN ('admin', 'teacher'));

CREATE POLICY "Admin write audio_files" ON public.audio_files
  FOR ALL
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');


-- ── books ────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Teacher/Admin read books" ON public.books;
DROP POLICY IF EXISTS "Admin write books"        ON public.books;

CREATE POLICY "Teacher or Admin read books" ON public.books
  FOR SELECT USING (public.get_my_role() IN ('admin', 'teacher'));

CREATE POLICY "Admin write books" ON public.books
  FOR ALL
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');


-- ── answer_keys ──────────────────────────────────────────────

DROP POLICY IF EXISTS "Teacher/Admin read answer_keys" ON public.answer_keys;
DROP POLICY IF EXISTS "Admin write answer_keys"        ON public.answer_keys;

CREATE POLICY "Teacher or Admin read answer_keys" ON public.answer_keys
  FOR SELECT USING (public.get_my_role() IN ('admin', 'teacher'));

CREATE POLICY "Admin write answer_keys" ON public.answer_keys
  FOR ALL
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');


-- ── quiz_packages (if it exists and has an admin write policy) ───────────
-- Rebuild any admin write policy on quiz_packages too for consistency

DROP POLICY IF EXISTS "Admin write quiz_packages" ON public.quiz_packages;

CREATE POLICY "Admin write quiz_packages" ON public.quiz_packages
  FOR ALL
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');


-- ── essay_prompts ────────────────────────────────────────────

DROP POLICY IF EXISTS "Admin write essay_prompts" ON public.essay_prompts;

CREATE POLICY "Admin write essay_prompts" ON public.essay_prompts
  FOR ALL
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');


-- Done. All policies now use get_my_role() instead of a subquery on profiles.
