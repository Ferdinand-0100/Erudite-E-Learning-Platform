-- ============================================================
-- Migration: rename_course_keys
-- Renames changed course_key values across all tables that
-- reference them: enrollments, videos, materials, quiz_questions,
-- quiz_attempts (via quiz_questions), progress, activity_log.
--
-- Tables updated: enrollments, videos, materials, quiz_questions,
--                 progress, activity_log
--
-- Changes:
--   English / GE (GET subclass):
--     english_get_beginner           → english_get_starter
--     (other GE levels are unchanged: elementary, pre_intermediate,
--      intermediate, upper_intermediate, advanced)
--
--   English / IELTS:
--     english_ielts_band4            → english_ielts_ac
--     english_ielts_band5            → english_ielts_ac  (*)
--     english_ielts_band6            → english_ielts_gt
--     english_ielts_band7            → english_ielts_ukvii
--     english_ielts_band75           → english_ielts_lifestyle
--
--   (*) Both band4 and band5 map to 'ac' here; if you have rows for
--       both you can split them differently — adjust as needed.
--
--   English / PTE:
--     english_pte_pte_core           → english_pte_pte_academic
--     english_pte_pte_academic_50    → english_pte_pte_academic_ukvii
--     english_pte_pte_academic_65    → english_pte_pte_core
--     english_pte_pte_academic_79    → english_pte_pte_home
--
--   Mandarin / GM:
--     mandarin_gm_hsk1               → mandarin_gm_level_1
--     mandarin_gm_hsk2               → mandarin_gm_level_2
--     mandarin_gm_hsk3               → mandarin_gm_level_3
--     mandarin_gm_hsk4               → mandarin_gm_level_4
--     mandarin_gm_hsk5               → mandarin_gm_level_5
--     mandarin_gm_hsk6               → mandarin_gm_level_6
--
--   Mandarin / TOCFL:
--     mandarin_tocfl_band_a          → mandarin_tocfl_a1
--     mandarin_tocfl_band_b          → mandarin_tocfl_b1
--     mandarin_tocfl_band_c          → mandarin_tocfl_c1
-- ============================================================

-- ── Helper: run the same rename across every content table ──────────────────

-- We use a DO block so we can loop; each UPDATE is idempotent.

DO $$
DECLARE
  mapping RECORD;
  content_tables TEXT[] := ARRAY['videos','materials','quiz_questions','progress','activity_log'];
  tbl TEXT;
BEGIN
  FOR mapping IN
    SELECT old_key, new_key FROM (VALUES
      -- English / GE
      ('english_get_beginner',          'english_get_starter'),

      -- English / IELTS
      ('english_ielts_band4',           'english_ielts_ac'),
      ('english_ielts_band5',           'english_ielts_ac'),
      ('english_ielts_band6',           'english_ielts_gt'),
      ('english_ielts_band7',           'english_ielts_ukvii'),
      ('english_ielts_band75',          'english_ielts_lifestyle'),

      -- English / PTE
      ('english_pte_pte_core',          'english_pte_pte_academic'),
      ('english_pte_pte_academic_50',   'english_pte_pte_academic_ukvii'),
      ('english_pte_pte_academic_65',   'english_pte_pte_core'),
      ('english_pte_pte_academic_79',   'english_pte_pte_home'),

      -- Mandarin / GM
      ('mandarin_gm_hsk1',              'mandarin_gm_level_1'),
      ('mandarin_gm_hsk2',              'mandarin_gm_level_2'),
      ('mandarin_gm_hsk3',              'mandarin_gm_level_3'),
      ('mandarin_gm_hsk4',              'mandarin_gm_level_4'),
      ('mandarin_gm_hsk5',              'mandarin_gm_level_5'),
      ('mandarin_gm_hsk6',              'mandarin_gm_level_6'),

      -- Mandarin / TOCFL
      ('mandarin_tocfl_band_a',         'mandarin_tocfl_a1'),
      ('mandarin_tocfl_band_b',         'mandarin_tocfl_b1'),
      ('mandarin_tocfl_band_c',         'mandarin_tocfl_c1')
    ) AS t(old_key, new_key)
  LOOP
    -- ── enrollments: unique constraint on (student_id, course_key) ──────────
    -- If the student already has the new key, just delete the old row.
    -- Otherwise rename it.
    DELETE FROM public.enrollments
    WHERE course_key = mapping.old_key
      AND student_id IN (
        SELECT student_id FROM public.enrollments
        WHERE course_key = mapping.new_key
      );

    UPDATE public.enrollments
    SET course_key = mapping.new_key
    WHERE course_key = mapping.old_key;

    -- ── content tables: plain rename (no unique constraint on course_key) ───
    FOREACH tbl IN ARRAY content_tables
    LOOP
      EXECUTE format(
        'UPDATE public.%I SET course_key = %L WHERE course_key = %L',
        tbl, mapping.new_key, mapping.old_key
      );
    END LOOP;
  END LOOP;
END;
$$;
