# FocusTask PWA - Fast Mobile-First Task Manager with Canvas & Google Calendar

FocusTask is a fast, lightweight, mobile-first Progressive Web App (PWA) designed for personal task management, academic scheduling, and calendar synchronization. It integrates seamlessly with **Canvas LMS** (via personal iCal feed) and **Google Calendar** (via Google OAuth 2.0).

---

## 🚀 Key Features

### 1. Mobile-First Progressive Web App (PWA)
- **Zero Horizontal Scrolling**: Tailored for one-handed mobile speed with thumb-friendly touch targets (min 44×44px).
- **Add to Home Screen**: Installable as a standalone native app on iOS Safari and Android Chrome with custom app icons, theme colors, and offline shell caching.
- **High-Contrast Minimalist UI**: Pure dark mode by default (`#09090b`) with crisp contrast, vibrant priority tags, and a light mode toggle.
- **Instant Optimistic UI**: Tasks update immediately in UI before persisting in the background.
- **Desktop Keyboard Shortcuts**: Press `N` or `C` for new task, `/` to search, `1`/`2`/`3` for priorities, `T` for Today, `M` for Tomorrow, and `?` for shortcuts help.

### 2. Core To-Do Features
- **Smart Quick-Add Bar**: Rapid task creation with live Natural Language Parsing (e.g. `Problem set 2 p1 tomorrow 5pm #CS106`) or quick-select pills.
- **Priority System**: High (**P1** Rose), Medium (**P2** Amber), Low (**P3** Blue) with instant sorting and filtering.
- **Custom Reminders**: Set reminder popup lead times per task (At due date, 15m, 1h, 3h, 1d, or custom minutes), defaulting to your global setting.
- **Task Organization**: Categorized into **Overdue**, **Today**, **Tomorrow**, **Upcoming / Later**, and **No Due Date**, with a collapsible **Completed** archive.
- **Course & Tagging**: Automatic extraction of course badges (e.g. `[CS 106B]`, `[PHYS 41]`).

### 3. Canvas LMS Integration (iCal Feed)
- **Zero-Token Setup**: Paste your personal Canvas Calendar `.ics` feed URL in Settings (no developer API tokens needed).
- **Deduplication Engine**: Uses the iCal `UID` (`event-assignment-XXXXX`) to update changed deadlines without creating duplicates or clearing completed statuses.
- **Accurate Timezones**: Parses UTC offsets (`Z`), floating timestamps, and Daylight Saving Time cleanly.
- **Direct Link**: Every imported Canvas task includes a 1-tap **"Open in Canvas"** button linking directly to the assignment.
- **Manual & Scheduled Sync**: 1-click "Sync Canvas Now" button in the header and settings.

### 4. Google Calendar Push & Sync
- **OAuth 2.0 Integration**: Connects directly to Google Calendar (`calendar.events` scope).
- **Target Calendar Selection**: Push tasks to your Primary Google Calendar or a dedicated "School / Tasks" calendar.
- **Popup Reminder Sync**: Sets custom Google Calendar notification overrides (`reminders.overrides`) matching the task's lead time (e.g., 15m or 1h before).
- **Auto-Push or Selective Push**: Option to auto-push all newly created or Canvas-scraped tasks, or push selectively with a 1-tap button.
- **Automatic Updates & Deletions**: Modifying a task's due date updates the Google Calendar event; deleting the task deletes the event in Google Calendar.

---

## 📁 Project File Structure

```text
TodoApp/
├── public/
│   ├── manifest.json             # PWA Web App Manifest
│   ├── sw.js                     # Offline shell cache service worker
│   └── icons/                    # High-res PWA icons (192x192, 512x512, apple-touch-icon)
├── src/
│   ├── app/
│   │   ├── layout.tsx            # Viewport fit=cover, safe areas, PWA meta tags
│   │   ├── page.tsx              # Main interactive task view & keyboard listeners
│   │   ├── globals.css           # High-contrast Dark/Light theme CSS variables
│   │   └── api/
│   │       ├── canvas/
│   │       │   └── sync/route.ts # Fetches, parses, and deduplicates Canvas .ics feed
│   │       ├── auth/google/
│   │       │   ├── route.ts      # Redirects to Google OAuth consent
│   │       │   └── callback/route.ts # Exchanges code for tokens and saves credentials
│   │       └── google/
│   │           ├── calendars/route.ts # Fetches user's writable Google Calendars
│   │           ├── push/route.ts      # Creates/updates event with reminder overrides
│   │           ├── delete/route.ts    # Deletes event on task removal
│   │           └── disconnect/route.ts# Disconnects Google account
│   ├── components/
│   │   ├── Header.tsx            # Top bar with Canvas sync, GCal indicator, theme toggle
│   │   ├── QuickAddBar.tsx       # Sticky input bar with NLP & quick-select pills
│   │   ├── FilterBar.tsx         # Priority, source, course filters & sorting
│   │   ├── TaskCard.tsx          # 44px touch targets, badges, Open in Canvas, Push to GCal
│   │   ├── TaskList.tsx          # Grouped sections (Overdue, Today, Tomorrow, Completed)
│   │   ├── TaskEditModal.tsx     # Full modal editor for notes, custom reminder, date
│   │   ├── SettingsDrawer.tsx    # Default reminder, Canvas feed URL, Google connection
│   │   ├── KeyboardShortcutsModal.tsx # Shortcuts cheatsheet (?)
│   │   ├── PWAInstallBanner.tsx  # iOS Safari and Android Chrome install prompts
│   │   └── Toast.tsx             # Animated status notifications
│   ├── hooks/
│   │   ├── useTasks.ts           # Optimistic state manager & GCal synchronization
│   │   ├── useSettings.ts        # Settings state & Canvas sync trigger
│   │   └── useTheme.ts           # Dark/Light mode manager
│   └── lib/
│       ├── types.ts              # TypeScript interfaces for Task, Settings, GoogleCal
│       ├── naturalLanguage.ts    # Natural language parsing for dates, priorities, tags
│       ├── ical/
│       │   └── parser.ts         # node-ical + fallback regex ICS parser & course extraction
│       ├── google/
│       │   └── calendar.ts       # Google Calendar API client (v3)
│       ├── storage/
│       │   └── localStore.ts     # Resilient local storage with initial mock data
│       └── supabase/
│           ├── client.ts         # Browser Supabase client
│           └── server.ts         # Server-side Supabase client
├── supabase/
│   └── schema.sql                # Complete PostgreSQL migration with RLS & indexes
├── .env.example                  # Environment variables guide
├── package.json
└── tsconfig.json
```

---

## 🗄️ Database Schema (Supabase PostgreSQL)

The schema supports both single-user local/standalone mode and multi-user Supabase PostgreSQL authentication with Row Level Security (RLS).

Run the following in your **Supabase SQL Editor**:

```sql
-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. User Settings Table
CREATE TABLE IF NOT EXISTS public.user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    default_reminder_lead_time_minutes INTEGER NOT NULL DEFAULT 15,
    canvas_ics_url TEXT,
    canvas_last_synced_at TIMESTAMPTZ,
    google_access_token TEXT,
    google_refresh_token TEXT,
    google_token_expiry TIMESTAMPTZ,
    google_selected_calendar_id TEXT NOT NULL DEFAULT 'primary',
    google_auto_push_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    google_user_email TEXT,
    theme TEXT NOT NULL DEFAULT 'dark' CHECK (theme IN ('dark', 'light', 'system')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Tasks Table
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    notes TEXT,
    priority TEXT NOT NULL DEFAULT 'P2' CHECK (priority IN ('P1', 'P2', 'P3')),
    due_date TIMESTAMPTZ,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    reminder_lead_time_minutes INTEGER NOT NULL DEFAULT 15,
    source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'canvas')),
    external_url TEXT,
    course_name TEXT,
    canvas_uid TEXT,
    google_event_id TEXT,
    google_calendar_id TEXT,
    is_pushed_to_google BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. High-Performance Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_is_completed ON public.tasks(is_completed);
CREATE INDEX IF NOT EXISTS idx_tasks_canvas_uid ON public.tasks(canvas_uid);
CREATE INDEX IF NOT EXISTS idx_tasks_google_event_id ON public.tasks(google_event_id);

-- 5. Row Level Security Policies
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own tasks"
    ON public.tasks
    FOR ALL
    USING (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "Users can manage their own settings"
    ON public.user_settings
    FOR ALL
    USING (auth.uid() = user_id OR auth.uid() IS NULL);
```

---

## ⚙️ Environment Variables

Create `.env.local` based on `.env.example`:

```bash
# App URL (Must match your deployment domain)
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Google OAuth 2.0 Credentials
GOOGLE_CLIENT_ID="xxxx-xxxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxxxxxxx"

# Supabase Credentials (Optional for local-first mode)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOi..."
```

---

## 🔑 Google Cloud Console OAuth Setup (Step-by-Step)

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (e.g., `FocusTask PWA`).
3. In the sidebar, navigate to **APIs & Services** > **Library**, search for **Google Calendar API**, and click **Enable**.
4. Go to **APIs & Services** > **OAuth consent screen**:
   - User Type: **External**
   - App Name: `FocusTask`
   - User Support Email: your email
   - Developer Contact Email: your email
   - Under **Scopes**, click **Add or Remove Scopes** and add:
     - `https://www.googleapis.com/auth/calendar.events`
     - `https://www.googleapis.com/auth/calendar.readonly`
     - `https://www.googleapis.com/auth/userinfo.email`
   - Under **Test Users**, add your personal Google account email.
5. Go to **APIs & Services** > **Credentials**:
   - Click **Create Credentials** > **OAuth client ID**.
   - Application type: **Web application**.
   - Name: `FocusTask Web Client`.
   - **Authorized JavaScript origins**:
     - `http://localhost:3000`
     - `https://your-project.vercel.app`
   - **Authorized redirect URIs**:
     - `http://localhost:3000/api/auth/google/callback`
     - `https://your-project.vercel.app/api/auth/google/callback`
6. Copy the **Client ID** and **Client Secret** into your `.env.local` and Vercel environment variables.

---

## 🎓 Canvas LMS Calendar Feed Setup (Step-by-Step)

1. Log in to your school's Canvas portal (e.g. `canvas.instructure.com` or `canvas.yourschool.edu`).
2. In the global left-hand sidebar, click on **Calendar**.
3. On the right-hand side (or bottom on mobile), click **Calendar Feed**.
4. Copy the URL ending with `.ics` (e.g. `https://canvas.school.edu/feeds/calendars/user_XXXXXX.ics`).
5. In FocusTask, open **Settings** (gear icon) > paste into **Canvas iCal Feed URL** > tap **Sync Canvas Now**.
6. All upcoming assignments will be imported with:
   - Medium (P2) default priority
   - Course badge (e.g., `[CS 106B]`)
   - Due date and time in your local timezone
   - Clickable **"Open in Canvas"** badge linking straight to the assignment submission page.

---

## 📱 Mobile PWA Installation ("Add to Home Screen")

### On iPhone / iPad (iOS Safari)
1. Open your deployed URL (e.g. `https://your-project.vercel.app`) in **Safari**.
2. Tap the **Share** button (box with an arrow pointing up at the bottom).
3. Scroll down and tap **Add to Home Screen**.
4. Tap **Add** in the top right corner.
5. The FocusTask app icon will appear on your home screen and open in standalone full-screen mode (no Safari URL bars).

### On Android (Chrome)
1. Open the URL in **Chrome**.
2. Tap the **Install** pill at the top of the app, or tap the three dots `⋮` in Chrome and select **Install app** / **Add to Home screen**.
3. Confirm installation. FocusTask will launch as a standalone native app with offline shell support.

---

## 🚢 Deploying to Vercel (Ready in 2 Minutes)

1. Push your repository to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial FocusTask commit"
   git remote add origin https://github.com/<your-username>/todo-app.git
   git push -u origin main
   ```
2. Log in to [Vercel](https://vercel.com) and click **Add New...** > **Project**.
3. Import your `todo-app` repository.
4. In the **Environment Variables** section, add:
   - `NEXT_PUBLIC_APP_URL` = `https://your-project-name.vercel.app`
   - `GOOGLE_CLIENT_ID` = `your-google-client-id`
   - `GOOGLE_CLIENT_SECRET` = `your-google-client-secret`
   - `NEXT_PUBLIC_SUPABASE_URL` = `your-supabase-url` (optional)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `your-supabase-anon-key` (optional)
5. Click **Deploy**.
6. In Google Cloud Console, add `https://your-project-name.vercel.app/api/auth/google/callback` to your **Authorized redirect URIs**.
7. Open the deployed link on your mobile phone and add it to your Home Screen!

---

## ⌨️ Desktop Keyboard Shortcuts

| Shortcut | Description |
|:---|:---|
| <kbd>N</kbd> or <kbd>C</kbd> | Focus the Quick-Add bar to create a task |
| <kbd>/</kbd> | Focus the search bar |
| <kbd>1</kbd> | Select Priority **P1 (High)** |
| <kbd>2</kbd> | Select Priority **P2 (Medium)** |
| <kbd>3</kbd> | Select Priority **P3 (Low)** |
| <kbd>T</kbd> | Set due date to **Today** |
| <kbd>M</kbd> | Set due date to **Tomorrow** |
| <kbd>?</kbd> | Toggle Keyboard Shortcuts help modal |
| <kbd>Esc</kbd> | Close modals, drawers, or blur inputs |

---

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run production build & type check
npm run build
```
Open [http://localhost:3000](http://localhost:3000) in your browser.
