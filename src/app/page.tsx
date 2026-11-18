"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSettings } from "@/hooks/useSettings";
import { useTasks } from "@/hooks/useTasks";
import { useTheme } from "@/hooks/useTheme";
import { Header } from "@/components/Header";
import { ViewTabBar } from "@/components/ViewTabBar";
import { FilterBar } from "@/components/FilterBar";
import { TaskList, ViewTab } from "@/components/TaskList";
import { CalendarView } from "@/components/CalendarView";
import { NewTaskModal } from "@/components/NewTaskModal";
import { TaskEditModal } from "@/components/TaskEditModal";
import { SettingsDrawer } from "@/components/SettingsDrawer";
import { KeyboardShortcutsModal } from "@/components/KeyboardShortcutsModal";
import { ToastContainer, ToastMessage } from "@/components/Toast";
import { Task } from "@/lib/types";

export default function Home() {
  const { theme, setTheme } = useTheme();
  const {
    settings,
    isSyncingCanvas,
    calendars,
    isLoadingCalendars,
    updateSettings,
    syncCanvasFeed,
    disconnectGoogle,
  } = useSettings();

  const {
    tasks,
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
    addTask,
    updateTask,
    toggleTaskComplete,
    deleteTask,
    pushTaskToGCal,
    batchPushAllToGCal,
    setTasksFromCanvasSync,
  } = useTasks(settings);

  // View Navigation: "today" | "upcoming" | "calendar" | "all" | "completed"
  const [currentView, setCurrentView] = useState<ViewTab>("today");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [newTaskInitialDate, setNewTaskInitialDate] = useState<Date | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

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

      if (e.key === "Escape") {
        if (isShortcutsOpen) setIsShortcutsOpen(false);
        else if (isNewTaskOpen) setIsNewTaskOpen(false);
        else if (editingTask) setEditingTask(null);
        else if (isSettingsOpen) setIsSettingsOpen(false);
        else if (isInput) (activeEl as HTMLElement).blur();
        return;
      }

      if (isInput) return;

      if (e.key === "n" || e.key === "N" || e.key === "c" || e.key === "C") {
        e.preventDefault();
        setNewTaskInitialDate(null);
        setIsNewTaskOpen(true);
      } else if (e.key === "1") {
        e.preventDefault();
        setCurrentView("today");
      } else if (e.key === "2") {
        e.preventDefault();
        setCurrentView("upcoming");
      } else if (e.key === "3") {
        e.preventDefault();
        setCurrentView("calendar");
      } else if (e.key === "4") {
        e.preventDefault();
        setCurrentView("all");
      } else if (e.key === "5") {
        e.preventDefault();
        setCurrentView("completed");
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
  }, [isShortcutsOpen, isNewTaskOpen, editingTask, isSettingsOpen]);

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
    addToast("success", `Created "${t.title}"`);
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

      {/* Main Responsive Canvas: Wide on laptop/desktop, comfortable padding, elevated surface card */}
      <main
        className={`flex-1 w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-7 safe-bottom transition-all duration-200 ${
          currentView === "calendar"
            ? "max-w-7xl 2xl:max-w-[1500px]"
            : "max-w-5xl lg:max-w-6xl"
        }`}
      >
        {/* Elevated Surface Card Container with strong contrast separation from background */}
        <div className="bg-white dark:bg-[#14151c] border border-zinc-200/90 dark:border-zinc-800/90 rounded-2xl shadow-sm p-4 sm:p-7 transition-colors">
          {/* Prominent View Navigation Tab Bar with counts & + New Task button */}
          <ViewTabBar
            currentView={currentView}
            onViewChange={setCurrentView}
            counts={{
              today: groupedTasks.today.length + groupedTasks.overdue.length,
              upcoming: groupedTasks.tomorrow.length + groupedTasks.later.length,
              all: groupedTasks.totalActiveCount,
              completed: groupedTasks.completed.length,
            }}
            onOpenNewTask={() => {
              setNewTaskInitialDate(null);
              setIsNewTaskOpen(true);
            }}
          />

          {/* Filter Bar (Multi-Select Classes, Categories, Hide Zoom Lectures, Priorities, Sort) */}
          {currentView !== "calendar" && (
            <FilterBar
              selectedPriorities={selectedPriorities}
              onTogglePriority={togglePriorityFilter}
              onClearPriorities={() => setSelectedPriorities([])}
              sourceFilter={sourceFilter}
              onSourceChange={setSourceFilter}
              selectedCourses={selectedCourses}
              onToggleCourse={toggleCourseFilter}
              onClearCourses={clearCourseFilters}
              onSelectAllCourses={selectAllCourses}
              availableCourses={availableCourses}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              hideVirtualClasses={hideVirtualClasses}
              onToggleHideVirtualClasses={toggleHideVirtualClasses}
              sortBy={sortBy}
              onSortChange={setSortBy}
              showSort={currentView !== "completed"}
            />
          )}

          {/* Dynamic Content: Calendar View vs Tabbed Task List */}
          {currentView === "calendar" ? (
            <CalendarView
              tasks={tasks}
              settings={settings}
              hideLectures={hideVirtualClasses}
              onToggleHideLectures={toggleHideVirtualClasses}
              onToggleComplete={(id) => toggleTaskComplete(id)}
              onEditTask={(task) => setEditingTask(task)}
              onAddTaskOnDate={(date) => {
                setNewTaskInitialDate(date);
                setIsNewTaskOpen(true);
              }}
            />
          ) : (
            <TaskList
              groupedTasks={groupedTasks}
              currentView={currentView}
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
              onOpenNewTask={() => {
                setNewTaskInitialDate(null);
                setIsNewTaskOpen(true);
              }}
            />
          )}
        </div>
      </main>

      {/* Dedicated Clean New Task Modal */}
      <NewTaskModal
        isOpen={isNewTaskOpen}
        onClose={() => setIsNewTaskOpen(false)}
        onAddTask={handleAddTaskWithToast}
        settings={settings}
        availableCourses={availableCourses}
        initialDate={newTaskInitialDate}
      />

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
