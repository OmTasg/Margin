export type Priority = "P1" | "P2" | "P3";

export type TaskSource = "manual" | "canvas";

export interface Task {
  id: string;
  user_id?: string;
  title: string;
  notes?: string;
  priority: Priority;
  due_date?: string | null; // ISO string e.g. "2026-11-18T18:00:00.000Z"
  is_completed: boolean;
  completed_at?: string | null;
  reminder_lead_time_minutes: number; // e.g. 15, 60, 180, 1440
  estimated_duration_minutes?: number | null; // e.g. 15, 30, 45, 60, 120
  source: TaskSource;
  external_url?: string | null; // link back to Canvas assignment
  course_name?: string | null; // e.g. "CS106A", "Calculus III"
  canvas_uid?: string | null; // iCal UID for deduplication
  google_event_id?: string | null; // Created Google Calendar event ID
  google_calendar_id?: string | null;
  is_pushed_to_google?: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserSettings {
  id?: string;
  user_id?: string;
  default_reminder_lead_time_minutes: number; // default 15
  canvas_ics_url: string;
  canvas_last_synced_at?: string | null;
  google_access_token?: string | null;
  google_refresh_token?: string | null;
  google_token_expiry?: string | null;
  google_selected_calendar_id: string; // e.g. 'primary'
  google_auto_push_enabled: boolean;
  google_user_email?: string | null;
  theme: "dark" | "light" | "system";
}

export interface GoogleCalendarItem {
  id: string;
  summary: string;
  description?: string;
  primary?: boolean;
  backgroundColor?: string;
}

export interface CanvasSyncResult {
  success: boolean;
  importedCount: number;
  updatedCount: number;
  totalFound: number;
  syncedAt: string;
  error?: string;
  tasks?: Task[];
}

export type ViewFilter = "all" | "today" | "upcoming" | "completed";
export type SortOption = "dueDate" | "priority" | "title" | "course";
