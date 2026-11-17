# Margin - Minimalist Task Manager for Mobile & Desktop

**Margin** is an editorial, distraction-free personal task manager inspired by **Things 3** and **Bear**. Designed for speed, one-handed mobile use, and academic workflows with **Canvas LMS** and **Google Calendar** integration.

---

## ✦ Design Philosophy (Things 3 & Bear Aesthetic)

- **Calm, Typographic List**: Borderless task rows with subtle 1px dividers, zero generic SaaS card outlines, and generous whitespace.
- **Understated Priority Indicators**: No loud rainbow pills. Priorities are conveyed through subtle circular checkbox accents:
  - **P1 (High)**: Rose red accent ring
  - **P2 (Medium)**: Amber accent ring
  - **P3 (Low)**: Neutral slate ring
- **Inline Metadata**: Course codes, due times, estimated duration, and reminder lead times are separated by middle dots:
  ```text
  CS 106B · Today @ 5:00 PM · ~45m · ⏰ 15m before
  ```
- **Direct Canvas Links**: Task titles link directly to Canvas assignments with a subtle `↗` arrow indicator.
- **Collapsible Quick-Add**: A quiet, single-line input (`+ New task... (press N)`) that expands on focus to reveal date, duration estimates, priority, and reminder controls.
- **Focused Canvas Width**: Optimal reading and scanning width (`max-w-2xl`) tailored for one-handed mobile thumb reach and desktop flow.
- **Row-Hover Actions**: Edit, delete, and Google Calendar buttons stay hidden until row hover on desktop.

---

## ⏱ Task Duration Estimates

You can now estimate how long any task will take:
- **In Quick-Add**: Click the **`⏱ Estimate`** dropdown (`15m`, `30m`, `45m`, `1h`, `1.5h`, `2h`) or type it naturally in the title (`~30m`, `45m`, `1.5h`).
- **In Edit Modal**: Modify duration estimates anytime.
- **Inline Display**: Displays cleanly on the task row (e.g., `~45m`).

---

## 🎓 Canvas LMS Integration (iCal Feed)

- **Setup**: In Settings, paste your personal Canvas Calendar feed link (`.ics`).
- **Sync**: Pulls assignments, extracts course codes (`[CS 106B]`), due dates, and direct assignment URLs.
- **Deduplication**: Keyed on `canvas_uid` so updated deadlines never create duplicate tasks or uncheck finished items.

---

## 📅 Zero-Setup Google Calendar Integration

No Google Cloud Console or OAuth keys required:
1. **1-Click "+ GCal"**: Tap the calendar icon on any task to instantly open Google Calendar with title, deadline, notes, and Canvas links pre-populated.
2. **Live Calendar Feed**: Copy your private feed URL from Settings (`/api/calendar.ics`) and paste it into Google Calendar under **Other calendars > From URL**.

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|:---|:---|
| <kbd>N</kbd> or <kbd>C</kbd> | Focus the Quick-Add bar |
| <kbd>/</kbd> | Search tasks |
| <kbd>1</kbd> / <kbd>2</kbd> / <kbd>3</kbd> | Set Priority (P1, P2, P3) |
| <kbd>T</kbd> / <kbd>M</kbd> | Set due date to Today / Tomorrow |
| <kbd>?</kbd> | Toggle shortcuts cheat sheet |
| <kbd>Esc</kbd> | Collapse quick-add, dismiss modals |

---

## 🚀 Running Locally

```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).
