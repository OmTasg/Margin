import { Task, UserSettings } from "../types";

export const DEFAULT_SETTINGS: UserSettings = {
  default_reminder_lead_time_minutes: 15,
  canvas_ics_url: "",
  canvas_last_synced_at: null,
  canvas_open_in_app: true,
  notifications_enabled: true,
  notification_sound_enabled: true,
  notify_at_due_time: true,
  google_access_token: null,
  google_refresh_token: null,
  google_token_expiry: null,
  google_selected_calendar_id: "primary",
  google_auto_push_enabled: false,
  google_skip_canvas_tasks: true,
  google_user_email: null,
  theme: "dark",
};

export const INITIAL_SAMPLE_TASKS: Task[] = [];

const TASKS_STORAGE_KEY = "todo_pwa_tasks_v1";
const SETTINGS_STORAGE_KEY = "todo_pwa_settings_v1";

export function getLocalTasks(): Task[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(TASKS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify([]));
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // Filter out any legacy sample/placeholder tasks
      const cleaned = parsed.filter(
        (t) =>
          !t.id?.startsWith("sample-") &&
          !t.canvas_uid?.startsWith("canvas-sample-")
      );
      if (cleaned.length !== parsed.length) {
        localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(cleaned));
      }
      return cleaned;
    }
    return [];
  } catch (err) {
    console.error("Failed to read tasks from localStorage:", err);
    return [];
  }
}

export function saveLocalTasks(tasks: Task[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
  } catch (err) {
    console.error("Failed to save tasks to localStorage:", err);
  }
}

export function getLocalSettings(): UserSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
      return DEFAULT_SETTINGS;
    }
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (err) {
    console.error("Failed to read settings from localStorage:", err);
    return DEFAULT_SETTINGS;
  }
}

export function saveLocalSettings(settings: UserSettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error("Failed to save settings to localStorage:", err);
  }
}
