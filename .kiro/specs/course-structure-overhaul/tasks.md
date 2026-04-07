# Implementation Plan: Course Structure Overhaul

## Overview

Introduce a uniform 4-level navigation hierarchy (Course → Subclass → Level → Content Tab) across the platform. A single `COURSE_CONFIG` object becomes the authoritative source of truth; routing, sidebar, level selector, database keys, and the home page all derive from it.

## Tasks

- [x] 1. Create `src/lib/courseConfig.js` — single source of truth
  - Export `COURSE_CONFIG` constant with all courses, subclasses, and levels exactly as specified in the design
  - Export `buildCourseKey(course, subclass, level)` — returns `${course}_${subclass}_${level}`.toLowerCase()
  - Export `defaultPath(course)` — returns `/{course}/{defaultSubclass}/{defaultLevel}/videos`
  - Export `defaultSubclassPath(course, subclass)` — returns `/{course}/{subclass}/{defaultLevel}/videos`
  - Include the `computerLevels()` helper for the six Computer subclasses
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 5.2, 6.1_

  - [ ]* 1.1 Write property test for `buildCourseKey` — Property 1: course_key format invariant
    - **Property 1: course_key format invariant**
    - Generate all (course, subclass, level) triples from COURSE_CONFIG using `fc.constantFrom`
    - Assert result is all-lowercase, contains no spaces, and has at least 3 underscore-separated segments
    - **Validates: Requirements 5.2, 6.1**

- [x] 2. Update `supabase/schema.sql` — new course_key format and sample data
  - Update the comment block on `videos`, `materials`, and `quiz_questions` tables to show the new 3-segment `course_key` format
  - Replace all existing `INSERT` sample data rows with rows using the new `{course}_{subclass}_{level}` keys
  - Include at least one video, one material, and one quiz question for each of the 8 required course_keys: `english_GET_beginner`, `english_IELTS_band5`, `english_PTE_pte_academic_65`, `mandarin_GM_hsk1`, `mandarin_HSK_hsk1`, `mandarin_TOCFL_band_a`, `computer_web_beginner`, `computer_IOT_beginner`
  - Retain all existing indexes (`videos_course_key_idx`, `materials_course_key_idx`, `quiz_questions_course_key_idx`)
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 3. Create `src/components/LevelSelector.jsx` — pill buttons for level selection
  - Accept props: `levels` (array of `{ key, label }`), `activeLevel` (string), `basePath` (string)
  - Render one pill button per level in config order; clicking navigates to `{basePath}/{level.key}/videos`
  - Apply active styling matching the existing pill style from `English/index.jsx`
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

  - [ ]* 3.1 Write property test for `LevelSelector` — Property 2: LevelSelector renders config-defined levels
    - **Property 2: LevelSelector renders config-defined levels**
    - For each subclass entry in COURSE_CONFIG, render `<LevelSelector>` and assert button count equals `levels.length` and labels match in order
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7**

- [x] 4. Create `src/pages/CourseShell.jsx` — generic shell replacing the 3 per-course index files
  - Read `:course` from URL params; look up `COURSE_CONFIG[course]`
  - If course is unknown, redirect to `/`
  - Read `:subclass` from URL params; if missing or unknown, redirect to `defaultPath(course)`
  - Read `:level` from URL params; if missing or unknown, redirect to `defaultSubclassPath(course, subclass)`
  - Render `CourseHeader` containing: `PageHeader` (title = course label, breadcrumb = `Courses › {label}`), subclass pill buttons (navigate to `defaultSubclassPath` on click), `LevelSelector` for the active subclass's levels, and `Tabs` with `basePath="/{course}/{subclass}/{level}"`
  - Render `<Outlet />` below `CourseHeader` for the content area
  - _Requirements: 1.4, 1.5, 1.6, 2.8, 3.1, 3.2, 3.3, 3.4_

- [x] 5. Update `src/App.jsx` — uniform routing and backward-compat redirects
  - Remove imports for `EnglishSection`, `MandarinSection`, `ComputerSection`
  - Import `CourseShell`
  - Replace the three per-course route blocks with a single `<Route path=":course" element={<CourseShell />}>` containing `<Route path=":subclass/:level/:tab" element={<CoursePage />} />`
  - Add backward-compat `<Route>` entries with `<Navigate>` for the old URL patterns:
    - `/mandarin/:tab` → `/mandarin/GM/hsk1/:tab`
    - `/computer/:tab` → `/computer/IOT/beginner/:tab`
    - `/english/:subclass/:tab` (3-level, no level segment) → `/english/:subclass/{defaultLevel}/:tab`
  - _Requirements: 1.4, 1.5, 1.6, 3.1, 8.1, 8.2, 8.3_

  - [ ]* 5.1 Write property test for valid navigation paths — Property 4: Valid navigation paths render without redirect
    - **Property 4: Valid navigation paths render without redirect**
    - For all valid (course, subclass, level, tab) tuples from COURSE_CONFIG, render `App` with `MemoryRouter` and assert `location.pathname` is unchanged after render
    - **Validates: Requirements 3.1, 3.2**

  - [ ]* 5.2 Write property test for missing level/tab redirect — Property 5: Missing level/tab triggers redirect to default
    - **Property 5: Missing level/tab triggers redirect to default**
    - For each (course, subclass, defaultLevel) from COURSE_CONFIG, render `App` at `/{course}/{subclass}` and assert final location is `/{course}/{subclass}/{defaultLevel}/videos`
    - **Validates: Requirements 3.3**

  - [ ]* 5.3 Write property test for backward-compat redirects — Property 6: Backward-compatible tab redirects preserve tab segment
    - **Property 6: Backward-compatible tab redirects preserve tab segment**
    - For each tab in `[videos, materials, quiz]`, render `App` at old-format URLs (`/mandarin/{tab}`, `/computer/{tab}`, `/english/GET/{tab}`) and assert the tab segment is preserved in the redirected URL
    - **Validates: Requirements 8.1, 8.2, 8.3**

- [x] 6. Update `src/pages/CoursePage.jsx` — derive course_key from URL params
  - Remove the `course` prop; read `course`, `subclass`, `level`, `tab` from `useParams()`
  - Derive `courseKey = buildCourseKey(course, subclass, level)` (import from `courseConfig.js`)
  - Render `VideoList`, `MaterialsList`, or `QuizEngine` based on `tab`; render nothing if `tab` is unrecognised
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ]* 6.1 Write property test for CoursePage course_key derivation — Property 3: CoursePage passes correct course_key to child
    - **Property 3: CoursePage passes correct course_key to child**
    - For all valid (course, subclass, level, tab) tuples, render `CoursePage` with mocked `VideoList`/`MaterialsList`/`QuizEngine` and assert the `courseKey` prop equals `buildCourseKey(course, subclass, level)`
    - **Validates: Requirements 6.1, 6.2**

- [x] 7. Update `src/components/Layout.jsx` — 4-level sidebar driven by COURSE_CONFIG
  - Import `COURSE_CONFIG`, `defaultPath`, `defaultSubclassPath` from `courseConfig.js`
  - Remove hardcoded `ENGLISH_SECTIONS`, `SUB_TABS`, and per-course nav blocks
  - Render courses dynamically from `Object.entries(COURSE_CONFIG)`:
    - Level 1 (navItem): course label + chevron; click navigates to `defaultPath(course)`
    - Level 2 (subItem): subclass labels; shown when course is expanded; click navigates to `defaultSubclassPath(course, subclass)`
    - Level 3 (subSubItem): level labels; shown when subclass is active in current URL
    - Level 4 (tabItem): Videos / Materials / Quiz links; shown when level is active in current URL
  - Add `.tabItem` CSS class to `Layout.module.css` with `padding-left: 62px` and matching hover/active styles
  - Preserve existing mobile hamburger, overlay, and footer behaviour
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

- [x] 8. Update `src/pages/Home.jsx` — updated course card descriptions and navigation paths
  - Change Mandarin card `desc` to `GM · HSK · TOCFL` and `path` to `/mandarin/GM/hsk1/videos`
  - Change Computer card `desc` to `IOT · 3D Design · Web · Desktop · Mobile · Database` and `path` to `/computer/IOT/beginner/videos`
  - Change English card `path` to `/english/GET/beginner/videos`
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 9. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Delete obsolete per-course index files
  - Delete `src/pages/English/index.jsx`, `src/pages/Mandarin/index.jsx`, `src/pages/Computer/index.jsx`
  - Verify no remaining imports reference these files
  - _Requirements: 3.1, 3.2_

- [x] 11. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Property tests use **fast-check** (`fc`) — install with `npm install --save-dev fast-check` if not already present
- Each property test references the property number and requirements clause from the design document
- `CourseShell` replaces all three per-course index files; task 10 removes them only after the shell is wired up
- The `course_key` column type (`text`) in Supabase already supports the new 3-segment format — no `ALTER TABLE` is needed
