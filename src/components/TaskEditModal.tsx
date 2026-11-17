"use client";

import React, { useState, useEffect } from "react";
import { Task, Priority, UserSettings } from "@/lib/types";
import {
  X,
  Calendar,
  Clock,
  Tag,
  Link,
  Trash2,
  Send,
  CheckCircle2,
  BookOpen,
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
  onPushToGCal,
}: Props) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [priority, setPriority] = useState<Priority>("P2");
  const [dueDateStr, setDueDateStr] = useState("");
  const [reminderMinutes, setReminderMinutes] = useState(15);
  const [customMinutes, setCustomMinutes] = useState("");
  const [courseName, setCourseName] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [isPushing, setIsPushing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title || "");
      setNotes(task.notes || "");
      setPriority(task.priority || "P2");
      setCourseName(task.course_name || "");
      setExternalUrl(task.external_url || "");
      setReminderMinutes(
        typeof task.reminder_lead_time_minutes === "number"
          ? task.reminder_lead_time_minutes
          : settings.default_reminder_lead_time_minutes
      );

      if (task.due_date) {
        try {
          const d = new Date(task.due_date);
          // format for input type="datetime-local": YYYY-MM-DDTHH:mm
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
        priority,
        due_date: finalDueDate,
        reminder_lead_time_minutes: reminderMinutes,
        course_name: courseName.trim() ? courseName.trim().toUpperCase() : null,
        external_url: externalUrl.trim() || null,
      });

      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      await onDelete(task.id);
      onClose();
    }
  };

  const handlePushToGCal = async () => {
    setIsPushing(true);
    try {
      await onPushToGCal({
        ...task,
        title,
        notes,
        priority,
        due_date: dueDateStr ? new Date(dueDateStr).toISOString() : null,
        reminder_lead_time_minutes: reminderMinutes,
        course_name: courseName || null,
        external_url: externalUrl || null,
      });
    } finally {
      setIsPushing(false);
    }
  };

  const reminderOptions = [
    { label: "At due date (0m)", value: 0 },
    { label: "15 minutes before", value: 15 },
    { label: "1 hour before", value: 60 },
    { label: "3 hours before", value: 180 },
    { label: "1 day before", value: 1440 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100">
              Edit Task
            </h3>
            {task.source === "canvas" && (
              <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900/40 flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                <span>Canvas</span>
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
              Task Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
              Notes & Instructions
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add optional notes, rubric, or assignment details..."
              className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* Priority Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
              Priority
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["P1", "P2", "P3"] as Priority[]).map((p) => {
                const isSelected = priority === p;
                const colors = {
                  P1: isSelected
                    ? "bg-rose-500 text-white border-rose-500"
                    : "border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-rose-50 dark:hover:bg-rose-950/30",
                  P2: isSelected
                    ? "bg-amber-500 text-white border-amber-500"
                    : "border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-amber-50 dark:hover:bg-amber-950/30",
                  P3: isSelected
                    ? "bg-blue-600 text-white border-blue-600"
                    : "border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-blue-50 dark:hover:bg-blue-950/30",
                }[p];

                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`py-2 text-xs font-bold rounded-xl border text-center transition ${colors}`}
                  >
                    {p === "P1" ? "High (P1)" : p === "P2" ? "Medium (P2)" : "Low (P3)"}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Due Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                <span>Due Date & Time</span>
              </label>
              <input
                type="datetime-local"
                value={dueDateStr}
                onChange={(e) => setDueDateStr(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 text-xs font-medium focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Custom Reminder Lead Time */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                <span>Reminder Lead Time</span>
              </label>
              <select
                value={reminderMinutes}
                onChange={(e) => setReminderMinutes(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 text-xs font-medium focus:ring-2 focus:ring-blue-500"
              >
                {reminderOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Course Name & External URL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-amber-500" />
                <span>Course / Category</span>
              </label>
              <input
                type="text"
                placeholder="e.g. CS 106B"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 text-xs uppercase focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5 flex items-center gap-1.5">
                <Link className="w-3.5 h-3.5 text-rose-500" />
                <span>External / Canvas Link</span>
              </label>
              <input
                type="url"
                placeholder="https://canvas.../assignments/..."
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 text-xs focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Google Calendar Section */}
          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Calendar className="w-5 h-5 text-emerald-500" />
              <div>
                <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  Google Calendar Push
                </p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  {task.is_pushed_to_google
                    ? "Currently synced on your calendar"
                    : "Add as event with popup reminder"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handlePushToGCal}
              disabled={isPushing}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl border flex items-center gap-1.5 transition ${
                task.is_pushed_to_google
                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800"
                  : "bg-blue-600 text-white border-blue-600 hover:bg-blue-500 shadow-sm"
              }`}
            >
              <Send className={`w-3.5 h-3.5 ${isPushing ? "animate-pulse" : ""}`} />
              <span>
                {isPushing
                  ? "Syncing..."
                  : task.is_pushed_to_google
                  ? "Update GCal"
                  : "Push to GCal"}
              </span>
            </button>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80">
          <button
            type="button"
            onClick={handleDelete}
            className="px-3.5 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Task</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !title.trim()}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
