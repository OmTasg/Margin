export type Priority = "P1" | "P2" | "P3";

export type TaskSource = "manual" | "canvas";

export type TaskCategory =
  | "course"
  | "gym"
  | "shopping"
  | "laundry"
  | "cooking"
  | "personal";

export type RecurrenceFrequency =
  | "none"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "weekdays"
  | "custom";

export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  interval?: number; // e.g. repeat every 1, 2 weeks/days
  unit?: "day" | "week" | "month" | "year"; // for custom frequency
  days_of_week?: number[]; // 0 = Sun, 1 = Mon, ..., 6 = Sat
  ends_type: "never" | "on_date" | "after_occurrences";
  ends_on_date?: string | null; // "YYYY-MM-DD"
  ends_after_count?: number | null; // e.g. after 13 occurrences
  occurrence_count?: number; // 1-indexed count of occurrences completed/spawned
}

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
  category?: TaskCategory | string | null; // e.g. "course", "gym", "shopping", "laundry", "cooking"
  is_lecture_or_meeting?: boolean; // Zoom or recurring class meetings from Canvas
  external_url?: string | null; // link back to Canvas assignment
  course_name?: string | null; // e.g. "ISYE 3232", "CS106A", "Calculus III"
  canvas_uid?: string | null; // iCal UID for deduplication
  recurrence?: RecurrenceRule | null; // Google Calendar style recurring task rule
  recurring_parent_id?: string | null; // ID of first task in the recurring series
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
  canvas_open_in_app?: boolean; // open Canvas assignment links directly in native Canvas Student app on mobile
  hide_virtual_classes?: boolean; // filter out Zoom/class lecture calendar events from todo list
  notifications_enabled?: boolean; // enable browser & device push notifications
  notification_sound_enabled?: boolean; // play subtle audio chime on reminder
  notify_at_due_time?: boolean; // also notify at exact due time in addition to reminder lead time
  google_access_token?: string | null;
  google_refresh_token?: string | null;
  google_token_expiry?: string | null;
  google_selected_calendar_id: string; // e.g. 'primary'
  google_auto_push_enabled: boolean;
  google_skip_canvas_tasks?: boolean; // exclude Canvas assignments to avoid duplicates
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
