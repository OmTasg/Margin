"use client";

import React, { useState } from "react";
import {
  Check,
  Calendar,
  ExternalLink,
  Clock,
  MoreVertical,
  Trash2,
  Edit2,
  BookOpen,
  Send,
  AlertCircle,
} from "lucide-react";
import { Task, UserSettings } from "@/lib/types";
import { format, isToday, isTomorrow, isPast, formatDistanceToNow } from "date-fns";
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
  onPushToGCal,
}: Props) {
  const [isPushing, setIsPushing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Format Due Date
  const formatDueDisplay = (dateStr?: string | null) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;

    const timeStr = format(d, "h:mm a");
    const isOverdue = !task.is_completed && isPast(d) && !isToday(d);

    if (isToday(d)) {
      return {
        label: `Today @ ${timeStr}`,
        isOverdue: false,
        isToday: true,
      };
    }
    if (isTomorrow(d)) {
      return {
        label: `Tomorrow @ ${timeStr}`,
        isOverdue: false,
        isToday: false,
      };
    }
    if (isOverdue) {
      return {
        label: `Overdue (${format(d, "MMM d")} @ ${timeStr})`,
        isOverdue: true,
        isToday: false,
      };
    }
    return {
      label: `${format(d, "EEE, MMM d")} @ ${timeStr}`,
      isOverdue: false,
      isToday: false,
    };
  };

  const dueInfo = formatDueDisplay(task.due_date);

  const priorityStyles = {
    P1: {
      badge: "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border-rose-300 dark:border-rose-900/60",
      dot: "bg-rose-500",
      label: "P1 High",
    },
    P2: {
      badge: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-amber-300 dark:border-amber-900/60",
      dot: "bg-amber-500",
      label: "P2 Med",
    },
    P3: {
      badge: "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border-blue-300 dark:border-blue-900/60",
      dot: "bg-blue-500",
      label: "P3 Low",
    },
  }[task.priority];

  const handlePushGCal = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPushing(true);
    try {
      await onPushToGCal(task);
    } finally {
      setIsPushing(false);
    }
  };

  return (
    <div
      className={`group relative flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl border transition-all ${
        task.is_completed
          ? "bg-zinc-50/60 dark:bg-zinc-900/40 border-zinc-200/60 dark:border-zinc-800/60 opacity-60"
          : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm"
      }`}
    >
      {/* Accessible Large Checkbox (44x44px touch target) */}
      <button
        type="button"
        onClick={() => onToggleComplete(task.id)}
        aria-label={task.is_completed ? "Mark task as incomplete" : "Mark task as complete"}
        className="w-11 h-11 -m-2 flex items-center justify-center shrink-0 group/check focus:outline-none"
      >
        <span
          className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
            task.is_completed
              ? "bg-blue-600 border-blue-600 text-white"
              : "border-zinc-300 dark:border-zinc-700 group-hover/check:border-blue-500 group-hover/check:bg-blue-50/50 dark:group-hover/check:bg-blue-950/30"
          }`}
        >
          {task.is_completed && <Check className="w-4 h-4 stroke-[3]" />}
        </span>
      </button>

      {/* Main Task Content */}
      <div className="flex-1 min-w-0" onClick={() => onEdit(task)}>
        {/* Title & Course Header */}
        <div className="flex flex-wrap items-center gap-2 mb-1">
          {task.course_name && (
            <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 shrink-0">
              {task.course_name}
            </span>
          )}

          <h3
            className={`text-sm sm:text-base font-semibold leading-snug cursor-pointer transition ${
              task.is_completed
                ? "line-through text-zinc-400 dark:text-zinc-500"
                : "text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400"
            }`}
          >
            {task.title}
          </h3>
        </div>

        {/* Optional Notes */}
        {task.notes && (
          <p
            className={`text-xs sm:text-sm line-clamp-2 mb-2 leading-relaxed ${
              task.is_completed
                ? "text-zinc-400 dark:text-zinc-600 line-through"
                : "text-zinc-600 dark:text-zinc-400"
            }`}
          >
            {task.notes}
          </p>
        )}

        {/* Badges Bar: Due Date, Priority, Reminder, Source, Canvas Link */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          {/* Priority Badge */}
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border ${priorityStyles.badge}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${priorityStyles.dot}`}></span>
            {priorityStyles.label}
          </span>

          {/* Due Date Badge */}
          {dueInfo && (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                dueInfo.isOverdue
                  ? "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border-rose-300 dark:border-rose-900/60 animate-pulse"
                  : dueInfo.isToday
                  ? "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-amber-300 dark:border-amber-900/60"
                  : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
              }`}
            >
              <Calendar className="w-3 h-3" />
              <span>{dueInfo.label}</span>
            </span>
          )}

          {/* Reminder Lead Time Badge */}
          {typeof task.reminder_lead_time_minutes === "number" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
              <Clock className="w-3 h-3 text-indigo-500" />
              <span>
                {task.reminder_lead_time_minutes === 0
                  ? "At due"
                  : task.reminder_lead_time_minutes >= 1440
                  ? `${Math.round(task.reminder_lead_time_minutes / 1440)}d before`
                  : task.reminder_lead_time_minutes >= 60
                  ? `${Math.round(task.reminder_lead_time_minutes / 60)}h before`
                  : `${task.reminder_lead_time_minutes}m before`}
              </span>
            </span>
          )}

          {/* Source Badge */}
          {task.source === "canvas" ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900/40">
              <BookOpen className="w-3 h-3 text-rose-600" />
              <span>Canvas</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              Manual
            </span>
          )}

          {/* Clickable "Open in Canvas" Button */}
          {task.external_url && (
            <a
              href={task.external_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-900/40 transition active:scale-95"
            >
              <span>Open in Canvas</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}

          {/* Google Calendar Add Button (Direct 1-Click, Zero-OAuth needed) */}
          <a
            href={generateGoogleCalendarUrl(task)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            title="Add this task to Google Calendar (1-click)"
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-300 dark:border-emerald-800 transition active:scale-95"
          >
            <Calendar className="w-3 h-3 text-emerald-600" />
            <span>+ GCal</span>
          </a>
        </div>
      </div>

      {/* Right Action Icons: Edit & Delete */}
      <div className="flex items-center gap-1 shrink-0 -mr-1">
        <button
          type="button"
          onClick={() => onEdit(task)}
          aria-label="Edit task"
          className="p-2 text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
        >
          <Edit2 className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => onDelete(task.id)}
          aria-label="Delete task"
          className="p-2 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
