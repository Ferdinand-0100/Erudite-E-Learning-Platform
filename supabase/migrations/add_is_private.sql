-- ============================================================
-- Migration: add_is_private
-- Adds is_private boolean column to all four content tables.
-- Private items have course_key = NULL and are only accessible
-- via Study Guide assignments — never shown in course tabs.
-- ============================================================

ALTER TABLE public.videos
  ADD COLUMN IF NOT EXISTS is_private boolean NOT NULL DEFAULT false;

ALTER TABLE public.materials
  ADD COLUMN IF NOT EXISTS is_private boolean NOT NULL DEFAULT false;

ALTER TABLE public.quiz_packages
  ADD COLUMN IF NOT EXISTS is_private boolean NOT NULL DEFAULT false;

ALTER TABLE public.essay_prompts
  ADD COLUMN IF NOT EXISTS is_private boolean NOT NULL DEFAULT false;

-- Allow course_key to be NULL so private items can omit it
ALTER TABLE public.videos
  ALTER COLUMN course_key DROP NOT NULL;

ALTER TABLE public.materials
  ALTER COLUMN course_key DROP NOT NULL;

ALTER TABLE public.quiz_packages
  ALTER COLUMN course_key DROP NOT NULL;

ALTER TABLE public.essay_prompts
  ALTER COLUMN course_key DROP NOT NULL;
