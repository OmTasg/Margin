"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
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
import { ShoppingListView } from "@/components/ShoppingListView";
import { Task } from "@/lib/types";
import { useNotificationScheduler } from "@/hooks/useNotificationScheduler";
import { Bell } from "lucide-react";
import { format, isToday, isTomorrow } from "date-fns";

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
    shoppingTasks,
    activeShoppingCount,
    isCloudSyncing,
    cloudSyncError,
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
  } = useTasks(settings);

  // View Navigation: "today" | "upcoming" | "calendar" | "all" | "completed"
  const [currentView, setCurrentView] = useState<ViewTab>("today");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [newTaskInitialDate, setNewTaskInitialDate] = useState<Date | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback(
    (
      type: "success" | "error" | "info",
      message: string,
      action?: { label: string; onClick: () => void }
    ) => {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev, { id, type, message, action }]);
    },
    []
  );

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleToggleTask = useCallback(
    (taskId: string) => {
      const res = toggleTaskComplete(taskId);
      if (!res) return;
      const { task, wasCompleted } = res;
      if (wasCompleted) {
        addToast("success", `Cleared "${task.title}"`, {
          label: "Undo",
          onClick: () => {
            toggleTaskComplete(taskId);
          },
        });
      } else {
        addToast("info", `Restored "${task.title}"`);
      }
    },
    [toggleTaskComplete, addToast]
  );

  const [isNotifBannerDismissed, setIsNotifBannerDismissed] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsNotifBannerDismissed(
        localStorage.getItem("margin_notif_banner_dismissed") === "true"
      );
    }
  }, []);

  // Automated background reminder and notification scheduler
  const {
    permission: notificationPermission,
    requestPermission: requestNotifications,
  } = useNotificationScheduler({
    tasks,
    settings,
    onNotifyInApp: (info) => {
      addToast(info.type === "warning" ? "info" : "info", `${info.title}: ${info.message}`);
    },
  });

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
        setCurrentView("shopping");
      } else if (e.key === "5") {
        e.preventDefault();
        setCurrentView("all");
      } else if (e.key === "6") {
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

  // Add Task handler with contextual feedback & one-click navigation
  const handleAddTaskWithToast = async (taskData: Partial<Task>) => {
    const t = await addTask(taskData);
    if (t.category === "shopping" || t.id.startsWith("shop-")) {
      addToast("success", `Added "${t.title}" to Shopping List`, {
        label: "View Shopping",
        onClick: () => setCurrentView("shopping"),
      });
    } else if (!t.due_date) {
      addToast("success", `Created "${t.title}" (Anytime)`, {
        label: "View All",
        onClick: () => setCurrentView("all"),
      });
    } else {
      const d = new Date(t.due_date);
      if (isToday(d)) {
        addToast("success", `Created "${t.title}" for Today`);
        if (currentView !== "today" && currentView !== "calendar") {
          setCurrentView("today");
        }
      } else if (isTomorrow(d)) {
        addToast("success", `Created "${t.title}" for Tomorrow`, {
          label: "View in Upcoming",
          onClick: () => setCurrentView("upcoming"),
        });
      } else {
        addToast("success", `Created "${t.title}" for ${format(d, "EEE, MMM d")}`, {
          label: "View in Calendar",
          onClick: () => setCurrentView("calendar"),
        });
      }
    }
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
        notificationPermission={notificationPermission}
        isCloudSyncing={isCloudSyncing}
        onSyncCloud={syncCloudTasks}
      />

      {/* Main Responsive Canvas: Wide on laptop/desktop, comfortable padding, elevated surface card */}
      <main
        className={`flex-1 w-full mx-auto px-2 sm:px-6 lg:px-8 py-3 sm:py-7 safe-bottom transition-all duration-200 ${
          currentView === "calendar"
            ? "max-w-7xl 2xl:max-w-[1500px]"
            : "max-w-5xl lg:max-w-6xl"
        }`}
      >
        {/* Elevated Surface Card Container with strong contrast separation from background */}
        <div className="bg-white dark:bg-[#14151c] border border-zinc-200/90 dark:border-zinc-800/90 rounded-2xl shadow-sm p-3 sm:p-7 transition-colors">
          {/* Prominent View Navigation Tab Bar with counts & + New Task button */}
          <ViewTabBar
            currentView={currentView}
            onViewChange={setCurrentView}
            counts={{
              today: groupedTasks.today.length + groupedTasks.overdue.length,
              upcoming: groupedTasks.tomorrow.length + groupedTasks.later.length,
              shopping: activeShoppingCount,
              all: groupedTasks.totalActiveCount,
              completed: groupedTasks.completed.length,
            }}
            onOpenNewTask={() => {
              setNewTaskInitialDate(null);
              setIsNewTaskOpen(true);
            }}
          />

          {/* Gentle Notification Permission Banner if not yet enabled */}
          {notificationPermission === "default" && !isNotifBannerDismissed && (
            <div className="mb-4 p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/40 flex flex-wrap items-center justify-between gap-2 text-xs text-blue-900 dark:text-blue-200 animate-in fade-in">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-blue-500 shrink-0" />
                <span>
                  Never miss an assignment due date — Enable notifications to get timely reminders for your tasks.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    const res = await requestNotifications();
                    if (res === "granted") {
                      updateSettings({ notifications_enabled: true });
                      addToast("success", "Notifications enabled successfully!");
                    }
                  }}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition shadow-sm"
                >
                  Enable
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsNotifBannerDismissed(true);
                    localStorage.setItem("margin_notif_banner_dismissed", "true");
                  }}
                  className="text-blue-500 hover:text-blue-700 dark:hover:text-blue-200 text-xs transition px-1"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Filter Bar (Multi-Select Classes, Categories, Hide Zoom Lectures, Priorities, Sort) */}
          {currentView !== "calendar" && currentView !== "shopping" && (
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

          {/* Dynamic Content: Calendar View vs Shopping List vs Tabbed Task List */}
          {currentView === "calendar" ? (
            <CalendarView
              tasks={tasks}
              settings={settings}
              hideLectures={hideVirtualClasses}
              onToggleHideLectures={toggleHideVirtualClasses}
              onToggleComplete={handleToggleTask}
              onEditTask={(task) => setEditingTask(task)}
              onAddTaskOnDate={(date) => {
                setNewTaskInitialDate(date);
                setIsNewTaskOpen(true);
              }}
            />
          ) : currentView === "shopping" ? (
            <ShoppingListView
              tasks={tasks}
              onToggleComplete={handleToggleTask}
              onAddItem={addShoppingItem}
              onAddBatch={addShoppingItemsBatch}
              onDelete={async (id) => {
                await deleteTask(id);
                addToast("info", "Item removed");
              }}
              onClearCompleted={async () => {
                await clearCompletedShoppingItems();
                addToast("info", "Cleared all bought items");
              }}
              onUpdateTitle={async (id, newTitle) => {
                await updateTask(id, { title: newTitle });
              }}
              showToast={addToast}
              isCloudSyncing={isCloudSyncing}
              onSyncCloud={syncCloudTasks}
            />
          ) : (
            <TaskList
              groupedTasks={groupedTasks}
              currentView={currentView}
              settings={settings}
              onToggleComplete={handleToggleTask}
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
        isCloudSyncing={isCloudSyncing}
        cloudSyncError={cloudSyncError}
        onSyncCloud={syncCloudTasks}
      />

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
}
