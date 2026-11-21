# Margin — Minimalist Task & Assignment Manager

**Margin** is an editorial, distraction-free personal task and assignment manager inspired by **Things 3** and **Bear**. Designed for students and power users who want speed, one-handed mobile ergonomics, and seamless synchronization across phone and laptop with **Canvas LMS**, **Google Calendar**, and **Supabase Realtime**.

Live Production: [https://margin-vilh.vercel.app/](https://margin-vilh.vercel.app/)

---

## ✦ Core Features & Design Philosophy

### 1. Things 3 & Bear Minimalist Aesthetic
- **Calm, Typographic Structure**: Borderless task rows with subtle dividers, high-contrast elevated surface cards, zero generic SaaS clutter, and generous whitespace.
- **Priority Accent Rings**:
  - **P1 (High)**: Rose red accent ring (`#f43f5e`)
  - **P2 (Medium)**: Amber accent ring (`#f59e0b`)
  - **P3 (Low)**: Neutral slate ring (`#a1a1aa`)
- **Inline Metadata**: Course codes, due times, estimated duration, and reminder lead times are separated by middle dots:
  ```text
  CS 106B · Today @ 5:00 PM · ~45m · ⏰ 15m before
  ```
- **Direct Canvas Assignment Links**: Task titles link directly into your native Canvas assignment or quiz with a subtle `↗` arrow.

---

### 2. Dedicated Views & Workflows
Margin provides 6 focused views accessible via the navigation bar or keyboard shortcuts:

1. **Today (<kbd>1</kbd>)**: Overdue assignments requiring immediate action, tasks due today, and an Anytime / Unscheduled section so no task is ever lost.
2. **Upcoming (<kbd>2</kbd>)**: Tomorrow's tasks and future deadlines grouped chronologically.
3. **Calendar (<kbd>3</kbd>)**: Full-featured monthly grid with drag-free day schedule drawer, lecture filters, and direct task creation on any day.
4. **Shopping (<kbd>4</kbd>)**: Dedicated grocery and errand checklist with quick-add bar, comma-separated / newline multi-import, 44px mobile touch targets, crossing-out items, and instant cloud sync. Unscheduled shopping items remain isolated from your academic homework views.
5. **All Tasks (<kbd>5</kbd>)**: Complete master view grouped by Overdue, Today, Tomorrow, Upcoming, Someday, and Completed.
6. **Completed (<kbd>6</kbd>)**: Searchable archive of all finished tasks with completion timestamps.

---

### 3. Shopping List with Multi-Import
- **Single Quick-Add**: Type item name and press <kbd>Enter</kbd> (input retains focus for rapid entry).
- **Multi-Import**: Paste grocery lists from Notes or messages separated by commas or new lines (e.g. `Apples, Milk, Sourdough bread, Eggs`) with live item count chips before importing.
- **Crossing Out**: Strikethrough with subtle dimming and collapsible "Crossed Out (N)" section with 1-click "Clear Bought".
- **Cross-Device Sync**: Synchronizes in real time across phone and laptop via Supabase Realtime and resilient schema fallbacks.

---

### 4. Canvas LMS Integration
- **iCal Feed Synchronization**: Paste your personal Canvas calendar feed URL (`.ics`) in Settings.
- **Auto-Prioritization**: Intelligently assigns P1 / P2 / P3 based on urgency (e.g., due in < 24 hours).
- **Virtual Class Meeting Detection**: Filters out recurring Zoom/Teams lecture links from homework lists while keeping manual study tasks visible.
- **Deduplication**: Keyed on unique `canvas_uid` to prevent duplicates across sync cycles.

---

### 5. Google Calendar 2-Way Sync
- **Live iCal Feed**: Subscribe via Google Calendar URL (`/api/calendar.ics`) with native `VALARM` notifications.
- **1-Click Push**: Push any task or assignment directly to your connected Google Calendar with pre-populated deadlines, notes, and links.
- **Batch Push**: One-click sync of all unsynced tasks to Google Calendar.

---

### 6. iPhone Lock Screen & Device Notifications
- **Apple APNs Web Push**: Native lock screen alerts on iPhone and Apple Watch even when Margin is closed and the phone is locked.
- **Background Cron Trigger**: Automated 24/7 cloud notification scheduler via Vercel serverless functions and Supabase cron.
- **Device Audio Chimes**: Gentle audio chimes before deadlines.

---

### 7. Resilient Cross-Device Cloud Sync
- **Offline-First Optimistic UI**: All changes commit immediately to `localStorage` for zero-latency interactions.
- **3-Tier Schema Fallback**: Automatically adapts to remote Supabase tables, supporting full, compatible, and minimal schemas without sync failures.
- **Supabase Realtime**: Instant broadcast of inserts, updates, and deletes across all active devices.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|:---|:---|
| <kbd>1</kbd> | Jump to **Today** |
| <kbd>2</kbd> | Jump to **Upcoming** |
| <kbd>3</kbd> | Jump to **Calendar** |
| <kbd>4</kbd> | Jump to **Shopping List** |
| <kbd>5</kbd> | Jump to **All Tasks** |
| <kbd>6</kbd> | Jump to **Completed** |
| <kbd>N</kbd> or <kbd>C</kbd> | Open New Task Modal |
| <kbd>/</kbd> | Focus Search Bar |
| <kbd>?</kbd> | Open Shortcuts Cheat Sheet |
| <kbd>Esc</kbd> | Close Modals & Drawers |
| <kbd>⌘</kbd> + <kbd>Enter</kbd> | Save & Submit Task |

---

## 🛠 Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, Server Actions, Serverless API Routes)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict mode, full type-safety)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with Dark / Light / System theme support
- **Backend & Database**: [Supabase](https://supabase.com/) (PostgreSQL, Row Level Security, Realtime WebSockets)
- **Push Notifications**: Web Push Protocol (Apple APNs, VAPID, Service Worker)
- **PWA**: Progressive Web App with standalone display, asset caching, and offline support

---

## 🚀 Running Locally

1. **Clone the repository**:
   ```bash
   git clone https://github.com/OmTasg/Margin.git
   cd Margin
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env.local` and add your credentials:
   ```bash
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
   ```

4. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

5. **Build for Production**:
   ```bash
   npm run build
   ```
