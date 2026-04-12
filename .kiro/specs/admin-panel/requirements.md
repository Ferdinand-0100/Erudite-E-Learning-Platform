# Requirements Document

## Introduction

The Admin Panel is a protected section of the e-learning platform accessible only to users with `role = 'admin'` in the `profiles` table. It provides a dedicated UI at `/admin` routes with its own layout and sidebar, allowing admins to manage all course content (videos, materials, quiz questions) and student accounts without touching raw SQL.

The platform hosts three courses — English (GET/IELTS/PTE), Mandarin (GM/HSK/TOCFL), and Computer (IOT/3D Design/Web/Desktop/Mobile/Database) — each with multiple subclasses and levels. Content is keyed by `course_key` in the format `{course}_{subclass}_{level}` (all lowercase).

---

## Glossary

- **Admin_Panel**: The protected `/admin` section of the application, accessible only to admin users.
- **Admin_Guard**: The route-level component that enforces admin-only access to the Admin_Panel.
- **Admin_Layout**: The shell component providing the admin sidebar and main content area for all `/admin` routes.
- **Content_Manager**: The subsystem responsible for creating, editing, and deleting videos, materials, and quiz questions.
- **Student_Manager**: The subsystem responsible for viewing, creating, and deactivating student accounts.
- **course_key**: A string identifier in the format `{course}_{subclass}_{level}` (all lowercase, e.g. `english_ielts_band5`, `computer_web_beginner`).
- **Video**: A record in the `videos` table containing a title, YouTube embed URL, optional duration label, difficulty, sort order, and `course_key`.
- **Material**: A record in the `materials` table containing a title, a PDF file URL (Supabase Storage), optional file size label, sort order, and `course_key`.
- **Quiz_Question**: A record in the `quiz_questions` table containing a question, a JSON array of four options, a correct answer index, an optional explanation, sort order, and `course_key`.
- **Student**: A row in the `profiles` table with `role = 'student'`.
- **Deactivation**: Setting a student's `role` to `'deactivated'` so the student cannot access the platform.
- **Supabase_Storage**: The file storage service used to host uploaded PDF materials.
- **Profile**: A row in the `profiles` table linked to a Supabase auth user.

---

## Requirements

### Requirement 1: Admin-Only Access Control

**User Story:** As a platform admin, I want the admin panel to be inaccessible to students, so that only authorised users can manage content and accounts.

#### Acceptance Criteria

1. WHEN an unauthenticated user navigates to any `/admin` route, THE Admin_Guard SHALL redirect the user to `/login`.
2. WHEN an authenticated user with `role = 'student'` navigates to any `/admin` route, THE Admin_Guard SHALL redirect the user to `/` (the student home page).
3. WHEN an authenticated user with `role = 'admin'` navigates to any `/admin` route, THE Admin_Guard SHALL render the requested admin page.
4. THE Admin_Guard SHALL fetch the user's role from the `profiles` table using the authenticated user's `id`.
5. WHILE the Admin_Guard is fetching the user's role, THE Admin_Panel SHALL display a loading indicator and SHALL NOT render the admin content.

---

### Requirement 2: Admin Layout and Navigation

**User Story:** As a platform admin, I want a dedicated admin sidebar and layout, so that I can navigate between admin sections without mixing with the student interface.

#### Acceptance Criteria

1. THE Admin_Layout SHALL render a sidebar containing navigation links to: Dashboard, Videos, Materials, Quiz Questions, and Students.
2. THE Admin_Layout SHALL display the authenticated admin's display name and a sign-out button in the sidebar footer.
3. WHEN an admin clicks the sign-out button, THE Admin_Layout SHALL sign the user out and redirect to `/login`.
4. THE Admin_Layout SHALL be visually distinct from the student Layout component so that admins can clearly identify they are in the admin section.
5. THE Admin_Layout SHALL render a mobile hamburger menu that toggles the sidebar on screens narrower than 768px.

---

### Requirement 3: Admin Dashboard

**User Story:** As a platform admin, I want an overview dashboard, so that I can see a summary of platform content at a glance.

#### Acceptance Criteria

1. WHEN an admin navigates to `/admin`, THE Admin_Panel SHALL display counts of total videos, materials, quiz questions, and students.
2. THE Admin_Panel dashboard SHALL fetch all four counts from Supabase in a single page load.

---

### Requirement 4: Video Management

**User Story:** As a platform admin, I want to add, edit, and delete videos per course level, so that students always have up-to-date video content.

#### Acceptance Criteria

1. WHEN an admin navigates to `/admin/videos`, THE Content_Manager SHALL display a list of all videos grouped or filterable by `course_key`.
2. THE Content_Manager SHALL provide a course_key selector (course → subclass → level dropdowns) to filter the video list to a specific `course_key`.
3. WHEN an admin submits the Add Video form with a valid title, YouTube embed URL, and selected `course_key`, THE Content_Manager SHALL insert a new row into the `videos` table and display the new video in the list.
4. IF the YouTube embed URL provided does not begin with `https://www.youtube.com/embed/`, THEN THE Content_Manager SHALL display a validation error and SHALL NOT submit the form.
5. WHEN an admin clicks Edit on a video, THE Content_Manager SHALL populate an edit form with the video's current title, embed URL, duration label, difficulty, and sort order.
6. WHEN an admin submits the edit form with valid data, THE Content_Manager SHALL update the corresponding row in the `videos` table.
7. WHEN an admin clicks Delete on a video and confirms the action, THE Content_Manager SHALL delete the corresponding row from the `videos` table and remove it from the displayed list.
8. IF a Supabase operation for video management fails, THEN THE Content_Manager SHALL display a descriptive error message to the admin.

---

### Requirement 5: Material Management

**User Story:** As a platform admin, I want to upload, edit, and delete PDF materials per course level, so that students have downloadable study resources.

#### Acceptance Criteria

1. WHEN an admin navigates to `/admin/materials`, THE Content_Manager SHALL display a list of all materials filterable by `course_key`.
2. WHEN an admin selects a PDF file and submits the Add Material form with a valid title and selected `course_key`, THE Content_Manager SHALL upload the PDF to Supabase_Storage under the path `materials/{course_key}/{filename}` and insert a new row into the `materials` table with the resulting public URL.
3. IF the selected file is not a PDF (MIME type `application/pdf`), THEN THE Content_Manager SHALL display a validation error and SHALL NOT upload the file.
4. IF the selected file exceeds 20 MB, THEN THE Content_Manager SHALL display a validation error and SHALL NOT upload the file.
5. WHEN an admin submits the edit form for a material with a valid title and sort order, THE Content_Manager SHALL update the corresponding row in the `materials` table.
6. WHEN an admin clicks Delete on a material and confirms the action, THE Content_Manager SHALL delete the file from Supabase_Storage and delete the corresponding row from the `materials` table.
7. IF a Supabase operation for material management fails, THEN THE Content_Manager SHALL display a descriptive error message to the admin.

---

### Requirement 6: Quiz Question Management

**User Story:** As a platform admin, I want to add, edit, and delete quiz questions per course level, so that students are assessed on relevant content.

#### Acceptance Criteria

1. WHEN an admin navigates to `/admin/quiz`, THE Content_Manager SHALL display a list of all quiz questions filterable by `course_key`.
2. WHEN an admin submits the Add Question form with a valid question text, exactly four non-empty options, a correct answer index (0–3), and a selected `course_key`, THE Content_Manager SHALL insert a new row into the `quiz_questions` table.
3. IF the Add Question form is submitted with fewer than four options or an empty question text, THEN THE Content_Manager SHALL display a validation error and SHALL NOT submit the form.
4. IF the correct answer index is not an integer between 0 and 3 inclusive, THEN THE Content_Manager SHALL display a validation error and SHALL NOT submit the form.
5. WHEN an admin clicks Edit on a quiz question, THE Content_Manager SHALL populate an edit form with the question's current text, options, correct answer index, explanation, and sort order.
6. WHEN an admin submits the edit form with valid data, THE Content_Manager SHALL update the corresponding row in the `quiz_questions` table.
7. WHEN an admin clicks Delete on a quiz question and confirms the action, THE Content_Manager SHALL delete the corresponding row from the `quiz_questions` table.
8. IF a Supabase operation for quiz question management fails, THEN THE Content_Manager SHALL display a descriptive error message to the admin.

---

### Requirement 7: Student Management

**User Story:** As a platform admin, I want to view, create, and deactivate student accounts, so that I can control who has access to the platform.

#### Acceptance Criteria

1. WHEN an admin navigates to `/admin/students`, THE Student_Manager SHALL display a paginated list of all profiles with `role = 'student'` or `role = 'deactivated'`, showing full name, email, role, and account creation date.
2. THE Student_Manager SHALL provide a search input that filters the student list by full name or email in real time on the client side.
3. WHEN an admin submits the Create Student form with a valid email and password, THE Student_Manager SHALL create a new Supabase auth user and set the corresponding profile `role` to `'student'`.
4. IF the email provided in the Create Student form is already registered, THEN THE Student_Manager SHALL display a descriptive error message and SHALL NOT create a duplicate account.
5. WHEN an admin clicks Deactivate on a student and confirms the action, THE Student_Manager SHALL set the student's `role` in the `profiles` table to `'deactivated'`.
6. WHEN an admin clicks Reactivate on a deactivated student and confirms the action, THE Student_Manager SHALL set the student's `role` in the `profiles` table back to `'student'`.
7. IF a Supabase operation for student management fails, THEN THE Student_Manager SHALL display a descriptive error message to the admin.

---

### Requirement 8: Row Level Security for Admin Operations

**User Story:** As a platform admin, I want admin write operations to be enforced at the database level, so that students cannot bypass the UI to modify content.

#### Acceptance Criteria

1. THE Supabase database SHALL enforce a policy that only users whose `profiles.role = 'admin'` can insert, update, or delete rows in the `videos` table.
2. THE Supabase database SHALL enforce a policy that only users whose `profiles.role = 'admin'` can insert, update, or delete rows in the `materials` table.
3. THE Supabase database SHALL enforce a policy that only users whose `profiles.role = 'admin'` can insert, update, or delete rows in the `quiz_questions` table.
4. THE Supabase database SHALL enforce a policy that only users whose `profiles.role = 'admin'` can update the `role` column in the `profiles` table.
