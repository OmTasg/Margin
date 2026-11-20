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
 * Encodes category tag into notes so that shopping items remain shopping items
 * even when the remote Supabase table lacks a dedicated 'category' column.
 */
function embedCategoryInNotes(notes: string | undefined | null, category?: string | null, isShop?: boolean): string | null {
  const isShopping = isShop || category === "shopping";
  if (!isShopping) return notes || null;

  if (!notes || notes.trim() === "") {
    return "[category:shopping]";
  }
  if (!notes.includes("[category:shopping]") && !notes.includes("[shopping]")) {
    return `${notes}\n[category:shopping]`;
  }
  return notes;
}

/**
 * Extracts category and cleans notes if category was embedded.
 */
export function extractEmbeddedCategory(task: {
  id?: string;
  category?: string | null;
  notes?: string | null;
}): { category: string; cleanNotes?: string } {
  const isShop =
    task.id?.startsWith("shop-") ||
    task.category === "shopping" ||
    (typeof task.notes === "string" &&
      (task.notes.includes("[category:shopping]") || task.notes.includes("[shopping]")));

  if (isShop) {
    let cleanNotes = task.notes || undefined;
    if (cleanNotes) {
      cleanNotes = cleanNotes
        .replace(/\[category:shopping\]/g, "")
        .replace(/\[shopping\]/g, "")
        .trim();
      if (cleanNotes === "") cleanNotes = undefined;
    }
    return { category: "shopping", cleanNotes };
  }

  return { category: task.category || "personal", cleanNotes: task.notes || undefined };
}

/**
 * Tier 1: Full payload containing all modern schema columns.
 */
function toFullPayload(task: Task) {
  const isShop = task.id?.startsWith("shop-") || task.category === "shopping";
  return {
    id: task.id,
    title: task.title,
    notes: embedCategoryInNotes(task.notes, task.category, isShop),
    priority: task.priority || "P2",
    due_date: task.due_date || null,
    is_completed: Boolean(task.is_completed),
    completed_at: task.completed_at || null,
    reminder_lead_time_minutes: task.reminder_lead_time_minutes || 15,
    estimated_duration_minutes: task.estimated_duration_minutes || null,
    source: task.source || "manual",
    category: isShop ? "shopping" : (task.category || "personal"),
    is_lecture_or_meeting: Boolean(task.is_lecture_or_meeting),
    course_name: task.course_name || null,
    external_url: task.external_url || null,
    canvas_uid: task.canvas_uid || null,
    recurrence: task.recurrence || null,
    recurring_parent_id: task.recurring_parent_id || null,
    google_event_id: task.google_event_id || null,
    google_calendar_id: task.google_calendar_id || null,
    is_pushed_to_google: Boolean(task.is_pushed_to_google),
    created_at: task.created_at || new Date().toISOString(),
    updated_at: task.updated_at || new Date().toISOString(),
  };
}

/**
 * Tier 2: Compatible payload containing only baseline columns guaranteed to exist
 * in standard Margin Supabase tables (omits 'category', 'is_lecture_or_meeting', 'recurrence').
 * Shopping status is permanently preserved via the immutable 'shop-' ID prefix and embedded notes tag.
 */
function toCompatiblePayload(task: Task) {
  const isShop = task.id?.startsWith("shop-") || task.category === "shopping";
  return {
    id: task.id,
    title: task.title,
    notes: embedCategoryInNotes(task.notes, task.category, isShop),
    priority: task.priority || "P2",
    due_date: task.due_date || null,
    is_completed: Boolean(task.is_completed),
    completed_at: task.completed_at || null,
    reminder_lead_time_minutes: task.reminder_lead_time_minutes || 15,
    estimated_duration_minutes: task.estimated_duration_minutes || null,
    source: task.source || "manual",
    course_name: task.course_name || null,
    external_url: task.external_url || null,
    canvas_uid: task.canvas_uid || null,
    google_event_id: task.google_event_id || null,
    google_calendar_id: task.google_calendar_id || null,
    is_pushed_to_google: Boolean(task.is_pushed_to_google),
    created_at: task.created_at || new Date().toISOString(),
    updated_at: task.updated_at || new Date().toISOString(),
  };
}

/**
 * Tier 3: Absolute emergency minimal payload for degraded or custom database schemas.
 */
function toMinimalPayload(task: Task) {
  const isShop = task.id?.startsWith("shop-") || task.category === "shopping";
  return {
    id: task.id,
    title: task.title,
    notes: embedCategoryInNotes(task.notes, task.category, isShop),
    is_completed: Boolean(task.is_completed),
    completed_at: task.completed_at || null,
    source: task.source || "manual",
    created_at: task.created_at || new Date().toISOString(),
    updated_at: task.updated_at || new Date().toISOString(),
  };
}

/**
 * Pushes a single task to Supabase with resilient 3-tier fallback.
 */
export async function pushTaskToCloud(task: Task): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: "Supabase is not configured on this device" };
  }

  const supabase = createClient();

  // Tier 1: Try full modern schema
  try {
    const { error } = await supabase.from("tasks").upsert(toFullPayload(task));
    if (!error) return { success: true };

    console.warn("[Supabase Sync] Tier 1 upsert failed (schema mismatch):", error.message);
  } catch (err: any) {
    console.warn("[Supabase Sync] Tier 1 exception:", err);
  }

  // Tier 2: Try compatible schema (verified columns without missing modern columns)
  try {
    const { error: tier2Error } = await supabase.from("tasks").upsert(toCompatiblePayload(task));
    if (!tier2Error) {
      return { success: true };
    }
    console.warn("[Supabase Sync] Tier 2 compatible upsert failed:", tier2Error.message);
  } catch (err: any) {
    console.warn("[Supabase Sync] Tier 2 exception:", err);
  }

  // Tier 3: Minimal fallback
  try {
    const { error: tier3Error } = await supabase.from("tasks").upsert(toMinimalPayload(task));
    if (!tier3Error) {
      return { success: true };
    }
    console.error("[Supabase Sync] Tier 3 minimal upsert failed:", tier3Error.message);
    return { success: false, error: tier3Error.message };
  } catch (err: any) {
    console.error("[Supabase Sync] All upsert tiers failed:", err);
    return { success: false, error: err?.message || String(err) };
  }
}

/**
 * Batched upsert to Supabase with resilient 3-tier fallback.
 */
export async function pushTasksBatchToCloud(
  tasks: Task[]
): Promise<{ success: boolean; pushed: number; error?: string }> {
  if (!isSupabaseConfigured() || tasks.length === 0) {
    return { success: false, pushed: 0 };
  }

  const supabase = createClient();

  // Tier 1: Full payload
  try {
    const fullList = tasks.map(toFullPayload);
    const { error } = await supabase.from("tasks").upsert(fullList);
    if (!error) return { success: true, pushed: tasks.length };

    console.warn("[Supabase Sync] Batch Tier 1 failed:", error.message);
  } catch (err: any) {
    console.warn("[Supabase Sync] Batch Tier 1 exception:", err);
  }

  // Tier 2: Compatible payload
  try {
    const compatibleList = tasks.map(toCompatiblePayload);
    const { error: tier2Error } = await supabase.from("tasks").upsert(compatibleList);
    if (!tier2Error) {
      return { success: true, pushed: tasks.length };
    }
    console.warn("[Supabase Sync] Batch Tier 2 failed:", tier2Error.message);
  } catch (err: any) {
    console.warn("[Supabase Sync] Batch Tier 2 exception:", err);
  }

  // Tier 3: Minimal payload
  try {
    const minimalList = tasks.map(toMinimalPayload);
    const { error: tier3Error } = await supabase.from("tasks").upsert(minimalList);
    if (!tier3Error) {
      return { success: true, pushed: tasks.length };
    }
    console.error("[Supabase Sync] Batch Tier 3 failed:", tier3Error.message);
    return { success: false, pushed: 0, error: tier3Error.message };
  } catch (err: any) {
    console.error("[Supabase Sync] Batch upsert exception:", err);
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
 * 3. Preserves shopping category even if remote table lacks 'category' column.
 * 4. Pushes any local tasks missing on remote or updated locally.
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

    const rawRemoteTasks = (remoteData || []) as any[];

    // Normalize remote tasks (extract embedded category and ensure shopping items are preserved)
    const remoteTasks: Task[] = rawRemoteTasks.map((rt) => {
      const { category, cleanNotes } = extractEmbeddedCategory(rt);
      return {
        ...rt,
        category,
        notes: cleanNotes,
      };
    });

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
          const isShop =
            rt.category === "shopping" ||
            rt.id?.startsWith("shop-") ||
            local.category === "shopping" ||
            local.id?.startsWith("shop-");

          taskMap.set(rt.id, {
            ...rt,
            category: isShop ? "shopping" : rt.category,
          });
        }
      }
    }

    // Identify local tasks that need to be pushed to Supabase:
    // 1. Missing entirely on remote
    // 2. Or updated locally more recently than remote (e.g. offline toggle/edit)
    const tasksToPush = localTasks.filter((lt) => {
      const rt = remoteTasks.find((r) => r.id === lt.id);
      if (!rt) return true;
      const localTime = new Date(lt.updated_at || 0).getTime();
      const remoteTime = new Date(rt.updated_at || 0).getTime();
      return localTime > remoteTime;
    });

    let pushedCount = 0;
    if (tasksToPush.length > 0) {
      console.log(`[Supabase Sync] Pushing ${tasksToPush.length} task(s) to cloud...`);
      const pushRes = await pushTasksBatchToCloud(tasksToPush);
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
