-- Migration: soft_delete_enrollments
-- Replaces hard-delete enrollment removal with a soft deactivate flag.
-- This preserves course_start_date and week_override so that when a student
-- is re-enrolled in a course they previously left, their week progress resumes
-- rather than resetting to week 1.
--
-- Frozen-clock behaviour:
--   On deactivation  → paused_at is set to the current timestamp.
--   On reactivation  → course_start_date is shifted forward by the number of
--                      days the enrollment was inactive, then paused_at is
--                      cleared.  The week calculator sees a later start date
--                      and therefore returns the same week number as before
--                      the pause.

ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS is_active  boolean     NOT NULL DEFAULT true;

ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS paused_at  timestamptz NULL;

-- Index to make active-enrollment lookups fast
CREATE INDEX IF NOT EXISTS enrollments_student_active_idx
  ON public.enrollments (student_id, is_active);

-- Backfill: all existing rows are considered active with no pause
UPDATE public.enrollments
  SET is_active = true, paused_at = NULL
  WHERE is_active IS DISTINCT FROM true;
