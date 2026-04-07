# Requirements Document

## Introduction

The platform currently supports a 3-level navigation hierarchy: Course → Subclass → Content Tab (Videos | Materials | Quiz). This feature overhauls the course navigation structure to introduce a 4-level hierarchy: Course → Subclass → Level → Content Tab. Mandarin gains three subclasses (GM, HSK, TOCFL) and Computer gains six subclasses (IOT, 3D Design, Web, Desktop, Mobile, Database). Each subclass exposes a set of named levels appropriate to that discipline. The routing, sidebar navigation, database schema, page components, and sample data must all be updated to reflect this new structure.

---

## Glossary

- **Course**: A top-level subject area — English, Mandarin, or Computer.
- **Subclass**: A specialisation within a Course (e.g. IELTS within English, HSK within Mandarin, Web within Computer).
- **Level**: A proficiency or progression tier within a Subclass (e.g. Band 5, HSK 3, Intermediate).
- **Content Tab**: One of three content types available within a Level — Videos, Materials, or Quiz.
- **Course_Key**: A composite string used as the database lookup key, formed as `{course}_{subclass}_{level}` (e.g. `english_GET_beginner`, `mandarin_HSK_hsk3`, `computer_web_intermediate`).
- **Navigation_Path**: The full URL route representing a user's position: `/{course}/{subclass}/{level}/{tab}`.
- **Sidebar**: The persistent left-hand navigation panel rendered by the Layout component.
- **Router**: The React Router configuration defined in `App.jsx`.
- **Schema**: The Supabase/PostgreSQL database schema defined in `supabase/schema.sql`.
- **CoursePage**: The React component that renders Videos, Materials, or Quiz content for a given Course_Key.
- **LevelSelector**: A new UI component that presents the available Levels for a chosen Subclass.

---

## Requirements

### Requirement 1: Subclass Structure

**User Story:** As a student, I want to see the correct subclasses for each course, so that I can navigate to the specialisation I am enrolled in.

#### Acceptance Criteria

1. THE Router SHALL define subclasses `GET`, `IELTS`, and `PTE` under the English course.
2. THE Router SHALL define subclasses `GM`, `HSK`, and `TOCFL` under the Mandarin course.
3. THE Router SHALL define subclasses `IOT`, `3D Design`, `Web`, `Desktop`, `Mobile`, and `Database` under the Computer course.
4. WHEN a student navigates to `/mandarin` without a subclass, THE Router SHALL redirect the student to `/mandarin/GM/hsk1/videos`.
5. WHEN a student navigates to `/computer` without a subclass, THE Router SHALL redirect the student to `/computer/IOT/beginner/videos`.
6. WHEN a student navigates to `/english` without a subclass, THE Router SHALL redirect the student to `/english/GET/beginner/videos`.

---

### Requirement 2: Level Tier

**User Story:** As a student, I want to choose a proficiency level within a subclass before accessing content, so that I receive material appropriate to my ability.

#### Acceptance Criteria

1. WHEN a student selects the English GET subclass, THE LevelSelector SHALL present the levels: `Beginner`, `Elementary`, `Pre-Intermediate`, `Intermediate`, `Upper-Intermediate`, `Advanced`.
2. WHEN a student selects the English IELTS subclass, THE LevelSelector SHALL present the levels: `Band 4`, `Band 5`, `Band 6`, `Band 7`, `Band 7.5+`.
3. WHEN a student selects the English PTE subclass, THE LevelSelector SHALL present the levels: `PTE Core`, `PTE Academic (50)`, `PTE Academic (65)`, `PTE Academic (79+)`.
4. WHEN a student selects the Mandarin GM subclass, THE LevelSelector SHALL present the levels: `HSK 1`, `HSK 2`, `HSK 3`, `HSK 4`, `HSK 5`, `HSK 6`.
5. WHEN a student selects the Mandarin HSK subclass, THE LevelSelector SHALL present the levels: `HSK 1`, `HSK 2`, `HSK 3`, `HSK 4`, `HSK 5`, `HSK 6`.
6. WHEN a student selects the Mandarin TOCFL subclass, THE LevelSelector SHALL present the levels: `Band A`, `Band B`, `Band C`.
7. WHEN a student selects any Computer subclass (IOT, 3D Design, Web, Desktop, Mobile, Database), THE LevelSelector SHALL present the levels: `Beginner`, `Intermediate`, `Advanced`.
8. WHEN a student has not yet selected a level, THE CoursePage SHALL NOT render Videos, Materials, or Quiz content.

---

### Requirement 3: Navigation Path

**User Story:** As a student, I want the URL to reflect my full position in the course hierarchy, so that I can bookmark or share a direct link to a specific level and content tab.

#### Acceptance Criteria

1. THE Router SHALL support the Navigation_Path pattern `/{course}/{subclass}/{level}/{tab}` for all courses.
2. WHEN a student navigates directly to a valid Navigation_Path URL, THE Router SHALL render the correct Course, Subclass, Level, and Content Tab without additional redirects.
3. WHEN a student navigates to a URL that omits the level or tab segment, THE Router SHALL redirect the student to the default level and `videos` tab for that subclass.
4. IF a student navigates to a Navigation_Path containing an unrecognised subclass or level, THEN THE Router SHALL redirect the student to the default Navigation_Path for that course.

---

### Requirement 4: Sidebar Navigation

**User Story:** As a student, I want the sidebar to reflect the full 4-level hierarchy, so that I can navigate between courses, subclasses, levels, and content tabs without leaving the sidebar.

#### Acceptance Criteria

1. THE Sidebar SHALL display each Course as a top-level expandable item.
2. WHEN a Course is expanded, THE Sidebar SHALL display all Subclasses for that Course as second-level items.
3. WHEN a Subclass is active (i.e. the current URL includes that subclass), THE Sidebar SHALL display all Levels for that Subclass as third-level items.
4. WHEN a Level is active, THE Sidebar SHALL display the three Content Tabs (Videos, Materials, Quiz) as fourth-level items.
5. THE Sidebar SHALL highlight the active Course, Subclass, Level, and Content Tab using a visually distinct style.
6. WHEN a student clicks a Subclass in the Sidebar, THE Sidebar SHALL navigate to the default level and `videos` tab for that Subclass.
7. WHEN a student clicks a Level in the Sidebar, THE Sidebar SHALL navigate to the `videos` tab for that Level.

---

### Requirement 5: Database Schema

**User Story:** As an administrator, I want the database schema to support the 4-level Course_Key format, so that content can be stored and retrieved per course, subclass, and level.

#### Acceptance Criteria

1. THE Schema SHALL use a `course_key` column of type `text` in the `videos`, `materials`, and `quiz_questions` tables to identify content at the Course → Subclass → Level granularity.
2. THE Schema SHALL use the Course_Key format `{course}_{subclass}_{level}` (all lowercase, spaces replaced with underscores) for all new content rows.
3. THE Schema SHALL retain existing indexes on `course_key` in the `videos`, `materials`, and `quiz_questions` tables.
4. THE Schema SHALL include at least one sample row per content type (video, material, quiz question) for each of the following Course_Keys: `english_GET_beginner`, `english_IELTS_band5`, `english_PTE_pte_academic_65`, `mandarin_GM_hsk1`, `mandarin_HSK_hsk1`, `mandarin_TOCFL_band_a`, `computer_web_beginner`, `computer_IOT_beginner`.
5. THE Schema SHALL update the `progress` table's `course_key` references to use the new 4-level Course_Key format so that progress is tracked at the Level granularity.

---

### Requirement 6: CoursePage Component

**User Story:** As a student, I want the content page to load the correct videos, materials, or quiz for my chosen course, subclass, and level, so that I only see content relevant to my selection.

#### Acceptance Criteria

1. WHEN a student reaches the content view, THE CoursePage SHALL derive the Course_Key from the URL parameters `course`, `subclass`, and `level`.
2. THE CoursePage SHALL pass the derived Course_Key to the `VideoList`, `MaterialsList`, and `QuizEngine` components.
3. WHEN the `tab` URL parameter is `videos`, THE CoursePage SHALL render the `VideoList` component.
4. WHEN the `tab` URL parameter is `materials`, THE CoursePage SHALL render the `MaterialsList` component.
5. WHEN the `tab` URL parameter is `quiz`, THE CoursePage SHALL render the `QuizEngine` component.

---

### Requirement 7: Home Page Course Cards

**User Story:** As a student, I want the home page course cards to reflect the new subclass structure, so that the descriptions are accurate and the navigation links are valid.

#### Acceptance Criteria

1. THE Home page SHALL display the Mandarin course card description as `GM · HSK · TOCFL`.
2. THE Home page SHALL display the Computer course card description as `IOT · 3D Design · Web · Desktop · Mobile · Database`.
3. WHEN a student clicks the Mandarin course card, THE Router SHALL navigate to `/mandarin/GM/hsk1/videos`.
4. WHEN a student clicks the Computer course card, THE Router SHALL navigate to `/computer/IOT/beginner/videos`.
5. WHEN a student clicks the English course card, THE Router SHALL navigate to `/english/GET/beginner/videos`.

---

### Requirement 8: Backward Compatibility and Redirects

**User Story:** As a student, I want old bookmarked URLs to redirect gracefully to the new structure, so that I do not encounter broken pages.

#### Acceptance Criteria

1. WHEN a student navigates to `/mandarin/videos`, `/mandarin/materials`, or `/mandarin/quiz`, THE Router SHALL redirect the student to the equivalent path under `/mandarin/GM/hsk1/{tab}`.
2. WHEN a student navigates to `/computer/videos`, `/computer/materials`, or `/computer/quiz`, THE Router SHALL redirect the student to the equivalent path under `/computer/IOT/beginner/{tab}`.
3. WHEN a student navigates to `/english/GET/videos`, `/english/IELTS/videos`, or `/english/PTE/videos` (old 3-level paths), THE Router SHALL redirect the student to the equivalent 4-level path with the default level for that subclass.
