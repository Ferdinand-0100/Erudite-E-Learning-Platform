# EduLearn Platform

A full-featured e-learning platform built with React + Vite + Supabase.

## Features

- **Account system** — students sign in with email/password; all routes are protected
- **Sidebar navigation** — Home, English, Mandarin, Computer
- **English** is subdivided into GET, IELTS, and PTE, each with their own content
- **Mandarin & Computer** each have Tutorial Videos, Written Materials, and a Quiz System
- **Quiz engine** — multiple choice, auto-graded, attempts saved to database
- **Progress tracking** — per-student progress stored in Supabase

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend framework | React 18 + Vite | Fast dev server, great ecosystem |
| Routing | React Router v6 | Nested routes match our sidebar structure perfectly |
| Backend + DB | Supabase (PostgreSQL) | Auth + DB + Storage + API in one free-tier service |
| Auth | Supabase Auth | Email/password, JWT sessions, Row Level Security |
| Styling | CSS Modules + CSS variables | Scoped styles, no extra dependencies |
| Video | YouTube embed iframes | Free, reliable, no hosting cost |
| File storage | Supabase Storage | Upload PDFs/docs, get public URLs |

## Project Structure

```
elearning/
├── index.html
├── vite.config.js
├── package.json
├── .env.example             ← copy to .env and fill in your keys
├── supabase/
│   └── schema.sql           ← run this in Supabase SQL editor
└── src/
    ├── main.jsx
    ├── App.jsx              ← all routes defined here
    ├── index.css            ← global CSS variables & resets
    ├── lib/
    │   ├── supabase.js      ← Supabase client
    │   └── AuthContext.jsx  ← global auth state + signIn/signOut
    ├── components/
    │   ├── Layout.jsx       ← sidebar + main shell
    │   ├── Layout.module.css
    │   ├── Tabs.jsx         ← reusable tab bar (Videos / Materials / Quiz)
    │   ├── PageHeader.jsx   ← page title + breadcrumb
    │   ├── VideoList.jsx    ← fetches & displays videos from DB
    │   ├── MaterialsList.jsx ← fetches & displays downloadable files
    │   └── QuizEngine.jsx   ← full quiz flow, saves attempts to DB
    └── pages/
        ├── LoginPage.jsx
        ├── Home.jsx
        ├── CoursePage.jsx   ← renders Videos/Materials/Quiz based on URL
        ├── English/
        │   └── index.jsx    ← GET / IELTS / PTE pill selector
        ├── Mandarin/
        │   └── index.jsx
        └── Computer/
            └── index.jsx
```

## Setup Guide

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click **New project** and give it a name (e.g. `edulearn`)
3. Once ready, go to **Settings → API** and copy:
   - **Project URL**
   - **anon / public key**

### 2. Run the database schema

1. In your Supabase project, go to **SQL Editor → New query**
2. Paste the contents of `supabase/schema.sql`
3. Click **Run** — this creates all tables, RLS policies, and sample data

### 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill in your values:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Install dependencies and run

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### 5. Create your first student account

Since registration is admin-only, create accounts via **Supabase Dashboard → Authentication → Users → Add user**.

Or add a temporary sign-up page and remove it after your initial users are created.

## Database Schema (overview)

| Table | Description |
|---|---|
| `profiles` | One row per user; linked to Supabase auth |
| `videos` | Video entries with `course_key`, title, YouTube embed URL |
| `materials` | Downloadable files with `course_key` and Supabase Storage URL |
| `quiz_questions` | Questions with options (JSON array) and correct answer index |
| `quiz_attempts` | Every student answer recorded with timestamp |
| `progress` | Per-student, per-course completion percentage |

### Course keys

| Course | course_key |
|---|---|
| English — GET | `english_GET` |
| English — IELTS | `english_IELTS` |
| English — PTE | `english_PTE` |
| Mandarin | `mandarin` |
| Computer | `computer` |

## Adding Content

**Videos:** Insert rows into `videos` table with the correct `course_key` and a YouTube embed URL (`https://www.youtube.com/embed/VIDEO_ID`).

**Materials:** Upload files to Supabase Storage (create a public bucket called `materials`), then insert rows into `materials` with the public file URL.

**Quiz questions:** Insert rows into `quiz_questions`. The `options` field is a JSON array of strings. `correct_answer_index` is 0-based.

## Deploying

```bash
npm run build        # outputs to dist/
```

Deploy the `dist/` folder to any static host:
- **Vercel** (recommended): connect your GitHub repo, set env vars in project settings
- **Netlify**: drag & drop the `dist/` folder or connect via Git
- **Cloudflare Pages**: connect repo, build command `npm run build`, output dir `dist`

## Next Steps

- [ ] Admin panel to manage content (videos, materials, quiz questions) without touching SQL
- [ ] Email/password reset flow
- [ ] Student progress dashboard with charts
- [ ] Certificate generation on course completion
- [ ] Discussion / comments per lesson
