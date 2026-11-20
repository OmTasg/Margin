"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Task, UserSettings, Priority, TaskSource, SortOption, TaskCategory } from "@/lib/types";
import { getLocalTasks, saveLocalTasks } from "@/lib/storage/localStore";
import { isSupabaseConfigured, createClient } from "@/lib/supabase/client";
import {
  pushTaskToCloud,
  pushTasksBatchToCloud,
  deleteTaskFromCloud,
  syncTwoWayTasks,
} from "@/lib/storage/supabaseStore";
import {
  resolveDirectCanvasUrl,
  calculateCanvasPriority,
  isMoreThanTwoDaysOverdue,
  isLectureOrMeeting,
  inferTaskCategory,
} from "@/lib/canvasUtils";
import { calculateNextTaskOccurrence } from "@/lib/recurrenceUtils";
import { isToday, isTomorrow, isPast, startOfDay } from "date-fns";

export function useTasks(settings: UserSettings) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [cloudSyncError, setCloudSyncError] = useState<string | null>(null);
  const [lastCloudSyncAt, setLastCloudSyncAt] = useState<Date | null>(null);
  const tasksRef = useRef<Task[]>(tasks);

  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPriorities, setSelectedPriorities] = useState<Priority[]>([]);
  const [sourceFilter, setSourceFilter] = useState<TaskSource | "all">("all");
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory | "all">("all");
  const [hideVirtualClasses, setHideVirtualClasses] = useState<boolean>(true);
  const [sortBy, setSortBy] = useState<SortOption>("dueDate");

  const togglePriorityFilter = useCallback((p: Priority) => {
    setSelectedPriorities((prev) => {
      if (prev.includes(p)) {
        return prev.filter((item) => item !== p);
      } else {
        return [...prev, p];
      }
    });
  }, []);

  const toggleCourseFilter = useCallback((course: string) => {
    setSelectedCourses((prev) =>
      prev.includes(course) ? prev.filter((c) => c !== course) : [...prev, course]
    );
  }, []);

  const clearCourseFilters = useCallback(() => {
    setSelectedCourses([]);
  }, []);

  const selectAllCourses = useCallback((courses: string[]) => {
    setSelectedCourses(courses);
  }, []);

  const toggleHideVirtualClasses = useCallback(() => {
    setHideVirtualClasses((prev) => !prev);
  }, []);

  // Helper to sanitize Canvas URLs, auto-prioritize, and auto-delete >2 days overdue tasks
  const sanitizeAndPruneTasks = useCallback((taskList: Task[]): { cleaned: Task[]; prunedIds: string[] } => {
    const prunedIds: string[] = [];
    const cleaned: Task[] = [];

    for (const t of taskList) {
      // 1. Prune legacy placeholder/sample tasks
      if (t.id?.startsWith("sample-") || t.canvas_uid?.startsWith("canvas-sample-")) {
        prunedIds.push(t.id);
        continue;
      }

      // 2. Auto-delete overdue tasks > 2 days overdue (48 hours)
      if (isMoreThanTwoDaysOverdue(t.due_date)) {
        prunedIds.push(t.id);
        continue;
      }

      // 3. Ensure direct Canvas assignment URL
      const directUrl = resolveDirectCanvasUrl(t.external_url, t.notes, t.canvas_uid);

      // 4. Dynamic auto-prioritization for active Canvas tasks
      let priority = t.priority;
      if (t.source === "canvas" && !t.is_completed && t.due_date) {
        priority = calculateCanvasPriority(t.due_date);
      }

      // 5. Detect meeting / lecture and category
      const isMeeting = t.is_lecture_or_meeting ?? isLectureOrMeeting(t);
      const category = t.category || inferTaskCategory(t.title, t.course_name);

      cleaned.push({
        ...t,
        priority,
        category,
        is_lecture_or_meeting: isMeeting,
        external_url: directUrl || t.external_url,
      });
    }

    return { cleaned, prunedIds };
  }, []);

  // Manual / auto cloud sync function
  const syncCloudTasks = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    setIsCloudSyncing(true);
    setCloudSyncError(null);
    try {
      const res = await syncTwoWayTasks(tasksRef.current);
      if (res.success && res.tasks) {
        const { cleaned } = sanitizeAndPruneTasks(res.tasks);
        setTasks(cleaned);
        saveLocalTasks(cleaned);
        setLastCloudSyncAt(new Date());
      } else if (res.error) {
        setCloudSyncError(res.error);
      }
    } catch (err: any) {
      setCloudSyncError(err?.message || String(err));
    } finally {
      setIsCloudSyncing(false);
    }
  }, [sanitizeAndPruneTasks]);

  // Load tasks on mount & listen to Supabase Realtime if configured
  useEffect(() => {
    const rawLocal = getLocalTasks();
    const { cleaned: loaded, prunedIds: localPruned } = sanitizeAndPruneTasks(rawLocal);
    setTasks(loaded);
    saveLocalTasks(loaded);
    setIsLoaded(true);

    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();

        // Remove any legacy sample tasks or overdue tasks from Supabase
        if (localPruned.length > 0) {
          supabase.from("tasks").delete().in("id", localPruned).then();
        }

        // 1. Two-way intelligent merge on load
        setIsCloudSyncing(true);
        syncTwoWayTasks(loaded).then((res) => {
          if (res.success && res.tasks) {
            const { cleaned: remoteCleaned } = sanitizeAndPruneTasks(res.tasks);
            setTasks(remoteCleaned);
            saveLocalTasks(remoteCleaned);
            setLastCloudSyncAt(new Date());
          } else if (res.error) {
            setCloudSyncError(res.error);
          }
          setIsCloudSyncing(false);
        });

        // 2. Realtime cross-device sync channel
        const channel = supabase
          .channel("realtime:tasks")
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "tasks" },
            (payload) => {
              if (payload.eventType === "INSERT") {
                const newTask = payload.new as Task;
                if (isMoreThanTwoDaysOverdue(newTask.due_date)) return;
                const directUrl = resolveDirectCanvasUrl(newTask.external_url, newTask.notes, newTask.canvas_uid);
                const sanitizedTask: Task = {
                  ...newTask,
                  external_url: directUrl || newTask.external_url,
                  priority:
                    newTask.source === "canvas" && !newTask.is_completed && newTask.due_date
                      ? calculateCanvasPriority(newTask.due_date)
                      : newTask.priority,
                };

                setTasks((prev) => {
                  if (prev.some((t) => t.id === sanitizedTask.id)) return prev;
                  const updated = [sanitizedTask, ...prev];
                  saveLocalTasks(updated);
                  return updated;
                });
              } else if (payload.eventType === "UPDATE") {
                const updatedItem = payload.new as Task;
                if (isMoreThanTwoDaysOverdue(updatedItem.due_date)) {
                  setTasks((prev) => {
                    const filtered = prev.filter((t) => t.id !== updatedItem.id);
                    saveLocalTasks(filtered);
                    return filtered;
                  });
                  return;
                }
                const directUrl = resolveDirectCanvasUrl(updatedItem.external_url, updatedItem.notes, updatedItem.canvas_uid);
                const sanitizedItem: Task = {
                  ...updatedItem,
                  external_url: directUrl || updatedItem.external_url,
                };

                setTasks((prev) => {
                  const updated = prev.map((t) =>
                    t.id === sanitizedItem.id ? sanitizedItem : t
                  );
                  saveLocalTasks(updated);
                  return updated;
                });
              } else if (payload.eventType === "DELETE") {
                setTasks((prev) => {
                  const updated = prev.filter((t) => t.id !== payload.old.id);
                  saveLocalTasks(updated);
                  return updated;
                });
              }
            }
          )
          .subscribe((status) => {
            console.log("[Supabase Realtime Channel Status]:", status);
          });

        return () => {
          supabase.removeChannel(channel);
        };
      } catch (err) {
        console.error("Supabase sync initialization error:", err);
      }
    }
  }, [sanitizeAndPruneTasks]);

  // Auto-sync when phone wakes up or user switches back to Margin tab + periodic interval
  useEffect(() => {
    const handleSyncOnVisible = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        syncCloudTasks();
      }
    };
    window.addEventListener("focus", handleSyncOnVisible);
    document.addEventListener("visibilitychange", handleSyncOnVisible);

    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        syncCloudTasks();
      }
    }, 10000);

    return () => {
      window.removeEventListener("focus", handleSyncOnVisible);
      document.removeEventListener("visibilitychange", handleSyncOnVisible);
      clearInterval(interval);
    };
  }, [syncCloudTasks]);

  // Sync to local storage
  const commitTasks = useCallback((newTasks: Task[]) => {
    setTasks(newTasks);
    saveLocalTasks(newTasks);
  }, []);

  // Push single task to Google Calendar
  const pushTaskToGCal = useCallback(
    async (task: Task, userSettings: UserSettings): Promise<{ success: boolean; error?: string }> => {
      if (!userSettings.google_access_token && !userSettings.google_refresh_token) {
        return { success: false, error: "Google Calendar is not connected. Connect in Settings." };
      }

      try {
        const res = await fetch("/api/google/push", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            task,
            calendarId: userSettings.google_selected_calendar_id || "primary",
            accessToken: userSettings.google_access_token,
            refreshToken: userSettings.google_refresh_token,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          return { success: false, error: data.error || "Failed to push to Google Calendar" };
        }

        // Update task with google_event_id
        setTasks((prev) => {
          const updated = prev.map((t) =>
            t.id === task.id
              ? {
                  ...t,
                  google_event_id: data.eventId,
                  google_calendar_id: userSettings.google_selected_calendar_id,
                  is_pushed_to_google: true,
                  updated_at: new Date().toISOString(),
                }
              : t
          );
          saveLocalTasks(updated);
          return updated;
        });

        return { success: true };
      } catch (err: any) {
        return { success: false, error: err?.message || "Network error pushing to Google Calendar" };
      }
    },
    []
  );

  // Add new task
  const addTask = useCallback(
    async (taskData: Partial<Task>): Promise<Task> => {
      const nowIso = new Date().toISOString();
      const reminderLeadTime =
        typeof taskData.reminder_lead_time_minutes === "number"
          ? taskData.reminder_lead_time_minutes
          : settings.default_reminder_lead_time_minutes;

      const finalCourse = taskData.course_name ? taskData.course_name.toUpperCase() : null;
      const finalCategory =
        taskData.category || inferTaskCategory(taskData.title?.trim() || "", finalCourse);
      const isMeeting = isLectureOrMeeting({
        title: taskData.title,
        notes: taskData.notes,
        course_name: finalCourse,
      });

      const newTask: Task = {
        id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        title: taskData.title?.trim() || "Untitled Task",
        notes: taskData.notes?.trim() || undefined,
        priority: taskData.priority || "P2",
        due_date: taskData.due_date || null,
        is_completed: false,
        reminder_lead_time_minutes: reminderLeadTime,
        estimated_duration_minutes: taskData.estimated_duration_minutes || null,
        source: taskData.source || "manual",
        category: finalCategory,
        is_lecture_or_meeting: isMeeting,
        external_url: taskData.external_url || null,
        course_name: finalCourse,
        canvas_uid: taskData.canvas_uid || null,
        recurrence: taskData.recurrence || null,
        recurring_parent_id: taskData.recurring_parent_id || null,
        is_pushed_to_google: false,
        created_at: nowIso,
        updated_at: nowIso,
      };

      // Optimistic state update
      const updatedList = [newTask, ...tasks];
      commitTasks(updatedList);

      // Cloud sync with resilient schema fallback
      if (isSupabaseConfigured()) {
        pushTaskToCloud(newTask).then((res) => {
          if (!res.success && res.error) {
            console.warn("[Cloud Sync] Failed to push new task:", res.error);
          }
        });
      }

      // Auto-push to Google if enabled
      if (settings.google_auto_push_enabled && (settings.google_access_token || settings.google_refresh_token)) {
        if (!(settings.google_skip_canvas_tasks && newTask.source === "canvas")) {
          pushTaskToGCal(newTask, settings).catch((err) =>
            console.error("Auto push to Google Calendar failed:", err)
          );
        }
      }

      return newTask;
    },
    [tasks, settings, commitTasks, pushTaskToGCal]
  );

  // Update existing task
  const updateTask = useCallback(
    async (taskId: string, updates: Partial<Task>) => {
      const existing = tasks.find((t) => t.id === taskId);
      if (!existing) return;

      const updatedTask: Task = {
        ...existing,
        ...updates,
        updated_at: new Date().toISOString(),
      };

      setTasks((prev) => {
        const next = prev.map((t) => (t.id === taskId ? updatedTask : t));
        saveLocalTasks(next);
        return next;
      });

      // Cloud sync with resilient schema fallback
      if (isSupabaseConfigured()) {
        pushTaskToCloud(updatedTask).then((res) => {
          if (!res.success && res.error) {
            console.warn("[Cloud Sync] Failed to update task:", res.error);
          }
        });
      }

      // If task is pushed to Google or auto-push is enabled and date/reminder/title changed, sync to GCal
      if (
        (updatedTask.is_pushed_to_google || settings.google_auto_push_enabled) &&
        (settings.google_access_token || settings.google_refresh_token)
      ) {
        pushTaskToGCal(updatedTask, settings).catch((err) =>
          console.error("GCal sync on update failed:", err)
        );
      }
    },
    [tasks, settings, pushTaskToGCal]
  );

  // Toggle complete
  const toggleTaskComplete = useCallback(
    (taskId: string): { task: Task; wasCompleted: boolean } | null => {
      const existing = tasksRef.current.find((t) => t.id === taskId);
      if (!existing) return null;

      const isNowCompleted = !existing.is_completed;
      let nextRecurringTask: Task | null = null;

      // If completing a recurring task, calculate next occurrence
      if (isNowCompleted && existing.recurrence && existing.recurrence.frequency !== "none") {
        nextRecurringTask = calculateNextTaskOccurrence(existing);
      }

      const updatedTask: Task = {
        ...existing,
        is_completed: isNowCompleted,
        completed_at: isNowCompleted ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      };

      setTasks((prev) => {
        const next = prev.map((t) => (t.id === taskId ? updatedTask : t));
        const updatedWithSpawned = nextRecurringTask ? [nextRecurringTask, ...next] : next;
        saveLocalTasks(updatedWithSpawned);
        return updatedWithSpawned;
      });

      // Synchronously push to Supabase so mobile and laptop reconcile instantly
      if (isSupabaseConfigured()) {
        pushTaskToCloud(updatedTask).catch((err) =>
          console.error("[Cloud Sync] Failed to push toggled task:", err)
        );
        if (nextRecurringTask) {
          pushTaskToCloud(nextRecurringTask).catch((err) =>
            console.error("[Cloud Sync] Failed to push next recurring task:", err)
          );
        }
      }

      // Check push notifications to update lock screen schedule
      if (typeof window !== "undefined") {
        fetch("/api/push/check", { method: "POST" }).catch(() => {});
      }

      return { task: updatedTask, wasCompleted: isNowCompleted };
    },
    []
  );

  // Delete task
  const deleteTask = useCallback(
    async (taskId: string) => {
      const taskToDelete = tasksRef.current.find((t) => t.id === taskId);

      // Cloud delete
      if (isSupabaseConfigured()) {
        deleteTaskFromCloud(taskId).catch((err) =>
          console.error("[Cloud Sync] Failed to delete task:", err)
        );
      }

      // Delete from Google Calendar if event exists
      if (
        taskToDelete?.google_event_id &&
        (settings.google_access_token || settings.google_refresh_token)
      ) {
        fetch("/api/google/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventId: taskToDelete.google_event_id,
            calendarId: taskToDelete.google_calendar_id || settings.google_selected_calendar_id,
            accessToken: settings.google_access_token,
            refreshToken: settings.google_refresh_token,
          }),
        }).catch((err) => console.error("Error deleting from GCal:", err));
      }

      setTasks((prev) => {
        const next = prev.filter((t) => t.id !== taskId);
        saveLocalTasks(next);
        return next;
      });
    },
    [settings]
  );

  // Batch push all unsynced tasks to Google Calendar
  const batchPushAllToGCal = useCallback(
    async (userSettings: UserSettings): Promise<{ pushed: number; failed: number }> => {
      const unpushed = tasks.filter((t) => {
        if (t.is_completed || t.is_pushed_to_google) return false;
        if (userSettings.google_skip_canvas_tasks && t.source === "canvas") return false;
        return true;
      });
      let pushed = 0;
      let failed = 0;

      for (const t of unpushed) {
        const res = await pushTaskToGCal(t, userSettings);
        if (res.success) pushed++;
        else failed++;
      }

      return { pushed, failed };
    },
    [tasks, pushTaskToGCal]
  );

  // Set tasks after Canvas Sync
  const setTasksFromCanvasSync = useCallback(
    (newTasks: Task[]) => {
      const { cleaned, prunedIds } = sanitizeAndPruneTasks(newTasks);
      commitTasks(cleaned);

      if (isSupabaseConfigured()) {
        const supabase = createClient();
        if (prunedIds.length > 0) {
          supabase.from("tasks").delete().in("id", prunedIds).then();
        }
        pushTasksBatchToCloud(cleaned);
      }

      // If auto-push is enabled and Canvas tasks are not skipped, push newly imported unpushed tasks
      if (
        settings.google_auto_push_enabled &&
        !settings.google_skip_canvas_tasks &&
        (settings.google_access_token || settings.google_refresh_token)
      ) {
        cleaned
          .filter((t) => t.source === "canvas" && !t.is_pushed_to_google && !t.is_completed)
          .forEach((t) => pushTaskToGCal(t, settings).catch(() => {}));
      }
    },
    [commitTasks, sanitizeAndPruneTasks, settings, pushTaskToGCal]
  );

  // Distinct courses for filter dropdown
  const availableCourses = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => {
      if (t.course_name) set.add(t.course_name);
    });
    return Array.from(set).sort();
  }, [tasks]);

  // Filtered & Sorted Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // 1. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = task.title.toLowerCase().includes(q);
        const matchNotes = task.notes?.toLowerCase().includes(q) || false;
        const matchCourse = task.course_name?.toLowerCase().includes(q) || false;
        if (!matchTitle && !matchNotes && !matchCourse) return false;
      }

      // 2. Hide virtual classes / Zoom lectures if toggle is active
      if (hideVirtualClasses && (task.is_lecture_or_meeting || isLectureOrMeeting(task))) {
        return false;
      }

      // 3. Priority Multi-Select
      if (selectedPriorities.length > 0 && !selectedPriorities.includes(task.priority)) {
        return false;
      }

      // 4. Source filter
      if (sourceFilter !== "all" && task.source !== sourceFilter) {
        return false;
      }

      // 5. Course Multi-Select filter
      if (selectedCourses.length > 0) {
        if (!task.course_name || !selectedCourses.includes(task.course_name)) {
          return false;
        }
      }

      // 6. Category filter
      if (selectedCategory !== "all") {
        const cat = task.category || inferTaskCategory(task.title, task.course_name);
        if (cat !== selectedCategory) {
          return false;
        }
      }

      return true;
    });
  }, [
    tasks,
    searchQuery,
    hideVirtualClasses,
    selectedPriorities,
    sourceFilter,
    selectedCourses,
    selectedCategory,
  ]);

  // Dedicated shopping tasks memo
  const shoppingTasks = useMemo(() => {
    return tasks.filter((t) => t.category === "shopping");
  }, [tasks]);

  const activeShoppingCount = useMemo(() => {
    return shoppingTasks.filter((t) => !t.is_completed).length;
  }, [shoppingTasks]);

  // Single shopping item add
  const addShoppingItem = useCallback(
    async (title: string, notes?: string): Promise<Task> => {
      return addTask({
        title,
        notes,
        category: "shopping",
        source: "manual",
        priority: "P2",
        due_date: null,
      });
    },
    [addTask]
  );

  // Batch add shopping items (for comma-separated multi-import)
  const addShoppingItemsBatch = useCallback(
    async (titles: string[]): Promise<Task[]> => {
      const nowIso = new Date().toISOString();
      const validTitles = titles
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      if (validTitles.length === 0) return [];

      const newTasks: Task[] = validTitles.map((title, idx) => ({
        id: `task-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
        title,
        notes: undefined,
        priority: "P2",
        due_date: null,
        is_completed: false,
        reminder_lead_time_minutes: settings.default_reminder_lead_time_minutes || 15,
        estimated_duration_minutes: null,
        source: "manual",
        category: "shopping",
        is_lecture_or_meeting: false,
        external_url: null,
        course_name: null,
        canvas_uid: null,
        recurrence: null,
        recurring_parent_id: null,
        is_pushed_to_google: false,
        created_at: nowIso,
        updated_at: nowIso,
      }));

      setTasks((prev) => {
        const next = [...newTasks, ...prev];
        saveLocalTasks(next);
        return next;
      });

      if (isSupabaseConfigured()) {
        pushTasksBatchToCloud(newTasks).catch((err) =>
          console.error("[Cloud Sync] Failed to batch push shopping items:", err)
        );
      }

      return newTasks;
    },
    [settings]
  );

  // Clear completed shopping items
  const clearCompletedShoppingItems = useCallback(async () => {
    const toDelete = tasksRef.current.filter(
      (t) => t.category === "shopping" && t.is_completed
    );
    if (toDelete.length === 0) return;

    const idsToDelete = toDelete.map((t) => t.id);

    setTasks((prev) => {
      const next = prev.filter((t) => !idsToDelete.includes(t.id));
      saveLocalTasks(next);
      return next;
    });

    if (isSupabaseConfigured()) {
      idsToDelete.forEach((id) => {
        deleteTaskFromCloud(id).catch(() => {});
      });
    }
  }, []);

  // Grouped active tasks
  const groupedTasks = useMemo(() => {
    const overdue: Task[] = [];
    const today: Task[] = [];
    const tomorrow: Task[] = [];
    const later: Task[] = [];
    const noDueDate: Task[] = [];
    const completed: Task[] = [];

    const now = new Date();
    const startOfToday = startOfDay(now);

    filteredTasks.forEach((task) => {
      // Exclude pure unscheduled shopping items from main task groupings
      if (task.category === "shopping" && !task.due_date && selectedCategory !== "shopping") {
        return;
      }

      if (task.is_completed) {
        completed.push(task);
        return;
      }

      if (!task.due_date) {
        noDueDate.push(task);
        return;
      }

      const dueDate = new Date(task.due_date);
      if (isNaN(dueDate.getTime())) {
        noDueDate.push(task);
        return;
      }

      if (isToday(dueDate)) {
        today.push(task);
      } else if (dueDate < startOfToday) {
        overdue.push(task);
      } else if (isTomorrow(dueDate)) {
        tomorrow.push(task);
      } else {
        later.push(task);
      }
    });

    // Sorter function
    const sorter = (a: Task, b: Task) => {
      if (sortBy === "priority") {
        const priorityOrder: Record<Priority, number> = { P1: 1, P2: 2, P3: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      if (sortBy === "title") {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === "course") {
        return (a.course_name || "ZZZ").localeCompare(b.course_name || "ZZZ");
      }
      // default: dueDate
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    };

    overdue.sort(sorter);
    today.sort(sorter);
    tomorrow.sort(sorter);
    later.sort(sorter);
    noDueDate.sort(sorter);
    completed.sort((a, b) => {
      const aTime = a.completed_at ? new Date(a.completed_at).getTime() : 0;
      const bTime = b.completed_at ? new Date(b.completed_at).getTime() : 0;
      return bTime - aTime;
    });

    return {
      overdue,
      today,
      tomorrow,
      later,
      noDueDate,
      completed,
      totalActiveCount: overdue.length + today.length + tomorrow.length + later.length + noDueDate.length,
    };
  }, [filteredTasks, sortBy]);

  return {
    tasks,
    isLoaded,
    searchQuery,
    setSearchQuery,
    selectedPriorities,
    setSelectedPriorities,
    togglePriorityFilter,
    sourceFilter,
    setSourceFilter,
    selectedCourses,
    setSelectedCourses,
    toggleCourseFilter,
    clearCourseFilters,
    selectAllCourses,
    selectedCategory,
    setSelectedCategory,
    hideVirtualClasses,
    setHideVirtualClasses,
    toggleHideVirtualClasses,
    sortBy,
    setSortBy,
    availableCourses,
    groupedTasks,
    shoppingTasks,
    activeShoppingCount,
    isCloudSyncing,
    cloudSyncError,
    lastCloudSyncAt,
    syncCloudTasks,
    addTask,
    updateTask,
    toggleTaskComplete,
    deleteTask,
    pushTaskToGCal,
    batchPushAllToGCal,
    setTasksFromCanvasSync,
    addShoppingItem,
    addShoppingItemsBatch,
    clearCompletedShoppingItems,
  };
}
