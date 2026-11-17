"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Task, UserSettings, Priority, TaskSource, SortOption } from "@/lib/types";
import { getLocalTasks, saveLocalTasks } from "@/lib/storage/localStore";
import { isToday, isTomorrow, isPast, startOfDay } from "date-fns";

export function useTasks(settings: UserSettings) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "all">("all");
  const [sourceFilter, setSourceFilter] = useState<TaskSource | "all">("all");
  const [courseFilter, setCourseFilter] = useState<string | "all">("all");
  const [sortBy, setSortBy] = useState<SortOption>("dueDate");

  // Load tasks on mount
  useEffect(() => {
    const loaded = getLocalTasks();
    setTasks(loaded);
    setIsLoaded(true);
  }, []);

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
        external_url: taskData.external_url || null,
        course_name: taskData.course_name ? taskData.course_name.toUpperCase() : null,
        canvas_uid: taskData.canvas_uid || null,
        is_pushed_to_google: false,
        created_at: nowIso,
        updated_at: nowIso,
      };

      // Optimistic state update
      const updatedList = [newTask, ...tasks];
      commitTasks(updatedList);

      // Auto-push to Google if enabled
      if (settings.google_auto_push_enabled && (settings.google_access_token || settings.google_refresh_token)) {
        pushTaskToGCal(newTask, settings).catch((err) =>
          console.error("Auto push to Google Calendar failed:", err)
        );
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
    (taskId: string) => {
      setTasks((prev) => {
        const next = prev.map((t) => {
          if (t.id === taskId) {
            const isNowCompleted = !t.is_completed;
            return {
              ...t,
              is_completed: isNowCompleted,
              completed_at: isNowCompleted ? new Date().toISOString() : null,
              updated_at: new Date().toISOString(),
            };
          }
          return t;
        });
        saveLocalTasks(next);
        return next;
      });
    },
    []
  );

  // Delete task
  const deleteTask = useCallback(
    async (taskId: string) => {
      const taskToDelete = tasks.find((t) => t.id === taskId);

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

      const next = tasks.filter((t) => t.id !== taskId);
      commitTasks(next);
    },
    [tasks, settings, commitTasks]
  );

  // Batch push all unsynced tasks to Google Calendar
  const batchPushAllToGCal = useCallback(
    async (userSettings: UserSettings): Promise<{ pushed: number; failed: number }> => {
      const unpushed = tasks.filter((t) => !t.is_completed && !t.is_pushed_to_google);
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
      commitTasks(newTasks);

      // If auto-push is enabled, push newly imported unpushed tasks
      if (settings.google_auto_push_enabled && (settings.google_access_token || settings.google_refresh_token)) {
        newTasks
          .filter((t) => t.source === "canvas" && !t.is_pushed_to_google && !t.is_completed)
          .forEach((t) => pushTaskToGCal(t, settings).catch(() => {}));
      }
    },
    [commitTasks, settings, pushTaskToGCal]
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
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = task.title.toLowerCase().includes(q);
        const matchNotes = task.notes?.toLowerCase().includes(q) || false;
        const matchCourse = task.course_name?.toLowerCase().includes(q) || false;
        if (!matchTitle && !matchNotes && !matchCourse) return false;
      }

      // Priority
      if (priorityFilter !== "all" && task.priority !== priorityFilter) {
        return false;
      }

      // Source
      if (sourceFilter !== "all" && task.source !== sourceFilter) {
        return false;
      }

      // Course
      if (courseFilter !== "all" && task.course_name !== courseFilter) {
        return false;
      }

      return true;
    });
  }, [tasks, searchQuery, priorityFilter, sourceFilter, courseFilter]);

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
    priorityFilter,
    setPriorityFilter,
    sourceFilter,
    setSourceFilter,
    courseFilter,
    setCourseFilter,
    sortBy,
    setSortBy,
    availableCourses,
    groupedTasks,
    addTask,
    updateTask,
    toggleTaskComplete,
    deleteTask,
    pushTaskToGCal,
    batchPushAllToGCal,
    setTasksFromCanvasSync,
  };
}
