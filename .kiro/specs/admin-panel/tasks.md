# Implementation Plan: Admin Panel

## Overview

Build a protected `/admin` section with its own layout, sidebar, and CRUD pages for managing videos, materials, quiz questions, and student accounts. Foundation layers (schema → auth → guard → layout → routing) must be in place before any admin page is built.

## Tasks

- [x] 1. Schema changes in `supabase/schema.sql`
  - Add `is_active boolean NOT NULL DEFAULT true` column to `profiles` table
  - Update the `role` check constraint to allow `'deactivated'` or keep role clean (per design, deactivation uses `is_active`)
  - Add RLS policy "Admin write videos": admins can INSERT/UPDATE/DELETE on `videos`
  - Add RLS policy "Admin write materials": admins can INSERT/UPDATE/DELETE on `materials`
  - Add RLS policy "Admin write quiz_questions": admins can INSERT/UPDATE/DELETE on `quiz_questions`
  - Add RLS policy "Admin update profiles": admins can UPDATE any row in `profiles`
  - Drop and recreate policies with `IF EXISTS` guards so the file is idempotent
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 2. Extend `AuthContext` to expose `profile` with `role` and `is_active`
  - Add `profile` state (`{ role, is_active }`) to `AuthProvider`
  - Add `fetchProfile(userId)` helper that queries `profiles` and calls `signOut()` if `is_active === false`
  - Call `fetchProfile` after the initial `getSession` resolves
  - Call `fetchProfile` inside `onAuthStateChange` on every `SIGNED_IN` event
  - Expose `profile` in the context value alongside `user`, `loading`, `signIn`, `signOut`
  - _Requirements: 1.4, 1.5_

- [x] 3. Create `AdminGuard` component
  - Create `src/components/admin/AdminGuard.jsx`
  - Read `user`, `loading`, and `profile` from `useAuth()`
  - While loading → render a centered loading spinner (reuse `--color-text-3` token)
  - If no `user` → `<Navigate to="/login" replace />`
  - If `profile.role !== 'admin'` or `profile.is_active === false` → `<Navigate to="/" replace />`
  - Otherwise → render `children`
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ]* 3.1 Write unit tests for `AdminGuard`
    - Test redirect to `/login` for unauthenticated user
    - Test redirect to `/` for student-role user
    - Test redirect to `/` for deactivated admin (`is_active = false`)
    - Test renders children for valid admin user
    - _Requirements: 1.1, 1.2, 1.3_

- [x] 4. Create `AdminLayout` component and CSS module
  - Create `src/components/admin/AdminLayout.jsx` and `src/components/admin/AdminLayout.module.css`
  - Sidebar nav links: Dashboard (`/admin`), Videos (`/admin/videos`), Materials (`/admin/materials`), Quiz Questions (`/admin/quiz`), Students (`/admin/students`)
  - Use inline SVG icons (grid, play, document, question-mark, users)
  - Sidebar footer: admin display name from `useAuth().user`, "Admin" role badge, sign-out button that calls `signOut()` then navigates to `/login`
  - Mobile hamburger button toggles sidebar overlay (same pattern as `Layout.jsx`)
  - Visual distinction: sidebar background uses `--color-accent` tint with white active-item text; add "ADMIN" section label at top of nav
  - Render `<Outlet />` in the main content area
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ]* 4.1 Write unit test for `AdminLayout`
    - Assert all 5 nav links are rendered
    - _Requirements: 2.1_

- [x] 5. Wire admin routes in `App.jsx`
  - Import `AdminGuard`, `AdminLayout`, and all five admin page components (stubs are fine at this stage)
  - Add a `/admin` route wrapped in `<AdminGuard>` that renders `<AdminLayout>` as the outlet shell
  - Nest child routes: index → `AdminDashboard`, `videos` → `AdminVideos`, `materials` → `AdminMaterials`, `quiz` → `AdminQuiz`, `students` → `AdminStudents`
  - Ensure the existing student routes are unaffected
  - _Requirements: 1.1, 1.2, 1.3, 2.1_

- [x] 6. Create `CourseKeySelector` reusable component
  - Create `src/components/admin/CourseKeySelector.jsx`
  - Props: `value: string | null`, `onChange: (courseKey: string) => void`
  - Three cascading `<select>` elements: Course → Subclass → Level, derived from `COURSE_CONFIG`
  - Selecting a new course resets subclass to the course's `defaultSubclass` and level to that subclass's `defaultLevel`
  - When all three are selected, call `onChange(buildCourseKey(course, subclass, level))`
  - Parse `value` back into the three segments on mount/update so the selects reflect the current `course_key`
  - _Requirements: 4.2, 5.1, 6.1_

  - [ ]* 6.1 Write unit test for `CourseKeySelector`
    - Test that selecting a new course resets subclass and level dropdowns
    - Test that `onChange` is called with the correct `course_key` string
    - _Requirements: 4.2_

- [x] 7. Implement `AdminDashboard` page
  - Create `src/pages/admin/AdminDashboard.jsx`
  - On mount, run four parallel `count` queries: `videos`, `materials`, `quiz_questions`, and `profiles` (where `role = 'student'`)
  - Display four stat cards: "Videos", "Materials", "Quiz Questions", "Students" with their counts
  - Show a loading state while fetching; show an error banner if any query fails
  - _Requirements: 3.1, 3.2_

- [x] 8. Implement `AdminVideos` page (CRUD)
  - Create `src/pages/admin/AdminVideos.jsx`
  - Extract pure validator: `validateEmbedUrl(url)` → `{ valid: boolean, error?: string }` — returns invalid if URL does not start with `https://www.youtube.com/embed/`
  - `CourseKeySelector` at top; fetch and display videos filtered by selected `course_key`
  - Add Video inline form: title (required), embed URL (validated), duration label, difficulty, sort order; on submit insert row and refresh list
  - Edit: clicking Edit populates the same form fields with the record's current values
  - Delete: clicking Delete shows a `window.confirm`; on confirm, delete row and remove from list
  - Show inline error banner (`--color-danger-bg`) on any Supabase failure
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

  - [ ]* 8.1 Write property test for YouTube URL validator (Property 1)
    - **Property 1: YouTube URL validation rejects all non-embed URLs**
    - For any string not starting with `https://www.youtube.com/embed/`, `validateEmbedUrl` must return `valid === false`
    - **Validates: Requirements 4.4**

  - [ ]* 8.2 Write property test for edit form population (Property 2)
    - **Property 2: Edit form population preserves record data**
    - For any arbitrary video record, opening the edit form must populate every field with the exact record value
    - **Validates: Requirements 4.5**

- [x] 9. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Implement `AdminMaterials` page (CRUD + file upload)
  - Create `src/pages/admin/AdminMaterials.jsx`
  - Extract pure validators: `validateFile(file)` → `{ valid: boolean, error?: string }` — rejects non-PDF MIME type and files > 20 MB
  - `CourseKeySelector` at top; fetch and display materials filtered by selected `course_key`
  - Add Material form: title (required), PDF file input (validated before upload), sort order; on submit upload to `materials/{course_key}/{filename}` in Supabase Storage, then insert row with the public URL
  - Edit: title and sort order only (no re-upload); on submit update the row
  - Delete: `window.confirm`; delete file from Storage then delete DB row; show appropriate error/warning per the error-handling table in the design
  - Show inline error banner on any failure
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

  - [ ]* 10.1 Write property test for MIME type validator (Property 3)
    - **Property 3: File MIME type validation rejects non-PDF files**
    - For any MIME type string that is not `application/pdf`, `validateFile` must return `valid === false`
    - **Validates: Requirements 5.3**

  - [ ]* 10.2 Write property test for file size validator (Property 4)
    - **Property 4: File size validation rejects oversized files**
    - For any file size > 20 × 1024 × 1024 bytes, `validateFile` must return `valid === false`
    - **Validates: Requirements 5.4**

- [x] 11. Implement `AdminQuiz` page (CRUD)
  - Create `src/pages/admin/AdminQuiz.jsx`
  - Extract pure validators: `validateQuestion(q)` and `validateAnswerIndex(idx)`
    - `validateQuestion`: invalid if question text is empty or fewer than 4 non-empty options
    - `validateAnswerIndex`: invalid if value is not an integer in {0, 1, 2, 3}
  - `CourseKeySelector` at top; fetch and display quiz questions filtered by selected `course_key`
  - Add Question form: question text, four option inputs, correct answer index (0–3), explanation, sort order; validate before submit; insert row on success
  - Edit: populate all fields from the record; validate before submit; update row on success
  - Delete: `window.confirm`; delete row and remove from list
  - Show inline error banner on any failure
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8_

  - [ ]* 11.1 Write property test for quiz question validator (Property 5)
    - **Property 5: Quiz question form validation rejects incomplete questions**
    - For any submission with empty question text or fewer than 4 non-empty options, `validateQuestion` must return `valid === false`
    - **Validates: Requirements 6.3**

  - [ ]* 11.2 Write property test for answer index validator (Property 6)
    - **Property 6: Answer index validation rejects out-of-range values**
    - For any integer not in {0, 1, 2, 3}, `validateAnswerIndex` must return `valid === false`
    - **Validates: Requirements 6.4**

  - [ ]* 11.3 Write property test for edit form population — quiz (Property 2, quiz variant)
    - **Property 2 (quiz): Edit form population preserves record data**
    - For any arbitrary quiz question record, opening the edit form must populate every field with the exact record value
    - **Validates: Requirements 6.5**

- [x] 12. Implement `AdminStudents` page (list + create + deactivate/reactivate)
  - Create `src/pages/admin/AdminStudents.jsx`
  - Extract pure function: `filterStudents(students, query)` — returns students whose `full_name` or `email` contains `query` (case-insensitive)
  - On mount, fetch all profiles where `role IN ('student', 'deactivated')`; display paginated list (20 per page) with columns: full name, email, role badge, created date, actions
  - Search input filters the list client-side using `filterStudents`
  - Create Student form: email (required), password (required), full name; on submit invoke `supabase.functions.invoke('create-student', { body: { email, password, fullName } })`; handle duplicate-email error
  - Deactivate: `window.confirm`; update `profiles.is_active = false` for the student row; reflect change in list
  - Reactivate: `window.confirm`; update `profiles.is_active = true`; reflect change in list
  - Show inline error banner on any failure
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

  - [ ]* 12.1 Write property test for student search filter (Property 7)
    - **Property 7: Student search filter correctness**
    - For any list of student profiles and any non-empty query, every result must contain the query in `full_name` or `email` (case-insensitive), and no matching profile is omitted
    - **Validates: Requirements 7.2**

  - [ ]* 12.2 Write property test for error message display (Property 8)
    - **Property 8: Error messages surface Supabase error text**
    - For any failed Supabase operation returning `{ message }`, the rendered error banner must contain that message string
    - **Validates: Requirements 4.8, 5.7, 6.8, 7.7**

- [x] 13. Create Supabase Edge Function `create-student`
  - Create `supabase/functions/create-student/index.ts`
  - Validate that `email` and `password` are present in the request body; return `400` with `{ error }` if missing
  - Instantiate an admin Supabase client using `SUPABASE_URL` and `SERVICE_ROLE_KEY` env vars
  - Call `adminClient.auth.admin.createUser({ email, password, user_metadata: { full_name: fullName }, email_confirm: true })`
  - Return `{ userId }` on success or `{ error: error.message }` on failure with appropriate HTTP status
  - _Requirements: 7.3, 7.4_

- [x] 14. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Pure validator functions (`validateEmbedUrl`, `validateFile`, `validateQuestion`, `validateAnswerIndex`, `filterStudents`) should be extracted into `src/lib/adminValidators.js` so they are easily importable by both pages and tests
- Property tests use [fast-check](https://github.com/dubzzz/fast-check); tag each test with `// Feature: admin-panel, Property N: <property text>`
- The Edge Function requires `supabase functions serve` locally and `supabase functions deploy create-student` for production
