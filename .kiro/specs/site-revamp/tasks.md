# Implementation Plan: Site Revamp

## Overview

Modernise the Erudite English platform's visual design by expanding the CSS token system, updating component styles to reference those tokens, adding responsive sidebar behaviour, and polishing interactive states. All changes are purely presentational — no routing, data-fetching, or auth logic is modified.

Testing uses Vitest + React Testing Library for unit/example tests and fast-check for property-based tests.

## Tasks

- [x] 1. Expand design token layer in `src/index.css`
  - Replace the existing `:root` block with the full token set from the design: all `--color-*`, `--font-size-*`, `--line-height-body`, `--space-*`, and `--radius-*` tokens
  - Change `--color-accent` from `#1a1918` to `#2563eb` and add `--color-accent-hover: #1d4ed8`
  - Add `--color-surface-2: #f0efec` and update `--color-bg` to `#f5f4f1`
  - Add global `:focus-visible` rule: `outline: 2px solid var(--color-accent); outline-offset: 2px`
  - Add `line-height: var(--line-height-body)` to `p` and `li` selectors
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.4, 3.1, 3.5, 11.4_

  - [ ]* 1.1 Write design token smoke tests
    - Verify all required `--color-*`, `--radius-*`, `--space-*`, and `--font-size-*` tokens are present in the `:root` CSS text
    - Verify `--color-bg` and `--color-surface` have different values
    - Verify `--sidebar-width` is `230px`
    - Verify `--color-accent` is `#2563eb` (not the old near-black)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1_

- [x] 2. Update `Layout.module.css` — accent active states, avatar, and micro-interactions
  - Change `.active` and `.subActive` background to use `--color-surface-2` and add a `3px` left border using `--color-accent` as the active indicator
  - Change `.subSubActive` colour to `--color-text` with a subtle `--color-accent` left border
  - Update `.avatar` background from `--color-surface-2` to `--color-accent` and set `color: var(--color-accent-fg)`
  - Ensure `.navItem`, `.subItem`, `.subSubItem` all have `transition: background 0.15s ease, color 0.15s ease, transform 0.05s ease`
  - Ensure `.navItem:active` has `transform: scale(0.98)`
  - _Requirements: 2.3, 4.3, 4.5, 11.1, 11.3_

- [x] 3. Add responsive sidebar to `Layout.jsx` and `Layout.module.css`
  - Add `isSidebarOpen` state (default `false`) to `Layout`
  - Add a hamburger `<button>` inside `<main>` that is only visible on mobile (≤768px) — toggles `isSidebarOpen`
  - Apply a `.sidebarOpen` CSS class to `<aside>` when `isSidebarOpen` is true
  - In `Layout.module.css`, add a `@media (max-width: 768px)` block: sidebar `position: fixed`, `transform: translateX(-100%)` by default, `translateX(0)` when `.sidebarOpen`; add a semi-transparent `.overlay` div that closes the sidebar on click
  - Close the sidebar when a nav item is clicked on mobile (call `setIsSidebarOpen(false)` in nav item `onClick` handlers)
  - _Requirements: 4.8, 10.1, 10.2_

- [x] 4. Update `Tabs.jsx` — accent active tab indicator
  - Change `tabActive` style: set `borderBottom: '2px solid var(--color-accent)'` and `color: 'var(--color-text)'`
  - _Requirements: 2.3, 7.3_

  - [ ]* 4.1 Write property test for tab bar completeness (Property 4)
    - // Feature: site-revamp, Property 4: Tab bar completeness
    - Generator: arbitrary `basePath` string; render `Tabs` with the standard 3-tab config `[{key:'videos',...},{key:'materials',...},{key:'quiz',...}]`
    - Assertion: rendered output contains exactly the text "Videos", "Materials", "Quiz" in that order
    - **Property 4: Tab bar completeness**
    - **Validates: Requirements 7.2**

- [x] 5. Update `src/pages/Home.jsx` — card hover state and token usage
  - Add `hoveredCard` state; attach `onMouseEnter`/`onMouseLeave` handlers to each course card `div`
  - When a card is hovered apply `boxShadow: '0 4px 16px rgba(0,0,0,0.10)'` and `borderColor: 'var(--color-border-strong)'`
  - Ensure `progressFill` uses `background: 'var(--color-accent)'`
  - _Requirements: 5.3, 5.5, 5.6, 11.1, 11.2_

  - [ ]* 5.1 Write property test for greeting correctness (Property 1)
    - // Feature: site-revamp, Property 1: Greeting correctness
    - Generator: arbitrary non-empty string (user name) × integer in [0, 23] (hour)
    - Assertion: rendered banner contains the name and the correct salutation ("Good morning" 0–11, "Good afternoon" 12–16, "Good evening" 17–23)
    - **Property 1: Greeting correctness**
    - **Validates: Requirements 5.1**

  - [ ]* 5.2 Write property test for course grid completeness (Property 2)
    - // Feature: site-revamp, Property 2: Course grid completeness
    - Generator: array of 1–10 course objects with arbitrary icon, title, desc, progress integer [0,100]
    - Assertion: rendered grid has exactly `courses.length` cards; each card contains the course's title and progress percentage label
    - **Property 2: Course grid completeness**
    - **Validates: Requirements 5.2**

  - [ ]* 5.3 Write property test for progress bar proportionality — Home cards (Property 3)
    - // Feature: site-revamp, Property 3: Progress bar proportionality
    - Generator: integer in [0, 100]
    - Assertion: the fill element's `width` style equals `${value}%`
    - **Property 3: Progress bar proportionality**
    - **Validates: Requirements 5.5**

- [x] 6. Checkpoint — verify token and layout changes
  - Ensure all tests written so far pass, ask the user if questions arise.

- [x] 7. Update `src/pages/LoginPage.jsx` — brand name and token usage
  - Change brand name from `"EduLearn"` to `"Erudite English"`
  - Update `errorBox` style to use `background: 'var(--color-danger-bg)'` and `color: 'var(--color-danger)'` instead of hardcoded hex values
  - Add `onMouseEnter`/`onMouseLeave` handlers to the submit button to toggle `opacity: 0.88` hover state
  - Add inline `onFocus`/`onBlur` handlers to both inputs to toggle `borderColor: 'var(--color-accent)'` on focus
  - _Requirements: 6.1, 6.4, 6.5, 11.2_

  - [ ]* 7.1 Write unit tests for LoginPage
    - Verify brand name "Erudite English" is rendered
    - Verify heading and subtitle are present
    - Verify email and password fields with labels are rendered
    - Verify error box appears when auth fails (mock `signIn` to throw)
    - Verify submit button is disabled and shows "Signing in…" while loading
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 8. Update `src/components/QuizEngine.jsx` — token-based answer styles and progress bar
  - Replace hardcoded hex values in `correct` and `wrong` style objects with token variables:
    - `correct`: `border: '1px solid var(--color-success)'`, `background: 'var(--color-success-bg)'`, `color: 'var(--color-success)'`
    - `wrong`: `border: '1px solid var(--color-danger)'`, `background: 'var(--color-danger-bg)'`, `color: 'var(--color-danger)'`
  - Confirm `progressFill` already uses `var(--color-accent)` (no change needed if so)
  - _Requirements: 9.2, 9.4_

  - [ ]* 8.1 Write property test for quiz progress indicator accuracy (Property 6)
    - // Feature: site-revamp, Property 6: Quiz progress indicator accuracy
    - Generator: integer `n` in [1, 20] × integer `i` in [0, n-1]
    - Assertion: progress text equals `Question ${i+1} of ${n}`
    - **Property 6: Quiz progress indicator accuracy**
    - **Validates: Requirements 9.1**

  - [ ]* 8.2 Write property test for answer option letter badges (Property 7)
    - // Feature: site-revamp, Property 7: Answer option letter badges
    - Generator: array of 1–4 arbitrary option strings
    - Assertion: each rendered option row contains the correct sequential letter badge (A, B, C, D)
    - **Property 7: Answer option letter badges**
    - **Validates: Requirements 9.3**

  - [ ]* 8.3 Write property test for answer selection highlighting (Property 8)
    - // Feature: site-revamp, Property 8: Answer selection highlighting
    - Generator: question with 2–4 options × correct answer index × selected answer index
    - Assertion: correct option always has success styles; if selected ≠ correct, selected option has danger styles
    - **Property 8: Answer selection highlighting**
    - **Validates: Requirements 9.4**

  - [ ]* 8.4 Write property test for progress bar proportionality — QuizEngine (Property 3)
    - // Feature: site-revamp, Property 3: Progress bar proportionality (quiz)
    - Generator: integer `n` in [1, 20] × integer `i` in [0, n-1]
    - Assertion: fill element `width` style equals `${Math.round(((i+1)/n)*100)}%` (or the exact formula used in the component)
    - **Property 3: Progress bar proportionality**
    - **Validates: Requirements 9.2**

- [x] 9. Update `src/components/VideoList.jsx` — token-based active border and field completeness
  - Confirm `cardActive` style uses `borderColor: 'var(--color-accent)'` (already present; verify it picks up the new blue token value automatically)
  - Ensure the `thumb` placeholder element is always rendered for every video card (already present; verify no conditional rendering)
  - Ensure `meta` renders both `duration_label` and `difficulty` separated by ` · `
  - _Requirements: 8.1, 8.3_

  - [ ]* 9.1 Write property test for video card field completeness (Property 5)
    - // Feature: site-revamp, Property 5: Video card field completeness
    - Generator: arbitrary video object `{ title: string, duration_label: string, difficulty: string }`
    - Assertion: rendered card contains title text, duration text, difficulty text, and a thumbnail placeholder element
    - **Property 5: Video card field completeness**
    - **Validates: Requirements 8.1**

- [x] 10. Final checkpoint — all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use fast-check with a minimum of 100 iterations; tag each test with `// Feature: site-revamp, Property N: ...`
- Install test dependencies before running tests: `npm install -D vitest @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom jsdom fast-check`
- Run tests with: `npx vitest --run`
