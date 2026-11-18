"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Calendar as CalendarIcon,
  Clock,
  Tag,
  Hourglass,
  Bell,
  Sparkles,
  Check,
} from "lucide-react";
import { Priority, Task, UserSettings, TaskCategory } from "@/lib/types";
import { CATEGORY_CONFIG, inferTaskCategory } from "@/lib/canvasUtils";
import { addDays, format, nextMonday, nextFriday } from "date-fns";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (task: Partial<Task>) => Promise<any>;
  settings: UserSettings;
  availableCourses: string[];
  initialDate?: Date | null;
}

export function NewTaskModal({
  isOpen,
  onClose,
  onAddTask,
  settings,
  availableCourses,
  initialDate,
}: Props) {
  const titleInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [category, setCategory] = useState<TaskCategory>("course");
  const [priority, setPriority] = useState<Priority>("P2");
  const [courseName, setCourseName] = useState("");
  const [customCourse, setCustomCourse] = useState("");
  const [isAddingNewCourse, setIsAddingNewCourse] = useState(false);
  const [durationMinutes, setDurationMinutes] = useState<number | null>(null);
  const [reminderMinutes, setReminderMinutes] = useState(
    settings.default_reminder_lead_time_minutes
  );

  // Date state
  const [selectedDateMode, setSelectedDateMode] = useState<
    "today" | "tomorrow" | "weekend" | "next_week" | "custom" | "none"
  >("today");
  const [customDate, setCustomDate] = useState("");

  // Time to do something by (Time of Day)
  const [selectedTimeMode, setSelectedTimeMode] = useState<
    "11:59" | "17:00" | "11:00" | "09:00" | "custom" | "none"
  >("11:59");
  const [customTime, setCustomTime] = useState("23:59");

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-fill initial date if passed (e.g. clicked on calendar day)
  useEffect(() => {
    if (initialDate && isOpen) {
      setSelectedDateMode("custom");
      setCustomDate(format(initialDate, "yyyy-MM-dd"));
    }
  }, [initialDate, isOpen]);

  // Lock body scroll when modal is open to prevent background scrolling on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Focus title on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 50);
    } else {
      // Reset form
      setTitle("");
      setNotes("");
      setCategory(availableCourses.length > 0 ? "course" : "personal");
      setPriority("P2");
      setSelectedDateMode("today");
      setCustomDate("");
      setSelectedTimeMode("11:59");
      setCustomTime("23:59");
      setCourseName("");
      setCustomCourse("");
      setIsAddingNewCourse(false);
      setDurationMinutes(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Calculate target date
  const computeFinalDueDate = (): string | null => {
    if (selectedDateMode === "none") return null;

    let targetDate = new Date();
    if (selectedDateMode === "today") {
      targetDate = new Date();
    } else if (selectedDateMode === "tomorrow") {
      targetDate = addDays(new Date(), 1);
    } else if (selectedDateMode === "weekend") {
      targetDate = nextFriday(new Date());
    } else if (selectedDateMode === "next_week") {
      targetDate = nextMonday(new Date());
    } else if (selectedDateMode === "custom") {
      if (!customDate) return null;
      const [y, m, d] = customDate.split("-").map(Number);
      targetDate = new Date(y, m - 1, d);
    }

    // Set time
    if (selectedTimeMode === "none") {
      targetDate.setHours(23, 59, 0, 0);
    } else if (selectedTimeMode === "11:59") {
      targetDate.setHours(23, 59, 0, 0);
    } else if (selectedTimeMode === "17:00") {
      targetDate.setHours(17, 0, 0, 0);
    } else if (selectedTimeMode === "11:00") {
      targetDate.setHours(11, 0, 0, 0);
    } else if (selectedTimeMode === "09:00") {
      targetDate.setHours(9, 0, 0, 0);
    } else if (selectedTimeMode === "custom" && customTime) {
      const [hrs, mins] = customTime.split(":").map(Number);
      targetDate.setHours(hrs, mins, 0, 0);
    }

    return targetDate.toISOString();
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const dueDateIso = computeFinalDueDate();
      const finalCourse = isAddingNewCourse
        ? customCourse.trim()
        : courseName.trim() || null;

      await onAddTask({
        title: title.trim(),
        notes: notes.trim() || undefined,
        category,
        priority,
        due_date: dueDateIso,
        reminder_lead_time_minutes: reminderMinutes,
        estimated_duration_minutes: durationMinutes,
        course_name: category === "course" && finalCourse ? finalCourse.toUpperCase() : null,
        source: "manual",
      });

      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-task-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white dark:bg-[#14151c] border-t sm:border border-zinc-200 dark:border-zinc-800 rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[88vh] text-foreground animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-150 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Mobile drag handle */}
        <div className="w-10 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mt-2.5 sm:hidden shrink-0" />

        {/* Header - Fixed at top of modal */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100 dark:border-zinc-800/80 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-blue-400"></span>
            <h2 id="new-task-title" className="text-base font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
              New Task
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg transition"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Task Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto flex-1 space-y-4 overscroll-contain">
          {/* Category Quick Chips */}
          <div>
            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 block mb-1.5">
              Task Type
            </label>
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              {(["course", "gym", "shopping", "laundry", "cooking", "personal"] as TaskCategory[]).map(
                (catKey) => {
                  const cfg = CATEGORY_CONFIG[catKey];
                  const isSelected = category === catKey;
                  return (
                    <button
                      key={catKey}
                      type="button"
                      onClick={() => {
                        setCategory(catKey);
                        if (catKey !== "course") {
                          setCourseName("");
                          setIsAddingNewCourse(false);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl font-medium border flex items-center gap-1.5 transition ${
                        isSelected
                          ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 font-semibold shadow-sm"
                          : "bg-zinc-50 dark:bg-zinc-900/60 text-zinc-600 dark:text-zinc-400 border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                      }`}
                    >
                      <span>{cfg.icon}</span>
                      <span>{cfg.label}</span>
                    </button>
                  );
                }
              )}
            </div>
          </div>

          {/* Title */}
          <div>
            <input
              ref={titleInputRef}
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                category === "gym"
                  ? "e.g. Leg day / 45m workout / Run 3 miles"
                  : category === "shopping"
                  ? "e.g. Grocery run (eggs, milk, chicken)"
                  : category === "laundry"
                  ? "e.g. Wash bedsheets & fold laundry"
                  : category === "cooking"
                  ? "e.g. Meal prep dinner for the week"
                  : category === "course"
                  ? "e.g. ISYE 3232 Quiz / Problem Set"
                  : "What needs to get done?"
              }
              className="w-full text-base sm:text-lg font-medium px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition"
            />
          </div>

          {/* Notes */}
          <div>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add details, link, or notes (optional)..."
              className="w-full text-xs sm:text-sm px-3.5 py-2 bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none transition"
            />
          </div>

          {/* Section: Due Date & Deadline Time */}
          <div className="bg-zinc-50/80 dark:bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 space-y-3">
            {/* Date Quick Chips */}
            <div>
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 mb-2">
                <CalendarIcon className="w-3.5 h-3.5 text-blue-500" />
                <span>Due Date</span>
              </label>

              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                {[
                  { id: "today", label: "Today" },
                  { id: "tomorrow", label: "Tomorrow" },
                  { id: "weekend", label: "Friday" },
                  { id: "next_week", label: "Next Mon" },
                  { id: "custom", label: "Pick Date" },
                  { id: "none", label: "No Date" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedDateMode(item.id as any)}
                    className={`px-3 py-1.5 rounded-lg font-medium transition ${
                      selectedDateMode === item.id
                        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm"
                        : "bg-white dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 border border-zinc-200/80 dark:border-zinc-700/80 hover:text-zinc-900 dark:hover:text-zinc-200"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {selectedDateMode === "custom" && (
                <div className="mt-2.5 flex items-center gap-2">
                  <input
                    type="date"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    className="px-3 py-1.5 text-xs bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* Time to do something by (Deadline Time) */}
            {selectedDateMode !== "none" && (
              <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60">
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 mb-2">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span>Time to do something by (Deadline)</span>
                </label>

                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  {[
                    { id: "11:59", label: "11:59 PM (Midnight)" },
                    { id: "17:00", label: "5:00 PM (End of Day)" },
                    { id: "11:00", label: "11:00 AM" },
                    { id: "09:00", label: "9:00 AM" },
                    { id: "custom", label: "Custom Time" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedTimeMode(item.id as any)}
                      className={`px-3 py-1.5 rounded-lg font-medium transition ${
                        selectedTimeMode === item.id
                          ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm"
                          : "bg-white dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 border border-zinc-200/80 dark:border-zinc-700/80 hover:text-zinc-900 dark:hover:text-zinc-200"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                {selectedTimeMode === "custom" && (
                  <div className="mt-2.5 flex items-center gap-2">
                    <input
                      type="time"
                      value={customTime}
                      onChange={(e) => setCustomTime(e.target.value)}
                      className="px-3 py-1.5 text-xs bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Priority & (Optional) Course Row */}
          <div className={`grid grid-cols-1 ${category === "course" ? "sm:grid-cols-2" : ""} gap-3`}>
            {/* Priority */}
            <div>
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 block mb-1.5">
                Priority
              </label>
              <div className="grid grid-cols-3 gap-1.5 text-xs">
                {(["P1", "P2", "P3"] as Priority[]).map((p) => {
                  const isSelected = priority === p;
                  const dotColor =
                    p === "P1"
                      ? "bg-rose-500"
                      : p === "P2"
                      ? "bg-amber-500"
                      : "bg-zinc-400";
                  const label =
                    p === "P1" ? "P1 High" : p === "P2" ? "P2 Med" : "P3 Low";

                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 font-medium border transition ${
                        isSelected
                          ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 font-semibold shadow-sm"
                          : "bg-zinc-50 dark:bg-zinc-900/60 text-zinc-600 dark:text-zinc-400 border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${dotColor}`}></span>
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Course Selector (only when category is course) */}
            {category === "course" && (
              <div>
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 block mb-1.5">
                  Course / Class
                </label>

                {isAddingNewCourse ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={customCourse}
                      onChange={(e) => setCustomCourse(e.target.value)}
                      placeholder="e.g. ISYE 3232"
                      className="flex-1 px-3 py-2 text-xs uppercase bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setIsAddingNewCourse(false)}
                      className="px-2 py-2 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <select
                      value={courseName}
                      onChange={(e) => {
                        if (e.target.value === "__NEW__") {
                          setIsAddingNewCourse(true);
                        } else {
                          setCourseName(e.target.value);
                        }
                      }}
                      className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-800 dark:text-zinc-200 font-medium focus:outline-none cursor-pointer"
                    >
                      <option value="">Select Class...</option>
                      {availableCourses.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                      <option value="__NEW__">+ Add New Course...</option>
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Duration & Reminder Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Duration */}
            <div>
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1 mb-1.5">
                <Hourglass className="w-3 h-3 text-zinc-400" />
                <span>Estimated Duration</span>
              </label>
              <div className="flex flex-wrap items-center gap-1 text-xs">
                {[15, 30, 45, 60, 90, 120].map((m) => {
                  const isSelected = durationMinutes === m;
                  const label = m >= 60 ? `${m / 60}h` : `${m}m`;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setDurationMinutes(isSelected ? null : m)}
                      className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition ${
                        isSelected
                          ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-transparent shadow-sm"
                          : "bg-zinc-50 dark:bg-zinc-900/60 text-zinc-600 dark:text-zinc-400 border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Reminder */}
            <div>
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1 mb-1.5">
                <Bell className="w-3 h-3 text-zinc-400" />
                <span>Reminder</span>
              </label>
              <select
                value={reminderMinutes}
                onChange={(e) => setReminderMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-800 dark:text-zinc-200 font-medium focus:outline-none cursor-pointer"
              >
                <option value={0}>At due time</option>
                <option value={15}>15 minutes before</option>
                <option value={60}>1 hour before</option>
                <option value={180}>3 hours before</option>
                <option value={1440}>1 day before</option>
              </select>
            </div>
          </div>

          {/* Footer Action Buttons */}
          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
            <span className="text-[11px] text-zinc-400 hidden sm:inline">
              Tip: Press <kbd className="font-mono px-1 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800">⌘+Enter</kbd> to save
            </span>

            <div className="flex items-center gap-2 ml-auto w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-initial px-4 py-2.5 sm:py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!title.trim() || isSubmitting}
                className="flex-1 sm:flex-initial px-5 py-2.5 sm:py-2 text-xs font-semibold rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 transition shadow-sm disabled:opacity-40"
              >
                {isSubmitting ? "Creating..." : "Create Task"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
