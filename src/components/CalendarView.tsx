"use client";

import React, { useState } from "react";
import { Task, UserSettings, Priority } from "@/lib/types";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Check,
  Calendar as CalendarIcon,
  ArrowUpRight,
  Clock,
  BookOpen,
} from "lucide-react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addDays,
  isToday,
  isPast,
} from "date-fns";
import { resolveDirectCanvasUrl } from "@/lib/canvasUtils";

interface Props {
  tasks: Task[];
  settings: UserSettings;
  onToggleComplete: (id: string) => void;
  onEditTask: (task: Task) => void;
  onAddTaskOnDate: (date: Date) => void;
}

export function CalendarView({
  tasks,
  settings,
  onToggleComplete,
  onEditTask,
  onAddTaskOnDate,
}: Props) {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date());

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => {
    const now = new Date();
    setCurrentMonth(now);
    setSelectedDay(now);
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  // Group tasks by day (YYYY-MM-DD string key)
  const tasksByDay = React.useMemo(() => {
    const map = new Map<string, Task[]>();
    tasks.forEach((task) => {
      if (!task.due_date) return;
      const d = new Date(task.due_date);
      if (isNaN(d.getTime())) return;
      const key = format(d, "yyyy-MM-dd");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(task);
    });
    return map;
  }, [tasks]);

  // Generate calendar grid days
  const calendarDays = React.useMemo(() => {
    const days: Date[] = [];
    let day = startDate;
    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [startDate, endDate]);

  const weekDayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const getPriorityDot = (p: Priority) => {
    switch (p) {
      case "P1":
        return "bg-rose-500";
      case "P2":
        return "bg-amber-500";
      default:
        return "bg-zinc-400";
    }
  };

  // Selected day tasks
  const selectedDayKey = selectedDay ? format(selectedDay, "yyyy-MM-dd") : null;
  const selectedDayTasks = selectedDayKey ? tasksByDay.get(selectedDayKey) || [] : [];

  return (
    <div className="space-y-4">
      {/* Calendar Navigation Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-200/80 dark:border-zinc-800/80">
        <div className="flex items-center gap-3">
          <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <button
            onClick={goToToday}
            className="px-2.5 py-1 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={prevMonth}
            aria-label="Previous month"
            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={nextMonth}
            aria-label="Next month"
            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-px text-center text-xs font-semibold text-zinc-400 dark:text-zinc-500 pb-1">
        {weekDayNames.map((name) => (
          <div key={name} className="py-1">
            {name}
          </div>
        ))}
      </div>

      {/* Month Days Grid */}
      <div className="grid grid-cols-7 gap-px bg-zinc-200/60 dark:bg-zinc-800/60 rounded-xl overflow-hidden border border-zinc-200/80 dark:border-zinc-800/80">
        {calendarDays.map((dayItem, idx) => {
          const dayKey = format(dayItem, "yyyy-MM-dd");
          const dayTasks = tasksByDay.get(dayKey) || [];
          const isCurrentMonth = isSameMonth(dayItem, currentMonth);
          const isSelected = selectedDay && isSameDay(dayItem, selectedDay);
          const isCurrentDay = isToday(dayItem);

          return (
            <div
              key={idx}
              onClick={() => setSelectedDay(dayItem)}
              className={`min-h-[75px] sm:min-h-[105px] p-1.5 sm:p-2 bg-white dark:bg-[#14151c] transition-colors cursor-pointer flex flex-col justify-between group ${
                !isCurrentMonth ? "opacity-35" : ""
              } ${isSelected ? "ring-2 ring-blue-500/50 z-10" : "hover:bg-zinc-50 dark:hover:bg-zinc-800/40"}`}
            >
              {/* Day Number Header */}
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-semibold w-5 h-5 flex items-center justify-center rounded-full ${
                    isCurrentDay
                      ? "bg-blue-600 text-white font-bold"
                      : "text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  {format(dayItem, "d")}
                </span>

                {/* Quick Add Button on Day Hover */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddTaskOnDate(dayItem);
                  }}
                  title={`Add task for ${format(dayItem, "MMM d")}`}
                  className="opacity-0 group-hover:opacity-100 p-0.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded transition"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              {/* Task Items inside Day Cell */}
              <div className="mt-1 space-y-1 flex-1 overflow-hidden">
                {dayTasks.slice(0, 3).map((task) => (
                  <div
                    key={task.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditTask(task);
                    }}
                    className={`text-[10px] sm:text-[11px] leading-tight px-1.5 py-0.5 rounded truncate flex items-center gap-1 transition ${
                      task.is_completed
                        ? "line-through text-zinc-400 bg-zinc-100/60 dark:bg-zinc-800/40 opacity-60"
                        : "text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${getPriorityDot(
                        task.priority
                      )}`}
                    />
                    <span className="truncate">
                      {task.course_name ? `[${task.course_name}] ` : ""}
                      {task.title}
                    </span>
                  </div>
                ))}

                {dayTasks.length > 3 && (
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium pl-1 block">
                    +{dayTasks.length - 3} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Day Agenda Drawer / Card */}
      {selectedDay && (
        <div className="mt-4 p-4 sm:p-5 rounded-2xl border border-zinc-200/90 dark:border-zinc-800/90 bg-zinc-50/70 dark:bg-[#181922] space-y-3 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-zinc-200/60 dark:border-zinc-800/60">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-blue-500" />
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
                {format(selectedDay, "EEEE, MMMM d, yyyy")}
              </h3>
              {isToday(selectedDay) && (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                  Today
                </span>
              )}
            </div>

            <button
              onClick={() => onAddTaskOnDate(selectedDay)}
              className="px-3 py-1 text-xs font-semibold rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 flex items-center gap-1.5 transition shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add task on {format(selectedDay, "MMM d")}</span>
            </button>
          </div>

          {selectedDayTasks.length === 0 ? (
            <div className="py-6 text-center text-zinc-400 dark:text-zinc-500">
              <p className="text-xs italic">No tasks or assignments scheduled for this day.</p>
              <button
                onClick={() => onAddTaskOnDate(selectedDay)}
                className="mt-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                + Create a task for {format(selectedDay, "MMMM d")}
              </button>
            </div>
          ) : (
            <div className="space-y-2 pt-1">
              {selectedDayTasks.map((task) => {
                const directUrl =
                  resolveDirectCanvasUrl(task.external_url, task.notes, task.canvas_uid) ||
                  task.external_url;

                return (
                  <div
                    key={task.id}
                    onClick={() => onEditTask(task)}
                    className="p-3 bg-white dark:bg-zinc-900/80 rounded-xl border border-zinc-200/70 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 transition cursor-pointer flex flex-wrap items-center justify-between gap-3 group"
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      {/* Checkbox */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleComplete(task.id);
                        }}
                        className={`w-5 h-5 mt-0.5 rounded-full border-2 flex items-center justify-center shrink-0 transition ${
                          task.is_completed
                            ? "bg-zinc-700 border-zinc-700 dark:bg-zinc-400 dark:border-zinc-400 text-white dark:text-zinc-900"
                            : task.priority === "P1"
                            ? "border-rose-500"
                            : task.priority === "P2"
                            ? "border-amber-500"
                            : "border-zinc-400"
                        }`}
                      >
                        {task.is_completed && <Check className="w-3 h-3 stroke-[3]" />}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm font-medium ${
                              task.is_completed
                                ? "line-through text-zinc-400"
                                : "text-zinc-900 dark:text-zinc-100"
                            }`}
                          >
                            {task.title}
                          </span>

                          {/* Direct Canvas Link */}
                          {directUrl && (
                            <a
                              href={directUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-0.5 text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline shrink-0"
                            >
                              <span>Open in Canvas</span>
                              <ArrowUpRight className="w-3 h-3" />
                            </a>
                          )}
                        </div>

                        {task.notes && (
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-1">
                            {task.notes}
                          </p>
                        )}

                        {/* Metadata row */}
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-zinc-400">
                          {task.course_name && (
                            <span className="font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                              {task.course_name}
                            </span>
                          )}

                          {task.due_date && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 opacity-60" />
                              {format(new Date(task.due_date), "h:mm a")}
                            </span>
                          )}

                          {task.estimated_duration_minutes && (
                            <span>~{task.estimated_duration_minutes}m</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Priority pill */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          task.priority === "P1"
                            ? "bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900"
                            : task.priority === "P2"
                            ? "bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                        }`}
                      >
                        {task.priority}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
