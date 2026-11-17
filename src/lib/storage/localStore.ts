import { Task, UserSettings } from "../types";

export const DEFAULT_SETTINGS: UserSettings = {
  default_reminder_lead_time_minutes: 15,
  canvas_ics_url: "",
  canvas_last_synced_at: null,
  google_access_token: null,
  google_refresh_token: null,
  google_token_expiry: null,
  google_selected_calendar_id: "primary",
  google_auto_push_enabled: false,
  google_user_email: null,
  theme: "dark",
};

export const INITIAL_SAMPLE_TASKS: Task[] = [
  {
    id: "sample-1",
    title: "Midterm Review: Big-O & Balanced Trees",
    notes: "Review chapters 4 & 5. Focus on AVL tree rotations and amortized time complexity.",
    priority: "P1",
    due_date: new Date(Date.now() + 3 * 3600 * 1000).toISOString(), // 3 hours from now (Today)
    is_completed: false,
    reminder_lead_time_minutes: 60,
    estimated_duration_minutes: 90,
    source: "canvas",
    course_name: "CS 106B",
    external_url: "https://canvas.stanford.edu/courses/106/assignments/2024",
    canvas_uid: "canvas-sample-106b",
    is_pushed_to_google: true,
    google_event_id: "mock-gcal-id-1",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "sample-2",
    title: "Physics Problem Set #4 - Electromagnetism",
    notes: "Problems 14.12, 14.19, and 14.33. Submit PDF on Canvas before 11:59 PM.",
    priority: "P2",
    due_date: new Date(Date.now() + 28 * 3600 * 1000).toISOString(), // Tomorrow
    is_completed: false,
    reminder_lead_time_minutes: 180, // 3 hours before
    estimated_duration_minutes: 45,
    source: "canvas",
    course_name: "PHYS 41",
    external_url: "https://canvas.stanford.edu/courses/41/assignments/1099",
    canvas_uid: "canvas-sample-phys41",
    is_pushed_to_google: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "sample-3",
    title: "Draft Research Proposal for Capstone Project",
    notes: "Outline scope, background, methodology, and expected timeline.",
    priority: "P1",
    due_date: new Date(Date.now() + 72 * 3600 * 1000).toISOString(), // 3 days from now
    is_completed: false,
    reminder_lead_time_minutes: 1440, // 1 day before
    estimated_duration_minutes: 120,
    source: "manual",
    course_name: "SENIOR SEMINAR",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "sample-4",
    title: "Order new USB-C adapter & notebook",
    notes: "For robotics lab work.",
    priority: "P3",
    due_date: null,
    is_completed: false,
    reminder_lead_time_minutes: 15,
    source: "manual",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "sample-5",
    title: "Submit Ethics Case Study Essay",
    notes: "Submitted via Canvas on time.",
    priority: "P2",
    due_date: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    is_completed: true,
    completed_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    reminder_lead_time_minutes: 15,
    source: "canvas",
    course_name: "ETHICS 101",
    external_url: "https://canvas.stanford.edu/courses/101/assignments/55",
    canvas_uid: "canvas-sample-ethics",
    created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const TASKS_STORAGE_KEY = "todo_pwa_tasks_v1";
const SETTINGS_STORAGE_KEY = "todo_pwa_settings_v1";

export function getLocalTasks(): Task[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(TASKS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(INITIAL_SAMPLE_TASKS));
      return INITIAL_SAMPLE_TASKS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to read tasks from localStorage:", err);
    return INITIAL_SAMPLE_TASKS;
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
