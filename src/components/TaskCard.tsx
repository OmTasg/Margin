"use client";

import React from "react";
import {
  Check,
  Calendar,
  ArrowUpRight,
  Trash2,
  Edit2,
  Clock,
} from "lucide-react";
import { Task, UserSettings } from "@/lib/types";
import { format, isToday, isTomorrow, isPast } from "date-fns";
import { generateGoogleCalendarUrl } from "@/lib/google/calendarUrl";

interface Props {
  task: Task;
  settings: UserSettings;
  onToggleComplete: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onPushToGCal: (task: Task) => Promise<any>;
}

export function TaskCard({
  task,
  settings,
  onToggleComplete,
  onEdit,
  onDelete,
}: Props) {
  // Format due date in quiet humanized form
  const formatDueDisplay = (dateStr?: string | null) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;

    const timeStr = format(d, "h:mm a");
    const isOverdue = !task.is_completed && isPast(d) && !isToday(d);

    if (isToday(d)) {
      return { text: `Today @ ${timeStr}`, isOverdue: false, isToday: true };
    }
    if (isTomorrow(d)) {
      return { text: `Tomorrow @ ${timeStr}`, isOverdue: false, isToday: false };
    }
    if (isOverdue) {
      return { text: `Overdue (${format(d, "MMM d")} @ ${timeStr})`, isOverdue: true, isToday: false };
    }
    return { text: `${format(d, "MMM d")} @ ${timeStr}`, isOverdue: false, isToday: false };
  };

  const dueInfo = formatDueDisplay(task.due_date);

  // Priority indicator: colored checkbox border (Things 3 style)
  const priorityCheckboxBorder = {
    P1: "border-rose-500 dark:border-rose-500",
    P2: "border-amber-500 dark:border-amber-500",
    P3: "border-zinc-300 dark:border-zinc-600",
  }[task.priority];

  // Duration label
  const formatDuration = (mins?: number | null) => {
    if (!mins) return null;
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      const rem = mins % 60;
      return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`;
    }
    return `${mins}m`;
  };

  const durationStr = formatDuration(task.estimated_duration_minutes);

  // Reminder label
  const reminderLabel =
    typeof task.reminder_lead_time_minutes === "number"
      ? task.reminder_lead_time_minutes === 0
        ? "At due"
        : task.reminder_lead_time_minutes >= 1440
        ? `${Math.round(task.reminder_lead_time_minutes / 1440)}d before`
        : task.reminder_lead_time_minutes >= 60
        ? `${Math.round(task.reminder_lead_time_minutes / 60)}h before`
        : `${task.reminder_lead_time_minutes}m before`
      : null;

  // Build clean inline metadata items separated by middle dots (·)
  const metaItems: React.ReactNode[] = [];

  if (task.course_name) {
    metaItems.push(
      <span key="course" className="font-medium text-zinc-700 dark:text-zinc-300">
        {task.course_name}
      </span>
    );
  }

  if (dueInfo) {
    metaItems.push(
      <span
        key="due"
        className={
          dueInfo.isOverdue
            ? "text-rose-600 dark:text-rose-400 font-medium"
            : dueInfo.isToday
            ? "text-amber-600 dark:text-amber-400"
            : "text-zinc-500 dark:text-zinc-400"
        }
      >
        {dueInfo.text}
      </span>
    );
  }

  if (durationStr) {
    metaItems.push(
      <span key="dur" className="text-zinc-500 dark:text-zinc-400">
        ~{durationStr}
      </span>
    );
  }

  if (reminderLabel) {
    metaItems.push(
      <span key="rem" className="text-zinc-400 dark:text-zinc-500">
        ⏰ {reminderLabel}
      </span>
    );
  }

  return (
    <div
      className={`group relative flex items-start gap-3 py-3 px-1 border-b border-zinc-200/60 dark:border-zinc-800/60 transition-colors hover:bg-zinc-500/[0.02] ${
        task.is_completed ? "opacity-50" : ""
      }`}
    >
      {/* Things 3 style Checkbox: 44px hit target, border colored by priority */}
      <button
        type="button"
        onClick={() => onToggleComplete(task.id)}
        aria-label={task.is_completed ? "Mark incomplete" : "Mark complete"}
        className="w-8 h-8 -ml-1 -mt-1 flex items-center justify-center shrink-0 focus:outline-none"
      >
        <span
          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
            task.is_completed
              ? "bg-zinc-700 border-zinc-700 dark:bg-zinc-400 dark:border-zinc-400 text-white dark:text-zinc-900"
              : `${priorityCheckboxBorder} hover:scale-105`
          }`}
        >
          {task.is_completed && <Check className="w-2.5 h-2.5 stroke-[3]" />}
        </span>
      </button>

      {/* Main Task Content */}
      <div className="flex-1 min-w-0 pt-0.5 cursor-pointer" onClick={() => onEdit(task)}>
        {/* Title: Direct link to Canvas if available, with subtle arrow */}
        <div className="flex items-center gap-1.5 leading-snug">
          {task.external_url ? (
            <a
              href={task.external_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className={`text-sm font-medium transition inline-flex items-center gap-1 hover:underline ${
                task.is_completed
                  ? "line-through text-zinc-400 dark:text-zinc-500"
                  : "text-zinc-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400"
              }`}
            >
              <span>{task.title}</span>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-40 hover:opacity-100 transition-opacity shrink-0" />
            </a>
          ) : (
            <h3
              className={`text-sm font-medium transition ${
                task.is_completed
                  ? "line-through text-zinc-400 dark:text-zinc-500"
                  : "text-zinc-900 dark:text-zinc-100"
              }`}
            >
              {task.title}
            </h3>
          )}
        </div>

        {/* Optional Notes */}
        {task.notes && (
          <p
            className={`text-xs line-clamp-1 mt-0.5 text-zinc-500 dark:text-zinc-400 ${
              task.is_completed ? "line-through opacity-70" : ""
            }`}
          >
            {task.notes}
          </p>
        )}

        {/* Clean unboxed inline metadata separated by middle dots */}
        {metaItems.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">
            {metaItems.map((item, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span className="opacity-40 select-none">·</span>}
                {item}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* Action Icons: Hidden until row hover on desktop, quiet on mobile */}
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">
        {/* 1-Click + GCal button */}
        <a
          href={generateGoogleCalendarUrl(task)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          title="Add to Google Calendar"
          className="p-1.5 text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
        >
          <Calendar className="w-3.5 h-3.5" />
        </a>

        {/* Edit */}
        <button
          type="button"
          onClick={() => onEdit(task)}
          aria-label="Edit task"
          className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>

        {/* Delete */}
        <button
          type="button"
          onClick={() => onDelete(task.id)}
          aria-label="Delete task"
          className="p-1.5 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
