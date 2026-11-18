"use client";

import React, { useState, useEffect } from "react";
import { Task, Priority, UserSettings, TaskCategory, RecurrenceRule } from "@/lib/types";
import {
  CATEGORY_CONFIG,
  inferTaskCategory,
  getCanvasAppDeepLink,
} from "@/lib/canvasUtils";
import { RecurrenceSelector } from "@/components/RecurrenceSelector";
import {
  X,
  Calendar,
  Clock,
  Tag,
  Link,
  Trash2,
  Hourglass,
  ArrowUpRight,
  Repeat,
} from "lucide-react";

interface Props {
  task: Task | null;
  isOpen: boolean;
  settings: UserSettings;
  onClose: () => void;
  onSave: (taskId: string, updates: Partial<Task>) => Promise<any>;
  onDelete: (taskId: string) => Promise<any>;
  onPushToGCal: (task: Task) => Promise<any>;
}

export function TaskEditModal({
  task,
  isOpen,
  settings,
  onClose,
  onSave,
  onDelete,
}: Props) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [category, setCategory] = useState<TaskCategory>("course");
  const [priority, setPriority] = useState<Priority>("P2");
  const [dueDateStr, setDueDateStr] = useState("");
  const [reminderMinutes, setReminderMinutes] = useState(15);
  const [estimatedDuration, setEstimatedDuration] = useState<number | null>(null);
  const [courseName, setCourseName] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [showEditUrl, setShowEditUrl] = useState(false);
  const [recurrence, setRecurrence] = useState<RecurrenceRule | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title || "");
      setNotes(task.notes || "");
      setCategory((task.category || inferTaskCategory(task.title, task.course_name)) as TaskCategory);
      setPriority(task.priority || "P2");
      setCourseName(task.course_name || "");
      setExternalUrl(task.external_url || "");
      setEstimatedDuration(task.estimated_duration_minutes ?? null);
      setRecurrence(task.recurrence || null);
      setReminderMinutes(
        typeof task.reminder_lead_time_minutes === "number"
          ? task.reminder_lead_time_minutes
          : settings.default_reminder_lead_time_minutes
      );

      if (task.due_date) {
        try {
          const d = new Date(task.due_date);
          const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16);
          setDueDateStr(localIso);
        } catch {
          setDueDateStr("");
        }
      } else {
        setDueDateStr("");
      }
    }
  }, [task, settings.default_reminder_lead_time_minutes]);

  // Lock body scroll when modal is open
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

  if (!isOpen || !task) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSaving) return;

    setIsSaving(true);
    try {
      let finalDueDate: string | null = null;
      if (dueDateStr) {
        finalDueDate = new Date(dueDateStr).toISOString();
      }

      await onSave(task.id, {
        title: title.trim(),
        notes: notes.trim() || undefined,
        category,
        priority,
        due_date: finalDueDate,
        reminder_lead_time_minutes: reminderMinutes,
        estimated_duration_minutes: estimatedDuration,
        course_name: courseName.trim() ? courseName.trim().toUpperCase() : null,
        external_url: externalUrl.trim() || null,
        recurrence: recurrence || null,
      });

      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Delete this task?")) {
      await onDelete(task.id);
      onClose();
    }
  };

  const reminderOptions = [
    { label: "At due time", value: 0 },
    { label: "15 minutes before", value: 15 },
    { label: "1 hour before", value: 60 },
    { label: "3 hours before", value: 180 },
    { label: "1 day before", value: 1440 },
  ];

  const durationOptions = [
    { label: "None", value: "" },
    { label: "15m", value: "15" },
    { label: "30m", value: "30" },
    { label: "45m", value: "45" },
    { label: "1h", value: "60" },
    { label: "1.5h", value: "90" },
    { label: "2h", value: "120" },
    { label: "3h+", value: "180" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#14151c] border-t sm:border border-zinc-200 dark:border-zinc-800 rounded-t-3xl sm:rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[88vh]">
        {/* Mobile drag handle */}
        <div className="w-12 h-1.5 bg-zinc-300 dark:bg-zinc-700/80 rounded-full mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-100 dark:border-zinc-800/80 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-blue-400" />
            <h3 className="font-semibold text-sm sm:text-base text-zinc-900 dark:text-zinc-100">
              Edit Task
            </h3>
            {task.source === "canvas" && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/40 inline-flex items-center gap-1">
                Canvas
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="p-5 space-y-4 overflow-y-auto flex-1 min-h-0 overscroll-contain text-xs">
          {/* Category Chips - Sleek horizontal scroll, 0 line wrapping */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">
              Category
            </label>
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 -mx-5 px-5 touch-pan-x flex-nowrap">
              {(["course", "gym", "shopping", "laundry", "cooking", "personal"] as TaskCategory[]).map(
                (catKey) => {
                  const cfg = CATEGORY_CONFIG[catKey];
                  const isSelected = category === catKey;
                  return (
                    <button
                      key={catKey}
                      type="button"
                      onClick={() => setCategory(catKey)}
                      className={`px-3 py-1.5 rounded-xl font-medium text-xs flex items-center gap-1.5 transition shrink-0 border ${
                        isSelected
                          ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 font-semibold shadow-sm"
                          : "bg-zinc-50 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
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
            <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">
              Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add details, link, or notes..."
              className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none break-words transition"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">
              Priority
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(["P1", "P2", "P3"] as Priority[]).map((p) => {
                const isSelected = priority === p;
                const dot =
                  p === "P1"
                    ? "bg-rose-500"
                    : p === "P2"
                    ? "bg-amber-500"
                    : "bg-zinc-400";
                const label = p === "P1" ? "High" : p === "P2" ? "Medium" : "Low";
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`py-2 px-2 rounded-xl text-xs flex items-center justify-center gap-1.5 font-medium border transition ${
                      isSelected
                        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 font-semibold shadow-sm"
                        : "bg-zinc-50 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${dot}`}></span>
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Due Date & Time - Full Width to prevent text clash */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-500" />
              <span>Due Date & Time</span>
            </label>
            <input
              type="datetime-local"
              value={dueDateStr}
              onChange={(e) => setDueDateStr(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>

          {/* Duration & Reminder Grid - 2 clean dropdowns that fit side-by-side */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 flex items-center gap-1.5">
                <Hourglass className="w-3.5 h-3.5 text-amber-500" />
                <span>Est. Duration</span>
              </label>
              <select
                value={estimatedDuration ?? ""}
                onChange={(e) =>
                  setEstimatedDuration(e.target.value ? parseInt(e.target.value, 10) : null)
                }
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer"
              >
                {durationOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-500" />
                <span>Reminder</span>
              </label>
              <select
                value={reminderMinutes}
                onChange={(e) => setReminderMinutes(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer"
              >
                {reminderOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Recurrence (Google Calendar style) */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 flex items-center gap-1.5">
              <Repeat className="w-3.5 h-3.5 text-blue-500" />
              <span>Repeat</span>
            </label>
            <RecurrenceSelector
              value={recurrence}
              onChange={setRecurrence}
              referenceDate={dueDateStr || new Date()}
              fullWidth
            />
          </div>

          {/* Course - Only shown when category is Course */}
          {category === "course" && (
            <div>
              <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-blue-500" />
                <span>Course / Class</span>
              </label>
              <input
                type="text"
                placeholder="e.g. ISYE 3232"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 text-xs uppercase font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>
          )}

          {/* Canvas / External Link Preview Card */}
          {externalUrl ? (
            <div>
              <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 flex items-center gap-1.5">
                <Link className="w-3.5 h-3.5 text-blue-500" />
                <span>Canvas Assignment Link</span>
              </label>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 gap-2">
                <span className="text-xs text-blue-600 dark:text-blue-400 truncate font-mono flex-1">
                  {externalUrl}
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <a
                    href={
                      typeof navigator !== "undefined" &&
                      /iPad|iPhone|iPod|Android/i.test(navigator.userAgent) &&
                      settings.canvas_open_in_app !== false
                        ? getCanvasAppDeepLink(externalUrl) || externalUrl
                        : externalUrl
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      const isMobile =
                        typeof navigator !== "undefined" &&
                        /iPad|iPhone|iPod|Android/i.test(navigator.userAgent);
                      if (isMobile && settings.canvas_open_in_app !== false) {
                        const deepLink = getCanvasAppDeepLink(externalUrl);
                        if (deepLink) {
                          e.preventDefault();
                          window.location.href = deepLink;
                        }
                      }
                    }}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white inline-flex items-center gap-1 transition shadow-sm"
                  >
                    <span>Open</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </a>
                  <button
                    type="button"
                    onClick={() => setShowEditUrl((prev) => !prev)}
                    className="px-2 py-1 text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 font-medium transition"
                  >
                    {showEditUrl ? "Hide" : "Edit"}
                  </button>
                </div>
              </div>
              {showEditUrl && (
                <input
                  type="url"
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  className="w-full mt-2 px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  placeholder="https://canvas..."
                />
              )}
            </div>
          ) : (
            <div>
              <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 flex items-center gap-1.5">
                <Link className="w-3.5 h-3.5 text-zinc-400" />
                <span>Canvas / External URL</span>
              </label>
              <input
                type="url"
                placeholder="https://canvas.../assignments/..."
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>
          )}
        </form>

        {/* Pinned Footer Actions with iOS Home Bar Safe-Area */}
        <div className="flex items-center justify-between px-5 pt-3.5 pb-7 sm:py-3.5 border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/80 dark:bg-zinc-900/80 shrink-0">
          <button
            type="button"
            onClick={handleDelete}
            className="text-xs text-rose-500 hover:text-rose-600 font-medium transition flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !title.trim()}
              className="px-5 py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 disabled:opacity-40 text-white dark:text-zinc-900 text-xs font-semibold rounded-xl shadow-sm transition"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
