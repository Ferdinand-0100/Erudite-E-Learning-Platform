# Requirements Document

## Introduction

This document covers the UI/UX redesign of the Erudite English e-learning platform — a React-based web application where students access tutorial videos, take quizzes, and download course materials across three courses (English, Mandarin, Computer). The revamp aims to modernise the visual design, improve visual hierarchy, introduce a consistent colour system, and enhance the overall learning experience without altering existing functionality.

## Glossary

- **Platform**: The Erudite English React web application.
- **Student**: An authenticated user of the Platform.
- **Sidebar**: The fixed left-hand navigation panel containing course links and the user footer.
- **Home_Page**: The dashboard page shown after login, displaying course cards and recent activity.
- **Course_Page**: A page displaying Videos, Materials, or Quiz content for a given course section.
- **Login_Page**: The unauthenticated entry page where Students sign in.
- **Design_System**: The shared set of CSS custom properties (tokens), typography rules, spacing scale, and component styles that govern the visual appearance of the Platform.
- **Color_Token**: A CSS custom property defined in `:root` that represents a named colour value used throughout the Platform.
- **Accent_Color**: The primary interactive colour used for buttons, active states, progress fills, and focus rings.
- **Card**: A visually bounded surface element used to display course, video, or activity information.
- **Tab_Bar**: The horizontal navigation strip used to switch between Videos, Materials, and Quiz within a course section.
- **Progress_Bar**: A horizontal bar indicating a Student's completion percentage for a course or quiz.
- **Quiz_Engine**: The component that presents questions, captures answers, and displays results.
- **Page_Header**: The component displaying a page title and optional breadcrumb.
- **Avatar**: The circular element in the Sidebar footer displaying the Student's initials.

---

## Requirements

### Requirement 1: Design System Tokens

**User Story:** As a developer, I want a centralised set of design tokens, so that all visual styles are consistent and easy to update globally.

#### Acceptance Criteria

1. THE Design_System SHALL define Color_Tokens for background, surface, border, text, accent, success, and danger states in the `:root` CSS block.
2. THE Design_System SHALL define a typographic scale with at least three font-size tokens (small: 12px, base: 14px, large: 16px).
3. THE Design_System SHALL define a spacing scale with tokens for 4px, 8px, 12px, 16px, 24px, and 32px increments.
4. THE Design_System SHALL define border-radius tokens for small (6px), medium (10px), and large (14px) values.
5. WHEN a Color_Token value is changed in `:root`, THE Platform SHALL reflect that change across all components that reference the token without requiring per-component edits.

---

### Requirement 2: Colour Palette and Theme

**User Story:** As a student, I want a visually appealing colour scheme, so that the platform feels modern and is pleasant to use for extended study sessions.

#### Acceptance Criteria

1. THE Design_System SHALL define an Accent_Color that is distinct from neutral greys and provides sufficient contrast against white surfaces (minimum 4.5:1 contrast ratio against `#ffffff`).
2. THE Design_System SHALL define a light-mode colour palette as the default theme.
3. WHEN the Platform renders any interactive element (button, nav item, tab), THE Platform SHALL apply the Accent_Color to the active or focused state of that element.
4. THE Design_System SHALL define a `--color-bg` token that is visually distinct from `--color-surface` to create depth between the page background and Card surfaces.

---

### Requirement 3: Typography

**User Story:** As a student, I want clear, readable text throughout the platform, so that I can consume course content without eye strain.

#### Acceptance Criteria

1. THE Platform SHALL use a single primary font family applied globally via the `:root` font-family declaration.
2. THE Platform SHALL render page titles (h1) at a minimum font size of 22px with a font-weight of 600.
3. THE Platform SHALL render body and list text at a minimum font size of 14px.
4. THE Platform SHALL render secondary metadata (timestamps, labels, breadcrumbs) at a minimum font size of 11px with a muted text colour token.
5. THE Platform SHALL apply a line-height of at least 1.5 to paragraph and list text to ensure readability.

---

### Requirement 4: Sidebar Navigation

**User Story:** As a student, I want a clear and well-structured sidebar, so that I can navigate between courses and sections quickly.

#### Acceptance Criteria

1. THE Sidebar SHALL display the platform logo/name and a subtitle at the top, separated from the navigation by a visible border.
2. THE Sidebar SHALL render each top-level course link with an icon, a label, and a chevron indicator for expandable sub-menus.
3. WHEN a course link is active, THE Sidebar SHALL apply a visually distinct background and text colour to that nav item using Design_System tokens.
4. WHEN a sub-menu is expanded, THE Sidebar SHALL render sub-items indented relative to their parent item.
5. WHEN a sub-item is active, THE Sidebar SHALL apply a visually distinct style to that sub-item.
6. THE Sidebar SHALL display the Student's Avatar, display name, and role label in a footer section at the bottom.
7. THE Sidebar SHALL display a sign-out control in the footer that is visually accessible but does not dominate the footer layout.
8. WHILE the Sidebar is rendered, THE Sidebar SHALL maintain a fixed width of 230px and remain visible during vertical scrolling of the main content area.

---

### Requirement 5: Home Page Dashboard

**User Story:** As a student, I want an informative and visually engaging home page, so that I can quickly see my progress and resume learning.

#### Acceptance Criteria

1. THE Home_Page SHALL display a personalised greeting banner with the Student's name and a contextual time-of-day greeting.
2. THE Home_Page SHALL display a course grid with one Card per enrolled course, showing the course icon, title, description, Progress_Bar, and completion percentage.
3. WHEN a Student clicks a course Card, THE Home_Page SHALL navigate the Student to that course's default tab.
4. THE Home_Page SHALL display a recent activity list showing at minimum the three most recent learning events with an icon, description, course label, and relative timestamp.
5. THE Progress_Bar on each course Card SHALL visually fill proportionally to the course completion percentage using the Accent_Color.
6. WHEN a Student hovers over a course Card, THE Home_Page SHALL apply a visible hover state (border colour change or shadow elevation) to that Card.

---

### Requirement 6: Login Page

**User Story:** As a student, I want a clean and trustworthy login page, so that I feel confident entering my credentials.

#### Acceptance Criteria

1. THE Login_Page SHALL display the platform brand name above the sign-in form.
2. THE Login_Page SHALL display a heading and a short descriptive subtitle above the form fields.
3. THE Login_Page SHALL render email and password input fields with visible labels and placeholder text.
4. IF a sign-in attempt fails, THEN THE Login_Page SHALL display an error message in a visually distinct error container using the danger Color_Token.
5. WHILE a sign-in request is in progress, THE Login_Page SHALL disable the submit button and display a loading label in place of the default button text.
6. THE Login_Page SHALL centre the sign-in Card both horizontally and vertically within the viewport.
7. THE Login_Page SHALL render the sign-in Card with a maximum width of 360px.

---

### Requirement 7: Course Page and Tab Bar

**User Story:** As a student, I want a clear page header and tab navigation on course pages, so that I always know where I am and can switch content types easily.

#### Acceptance Criteria

1. THE Course_Page SHALL render a Page_Header with the course and section name as the title and a breadcrumb showing the navigation path.
2. THE Tab_Bar SHALL display tabs for Videos, Materials, and Quiz for each course section.
3. WHEN a tab is active, THE Tab_Bar SHALL render a bottom border on that tab using the Accent_Color.
4. WHEN a Student clicks a tab, THE Tab_Bar SHALL navigate to the corresponding content view without a full page reload.
5. THE Tab_Bar SHALL be separated from the content area below it by a full-width horizontal rule using the border Color_Token.

---

### Requirement 8: Video List

**User Story:** As a student, I want a well-presented video list, so that I can browse and select tutorial videos easily.

#### Acceptance Criteria

1. THE Platform SHALL render each video as a Card containing a thumbnail placeholder, title, duration label, and difficulty label.
2. WHEN a Student clicks a video Card, THE Platform SHALL display an embedded video player above the video list.
3. WHEN a video is selected, THE Platform SHALL apply a visually distinct active border to that video Card using the Accent_Color.
4. THE Platform SHALL render the video player at a 16:9 aspect ratio occupying the full available content width.
5. IF no videos are available for a course section, THEN THE Platform SHALL display a muted placeholder message.

---

### Requirement 9: Quiz Engine

**User Story:** As a student, I want a visually clear quiz interface, so that I can focus on answering questions without distraction.

#### Acceptance Criteria

1. THE Quiz_Engine SHALL display a progress indicator showing the current question number and total question count.
2. THE Quiz_Engine SHALL render a Progress_Bar that fills proportionally as the Student advances through questions.
3. THE Quiz_Engine SHALL render each answer option as a selectable row with a lettered badge (A, B, C, D) and option text.
4. WHEN a Student selects an answer, THE Quiz_Engine SHALL immediately highlight the correct answer in green and any incorrect selection in red using the success and danger Color_Tokens.
5. WHEN a Student selects an answer, THE Quiz_Engine SHALL display a "Next question" or "See results" button.
6. WHEN the quiz is complete, THE Quiz_Engine SHALL display a results screen with the Student's score, a contextual emoji, and a "Try again" button.
7. IF no questions are available for a course section, THEN THE Quiz_Engine SHALL display a muted placeholder message.

---

### Requirement 10: Responsive Layout

**User Story:** As a student, I want the platform to be usable on different screen sizes, so that I can study on a laptop or a tablet.

#### Acceptance Criteria

1. THE Platform SHALL render the Sidebar and main content area in a side-by-side layout on viewports wider than 768px.
2. WHEN the viewport width is 768px or narrower, THE Platform SHALL collapse the Sidebar and provide a mechanism for the Student to open and close it.
3. THE Home_Page course grid SHALL render three columns on viewports wider than 768px and one column on viewports 768px or narrower.
4. THE Quiz_Engine Card SHALL have a maximum width of 560px and SHALL be left-aligned within the content area.

---

### Requirement 11: Interactive States and Micro-interactions

**User Story:** As a student, I want smooth visual feedback on interactive elements, so that the platform feels polished and responsive.

#### Acceptance Criteria

1. THE Platform SHALL apply a CSS transition of 150ms or less to background-color and color changes on all interactive nav items, buttons, and Cards.
2. WHEN a button is in a hover state, THE Platform SHALL apply a visible change in opacity or background shade to indicate interactivity.
3. WHEN a nav item is clicked, THE Platform SHALL apply a brief scale-down transform (scale 0.97–0.99) to provide tactile feedback.
4. THE Platform SHALL render focus-visible outlines on all keyboard-focusable elements using the Accent_Color to support keyboard navigation.
