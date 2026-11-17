"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSettings } from "@/hooks/useSettings";
import { useTasks } from "@/hooks/useTasks";
import { useTheme } from "@/hooks/useTheme";
import { Header } from "@/components/Header";
import { QuickAddBar } from "@/components/QuickAddBar";
import { FilterBar } from "@/components/FilterBar";
import { TaskList } from "@/components/TaskList";
import { TaskEditModal } from "@/components/TaskEditModal";
import { SettingsDrawer } from "@/components/SettingsDrawer";
import { KeyboardShortcutsModal } from "@/components/KeyboardShortcutsModal";
import { PWAInstallBanner } from "@/components/PWAInstallBanner";
import { ToastContainer, ToastMessage } from "@/components/Toast";
import { Task } from "@/lib/types";

export default function Home() {
  const { theme, setTheme } = useTheme();
  const {
    settings,
    isLoaded: settingsLoaded,
    isSyncingCanvas,
    calendars,
    isLoadingCalendars,
    updateSettings,
    syncCanvasFeed,
    disconnectGoogle,
  } = useSettings();

  const {
    tasks,
    isLoaded: tasksLoaded,
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
  } = useTasks(settings);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const quickAddInputRef = useRef<HTMLInputElement>(null);

  const addToast = (type: "success" | "error" | "info", message: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Check URL parameters for OAuth callbacks
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);

    if (params.get("settings") === "true") {
      setIsSettingsOpen(true);
    }

    if (params.get("google") === "connected") {
      const email = params.get("email");
      addToast(
        "success",
        email
          ? `Google Calendar connected successfully (${email})`
          : "Google Calendar connected successfully!"
      );
      // Clean query params from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (params.get("google_error")) {
      addToast("error", `Google Auth failed: ${params.get("google_error")}`);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl?.tagName === "INPUT" ||
        activeEl?.tagName === "TEXTAREA" ||
        activeEl?.tagName === "SELECT";

      // Escape always closes open modals
      if (e.key === "Escape") {
        if (isShortcutsOpen) setIsShortcutsOpen(false);
        else if (editingTask) setEditingTask(null);
        else if (isSettingsOpen) setIsSettingsOpen(false);
        else if (isInput) (activeEl as HTMLElement).blur();
        return;
      }

      // If user is currently typing in an input, don't hijack keys
      if (isInput) return;

      if (e.key === "n" || e.key === "N" || e.key === "c" || e.key === "C") {
        e.preventDefault();
        quickAddInputRef.current?.focus();
      } else if (e.key === "/") {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
        searchInput?.focus();
      } else if (e.key === "?") {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isShortcutsOpen, editingTask, isSettingsOpen]);

  // Sync Canvas handler with toasts
  const handleSyncCanvas = async (urlOverride?: string) => {
    const url = urlOverride || settings.canvas_ics_url;
    if (!url) {
      setIsSettingsOpen(true);
      addToast("info", "Please enter your Canvas Calendar feed URL first.");
      return { success: false, error: "No URL provided" };
    }

    const res = await syncCanvasFeed(url, tasks);
    if (res.success && res.tasks) {
      setTasksFromCanvasSync(res.tasks);
      addToast(
        "success",
        `Canvas synced: ${res.importedCount} new, ${res.updatedCount} updated!`
      );
    } else {
      addToast("error", res.error || "Canvas synchronization failed.");
    }
    return res;
  };

  // Push to GCal handler with toast
  const handlePushToGCalWithToast = async (task: Task) => {
    const res = await pushTaskToGCal(task, settings);
    if (res.success) {
      addToast("success", `Pushed "${task.title}" to Google Calendar!`);
    } else {
      addToast("error", res.error || "Failed to push to Google Calendar.");
      if (res.error?.includes("Connect")) {
        setIsSettingsOpen(true);
      }
    }
    return res;
  };

  // Add Task handler with toast
  const handleAddTaskWithToast = async (taskData: Partial<Task>) => {
    const t = await addTask(taskData);
    addToast("success", `Added "${t.title}"`);
    return t;
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Top Header */}
      <Header
        activeCount={groupedTasks.totalActiveCount}
        settings={settings}
        isSyncingCanvas={isSyncingCanvas}
        onSyncCanvas={() => handleSyncCanvas()}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        theme={theme}
        onToggleTheme={() => setTheme(theme === "dark" ? "light" : "dark")}
      />

      {/* Main Content Area: Centered, Focused, Things 3 / Bear width */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 py-6 safe-bottom">
        {/* Quick Add Sticky Input Bar */}
        <QuickAddBar
          settings={settings}
          onAddTask={handleAddTaskWithToast}
          inputRef={quickAddInputRef}
        />

        {/* Filter and Sort Pills */}
        <FilterBar
          priorityFilter={priorityFilter}
          onPriorityChange={setPriorityFilter}
          sourceFilter={sourceFilter}
          onSourceChange={setSourceFilter}
          courseFilter={courseFilter}
          onCourseChange={setCourseFilter}
          availableCourses={availableCourses}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />

        {/* Task List */}
        <TaskList
          groupedTasks={groupedTasks}
          settings={settings}
          onToggleComplete={(id) => {
            toggleTaskComplete(id);
          }}
          onEdit={(task) => setEditingTask(task)}
          onDelete={async (id) => {
            await deleteTask(id);
            addToast("info", "Task deleted");
          }}
          onPushToGCal={handlePushToGCalWithToast}
        />
      </main>

      {/* Edit Task Modal */}
      <TaskEditModal
        task={editingTask}
        isOpen={Boolean(editingTask)}
        settings={settings}
        onClose={() => setEditingTask(null)}
        onSave={async (id, updates) => {
          await updateTask(id, updates);
          addToast("success", "Task updated");
        }}
        onDelete={async (id) => {
          await deleteTask(id);
          addToast("info", "Task deleted");
        }}
        onPushToGCal={handlePushToGCalWithToast}
      />

      {/* Settings Drawer */}
      <SettingsDrawer
        isOpen={isSettingsOpen}
        settings={settings}
        calendars={calendars}
        isLoadingCalendars={isLoadingCalendars}
        isSyncingCanvas={isSyncingCanvas}
        onClose={() => setIsSettingsOpen(false)}
        onUpdateSettings={updateSettings}
        onSyncCanvas={handleSyncCanvas}
        onDisconnectGoogle={async () => {
          await disconnectGoogle();
          addToast("info", "Google Calendar disconnected");
        }}
        onBatchPushGCal={async () => {
          return await batchPushAllToGCal(settings);
        }}
        theme={theme}
        onSetTheme={setTheme}
      />

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
}
