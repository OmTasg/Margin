"use client";

import React, { useState, useEffect } from "react";
import { Task, Priority, UserSettings, TaskCategory } from "@/lib/types";
import { CATEGORY_CONFIG, inferTaskCategory } from "@/lib/canvasUtils";
import {
  X,
  Calendar,
  Clock,
  Tag,
  Link,
  Trash2,
  Hourglass,
  ArrowUpRight,
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
      <div className="bg-white dark:bg-zinc-900 border-t sm:border border-zinc-200 dark:border-zinc-800 rounded-t-3xl sm:rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh]">
        {/* Mobile drag handle */}
        <div className="w-10 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mt-2.5 sm:hidden shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-200/80 dark:border-zinc-800/80 shrink-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
              Edit Task
            </h3>
            {task.external_url && (
              <a
                href={task.external_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-500 hover:underline inline-flex items-center gap-0.5"
              >
                <span>Canvas</span>
                <ArrowUpRight className="w-3 h-3" />
              </a>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-md transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Category Chips */}
          <div>
            <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">
              Category
            </label>
            <div className="flex flex-wrap items-center gap-1.5">
              {(["course", "gym", "shopping", "laundry", "cooking", "personal"] as TaskCategory[]).map(
                (catKey) => {
                  const cfg = CATEGORY_CONFIG[catKey];
                  const isSelected = category === catKey;
                  return (
                    <button
                      key={catKey}
                      type="button"
                      onClick={() => setCategory(catKey)}
                      className={`px-2.5 py-1 rounded-lg border text-xs font-medium flex items-center gap-1 transition ${
                        isSelected
                          ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 font-semibold shadow-sm"
                          : "bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700"
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
            <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-lg text-zinc-900 dark:text-zinc-100 text-sm font-medium focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">
              Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add optional notes..."
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-lg text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-500"
            />
          </div>

          {/* Priority (Things 3 style subtle buttons) */}
          <div>
            <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">
              Priority
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["P1", "P2", "P3"] as Priority[]).map((p) => {
                const isSelected = priority === p;
                const dot =
                  p === "P1"
                    ? "bg-rose-500"
                    : p === "P2"
                    ? "bg-amber-500"
                    : "bg-zinc-400";
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`py-1.5 text-xs rounded-lg border flex items-center justify-center gap-1.5 transition ${
                      isSelected
                        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold border-transparent"
                        : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${dot}`}></span>
                    <span>{p === "P1" ? "High" : p === "P2" ? "Medium" : "Low"}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Due Date & Estimated Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 opacity-60" />
                <span>Due Date & Time</span>
              </label>
              <input
                type="datetime-local"
                value={dueDateStr}
                onChange={(e) => setDueDateStr(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-lg text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-zinc-400"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1 flex items-center gap-1">
                <Hourglass className="w-3 h-3 opacity-60" />
                <span>Est. Duration</span>
              </label>
              <select
                value={estimatedDuration ?? ""}
                onChange={(e) =>
                  setEstimatedDuration(e.target.value ? parseInt(e.target.value, 10) : null)
                }
                className="w-full px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-lg text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-zinc-400 cursor-pointer"
              >
                {durationOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Reminder & Course */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3 opacity-60" />
                <span>Reminder</span>
              </label>
              <select
                value={reminderMinutes}
                onChange={(e) => setReminderMinutes(parseInt(e.target.value, 10))}
                className="w-full px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-lg text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-zinc-400 cursor-pointer"
              >
                {reminderOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1 flex items-center gap-1">
                <Tag className="w-3 h-3 opacity-60" />
                <span>Course</span>
              </label>
              <input
                type="text"
                placeholder="e.g. CS 106B"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-lg text-zinc-900 dark:text-zinc-100 text-xs uppercase focus:outline-none focus:border-zinc-400"
              />
            </div>
          </div>

          {/* External Canvas Link */}
          <div>
            <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1 flex items-center gap-1">
              <Link className="w-3 h-3 opacity-60" />
              <span>Canvas / External URL</span>
            </label>
            <input
              type="url"
              placeholder="https://canvas.../assignments/..."
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-lg text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-zinc-400"
            />
          </div>
        </form>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/50">
          <button
            type="button"
            onClick={handleDelete}
            className="text-xs text-rose-500 hover:text-rose-600 font-medium transition flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !title.trim()}
              className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 disabled:opacity-40 text-white dark:text-zinc-900 text-xs font-semibold rounded-lg transition"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
