-- Migration: add_week_gating
-- Adds week_number to all public content tables and enrollment week controls.

-- Content tables
ALTER TABLE public.videos        ADD COLUMN IF NOT EXISTS week_number int NOT NULL DEFAULT 1 CHECK (week_number >= 1);
ALTER TABLE public.materials     ADD COLUMN IF NOT EXISTS week_number int NOT NULL DEFAULT 1 CHECK (week_number >= 1);
ALTER TABLE public.quiz_packages ADD COLUMN IF NOT EXISTS week_number int NOT NULL DEFAULT 1 CHECK (week_number >= 1);
ALTER TABLE public.essay_prompts ADD COLUMN IF NOT EXISTS week_number int NOT NULL DEFAULT 1 CHECK (week_number >= 1);

-- Enrollment week controls
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS course_start_date date NOT NULL DEFAULT CURRENT_DATE;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS week_override int CHECK (week_override >= 1);
