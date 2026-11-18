import { Task } from "../types";
import { createClient, isSupabaseConfigured } from "../supabase/client";

export interface SyncResult {
  success: boolean;
  tasks?: Task[];
  pushedCount?: number;
  pulledCount?: number;
  error?: string;
  configured: boolean;
}

/**
 * Strips advanced / newly added columns for backwards-compatibility
 * with older Supabase tables that haven't run the latest migrations.
 */
function toBasePayload(task: Task) {
  return {
    id: task.id,
    title: task.title,
    notes: task.notes || null,
    priority: task.priority || "P2",
    due_date: task.due_date || null,
    is_completed: Boolean(task.is_completed),
    completed_at: task.completed_at || null,
    reminder_lead_time_minutes: task.reminder_lead_time_minutes || 15,
    estimated_duration_minutes: task.estimated_duration_minutes || null,
    source: task.source || "manual",
    course_name: task.course_name || null,
    external_url: task.external_url || null,
    created_at: task.created_at || new Date().toISOString(),
    updated_at: task.updated_at || new Date().toISOString(),
  };
}

/**
 * Prepares the full payload with all modern fields.
 */
function toFullPayload(task: Task) {
  return {
    ...toBasePayload(task),
    category: task.category || "personal",
    is_lecture_or_meeting: Boolean(task.is_lecture_or_meeting),
    canvas_uid: task.canvas_uid || null,
    recurrence: task.recurrence || null,
    recurring_parent_id: task.recurring_parent_id || null,
    google_event_id: task.google_event_id || null,
    google_calendar_id: task.google_calendar_id || null,
    is_pushed_to_google: Boolean(task.is_pushed_to_google),
  };
}

/**
 * Pushes a single task to Supabase with resilient fallback.
 */
export async function pushTaskToCloud(task: Task): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: "Supabase is not configured on this device" };
  }

  const supabase = createClient();
  const fullPayload = toFullPayload(task);

  try {
    const { error } = await supabase.from("tasks").upsert(fullPayload);
    if (!error) return { success: true };

    console.warn("[Supabase Sync] Upsert with full schema failed:", error.message);

    // If failure is due to missing columns in user's remote table, fallback to base schema
    if (
      error.message?.includes("column") ||
      error.message?.includes("schema cache") ||
      error.code === "PGRST204" ||
      error.code === "42703"
    ) {
      console.warn("[Supabase Sync] Retrying with baseline schema columns...");
      const basePayload = toBasePayload(task);
      const { error: fallbackError } = await supabase.from("tasks").upsert(basePayload);
      if (!fallbackError) {
        return { success: true };
      }
      console.error("[Supabase Sync] Fallback upsert also failed:", fallbackError);
      return { success: false, error: fallbackError.message };
    }

    return { success: false, error: error.message };
  } catch (err: any) {
    console.error("[Supabase Sync] Unexpected exception during upsert:", err);
    return { success: false, error: err?.message || String(err) };
  }
}

/**
 * Batched upsert to Supabase with fallback.
 */
export async function pushTasksBatchToCloud(tasks: Task[]): Promise<{ success: boolean; pushed: number; error?: string }> {
  if (!isSupabaseConfigured() || tasks.length === 0) {
    return { success: false, pushed: 0 };
  }

  const supabase = createClient();
  const fullList = tasks.map(toFullPayload);

  try {
    const { error } = await supabase.from("tasks").upsert(fullList);
    if (!error) return { success: true, pushed: tasks.length };

    console.warn("[Supabase Sync] Batch upsert with full schema failed:", error.message);

    // Fallback to base columns
    const baseList = tasks.map(toBasePayload);
    const { error: fallbackError } = await supabase.from("tasks").upsert(baseList);
    if (!fallbackError) {
      return { success: true, pushed: tasks.length };
    }

    console.error("[Supabase Sync] Batch fallback failed:", fallbackError);
    return { success: false, pushed: 0, error: fallbackError.message };
  } catch (err: any) {
    console.error("[Supabase Sync] Exception during batch upsert:", err);
    return { success: false, pushed: 0, error: err?.message || String(err) };
  }
}

/**
 * Deletes a task from Supabase.
 */
export async function deleteTaskFromCloud(taskId: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { success: false };

  try {
    const { error } = await createClient().from("tasks").delete().eq("id", taskId);
    if (error) {
      console.error("[Supabase Sync] Delete task failed:", error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

/**
 * Intelligent Two-Way Synchronization:
 * 1. Pulls all remote tasks from Supabase.
 * 2. Merges local and remote tasks (newest updated_at wins for each ID).
 * 3. Identifies local tasks that were created on this device but never made it to Supabase,
 *    and uploads them immediately.
 */
export async function syncTwoWayTasks(localTasks: Task[]): Promise<SyncResult> {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      tasks: localTasks,
      configured: false,
      error: "Supabase not configured",
    };
  }

  const supabase = createClient();

  try {
    const { data: remoteData, error } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[Supabase Sync] Failed to fetch remote tasks:", error);
      return {
        success: false,
        tasks: localTasks,
        configured: true,
        error: error.message,
      };
    }

    const remoteTasks = (remoteData || []) as Task[];

    // Merge tasks by ID
    const taskMap = new Map<string, Task>();

    // Add local tasks
    for (const t of localTasks) {
      taskMap.set(t.id, t);
    }

    // Merge remote tasks (prefer remote or newest)
    let pulledCount = 0;
    for (const rt of remoteTasks) {
      const local = taskMap.get(rt.id);
      if (!local) {
        taskMap.set(rt.id, rt);
        pulledCount++;
      } else {
        const remoteTime = new Date(rt.updated_at || 0).getTime();
        const localTime = new Date(local.updated_at || 0).getTime();
        if (remoteTime >= localTime) {
          taskMap.set(rt.id, rt);
        }
      }
    }

    // Check for local tasks missing on remote to push
    const missingOnRemote = localTasks.filter(
      (lt) => !remoteTasks.some((rt) => rt.id === lt.id)
    );

    let pushedCount = 0;
    if (missingOnRemote.length > 0) {
      console.log(`[Supabase Sync] Found ${missingOnRemote.length} local task(s) missing on remote. Pushing...`);
      const pushRes = await pushTasksBatchToCloud(missingOnRemote);
      pushedCount = pushRes.pushed;
    }

    const merged = Array.from(taskMap.values());

    return {
      success: true,
      tasks: merged,
      pushedCount,
      pulledCount,
      configured: true,
    };
  } catch (err: any) {
    console.error("[Supabase Sync] Exception during two-way sync:", err);
    return {
      success: false,
      tasks: localTasks,
      configured: true,
      error: err?.message || String(err),
    };
  }
}
