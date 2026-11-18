"use client";

import React, { useState } from "react";
import { Task, UserSettings, Priority, TaskCategory } from "@/lib/types";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Check,
  Calendar as CalendarIcon,
  ArrowUpRight,
  Clock,
  Video,
  X,
  Sparkles,
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
import {
  resolveDirectCanvasUrl,
  CATEGORY_CONFIG,
  inferTaskCategory,
  isLectureOrMeeting,
} from "@/lib/canvasUtils";

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
  const [isDayPanelOpen, setIsDayPanelOpen] = useState(true);

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => {
    const now = new Date();
    setCurrentMonth(now);
    setSelectedDay(now);
    setIsDayPanelOpen(true);
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
  const selectedDayTasks = React.useMemo(() => {
    if (!selectedDayKey) return [];
    const list = [...(tasksByDay.get(selectedDayKey) || [])];

    // Sort chronologically by due time
    return list.sort((a, b) => {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });
  }, [selectedDayKey, tasksByDay]);

  const handleSelectDay = (dayItem: Date) => {
    setSelectedDay(dayItem);
    setIsDayPanelOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Calendar Header Navigation */}
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

        <div className="flex items-center gap-2">
          {selectedDay && !isDayPanelOpen && (
            <button
              onClick={() => setIsDayPanelOpen(true)}
              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition flex items-center gap-1.5"
            >
              <CalendarIcon className="w-3.5 h-3.5 text-blue-500" />
              <span>Show {format(selectedDay, "MMM d")} Schedule</span>
            </button>
          )}

          <div className="flex items-center gap-1">
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
      </div>

      {/* Main Split Layout: Month Grid on Left, Google Calendar Day Schedule on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Side: Interactive Calendar Month Grid */}
        <div className={`transition-all duration-200 ${isDayPanelOpen && selectedDay ? "lg:col-span-7 xl:col-span-8" : "lg:col-span-12"}`}>
          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-px text-center text-xs font-semibold text-zinc-400 dark:text-zinc-500 pb-1">
            {weekDayNames.map((name) => (
              <div key={name} className="py-1">
                {name}
              </div>
            ))}
          </div>

          {/* Month Days Grid */}
          <div className="grid grid-cols-7 gap-px bg-zinc-200/60 dark:bg-zinc-800/60 rounded-2xl overflow-hidden border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm">
            {calendarDays.map((dayItem, idx) => {
              const dayKey = format(dayItem, "yyyy-MM-dd");
              const dayTasks = tasksByDay.get(dayKey) || [];
              const isCurrentMonth = isSameMonth(dayItem, currentMonth);
              const isSelected = selectedDay && isSameDay(dayItem, selectedDay);
              const isCurrentDay = isToday(dayItem);

              return (
                <div
                  key={idx}
                  onClick={() => handleSelectDay(dayItem)}
                  className={`min-h-[80px] sm:min-h-[105px] p-1.5 sm:p-2 bg-white dark:bg-[#14151c] transition-colors cursor-pointer flex flex-col justify-between group ${
                    !isCurrentMonth ? "opacity-35" : ""
                  } ${
                    isSelected
                      ? "ring-2 ring-blue-500 bg-blue-50/20 dark:bg-blue-950/20 z-10"
                      : "hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                  }`}
                >
                  {/* Day Number Header */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full transition ${
                        isCurrentDay
                          ? "bg-blue-600 text-white font-bold shadow-sm"
                          : isSelected
                          ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100"
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
                      title={`Add task on ${format(dayItem, "MMM d")}`}
                      className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-md transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Task Items inside Day Cell (compact preview) */}
                  <div className="mt-1 space-y-1 flex-1 overflow-hidden">
                    {dayTasks.slice(0, 3).map((task) => {
                      const category = (task.category || inferTaskCategory(task.title, task.course_name)) as TaskCategory;
                      const catConfig = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.personal;
                      const isMeeting = task.is_lecture_or_meeting || isLectureOrMeeting(task);

                      return (
                        <div
                          key={task.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditTask(task);
                          }}
                          title={task.title}
                          className={`text-[10px] sm:text-[11px] leading-tight px-1.5 py-0.5 rounded truncate flex items-center gap-1 transition ${
                            task.is_completed
                              ? "line-through text-zinc-400 bg-zinc-100/60 dark:bg-zinc-800/40 opacity-60"
                              : isMeeting
                              ? "text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100"
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
                      );
                    })}

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
        </div>

        {/* Right Side: Google Calendar-inspired Day Schedule Panel */}
        {isDayPanelOpen && selectedDay && (
          <div className="lg:col-span-5 xl:col-span-4 bg-zinc-50/80 dark:bg-[#181922] border border-zinc-200/90 dark:border-zinc-800/90 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4 animate-in fade-in slide-in-from-right-4 duration-150 sticky top-20">
            {/* Day Header */}
            <div className="flex items-start justify-between pb-3 border-b border-zinc-200/70 dark:border-zinc-800/70">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    {format(selectedDay, "EEEE")}
                  </span>
                  {isToday(selectedDay) && (
                    <span className="px-2 py-0.2 text-[10px] font-bold rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                      Today
                    </span>
                  )}
                </div>
                <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight mt-0.5">
                  {format(selectedDay, "MMMM d, yyyy")}
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {selectedDayTasks.length} {selectedDayTasks.length === 1 ? "task" : "tasks"} scheduled
                </p>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onAddTaskOnDate(selectedDay)}
                  title="Add task on this day"
                  className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 transition shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsDayPanelOpen(false)}
                  title="Close side schedule"
                  className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Schedule Body: Google Calendar style timeline view */}
            {selectedDayTasks.length === 0 ? (
              <div className="py-12 text-center text-zinc-400 dark:text-zinc-500">
                <CalendarIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                  No tasks or events for this day
                </p>
                <p className="text-[11px] opacity-70 mt-0.5">Your schedule is completely clear</p>
                <button
                  type="button"
                  onClick={() => onAddTaskOnDate(selectedDay)}
                  className="mt-3 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 transition shadow-sm"
                >
                  + Add task for {format(selectedDay, "MMM d")}
                </button>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[65vh] overflow-y-auto pr-1">
                {selectedDayTasks.map((task) => {
                  const directUrl =
                    resolveDirectCanvasUrl(task.external_url, task.notes, task.canvas_uid) ||
                    task.external_url;
                  const isMeeting = task.is_lecture_or_meeting || isLectureOrMeeting(task);
                  const category = (task.category || inferTaskCategory(task.title, task.course_name)) as TaskCategory;
                  const catConfig = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.personal;
                  const zoomMatch = task.notes ? task.notes.match(/(https?:\/\/[^\s<>"'\\]*zoom\.us\/[^\s<>"'\\]*)/i) : null;
                  const zoomUrl = zoomMatch ? zoomMatch[1] : null;

                  // Format time (e.g. 3:30 PM)
                  const timeDisplay = task.due_date
                    ? format(new Date(task.due_date), "h:mm a")
                    : "Any time";

                  return (
                    <div
                      key={task.id}
                      onClick={() => onEditTask(task)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer group relative ${
                        task.is_completed
                          ? "bg-zinc-100/60 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800/80 opacity-60"
                          : isMeeting
                          ? "bg-amber-50/70 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-900/40 hover:border-amber-300 dark:hover:border-amber-700"
                          : category === "gym"
                          ? "bg-orange-50/50 dark:bg-orange-950/20 border-orange-200/70 dark:border-orange-900/40 hover:border-orange-300"
                          : category === "shopping"
                          ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/70 dark:border-emerald-900/40 hover:border-emerald-300"
                          : category === "laundry"
                          ? "bg-purple-50/50 dark:bg-purple-950/20 border-purple-200/70 dark:border-purple-900/40 hover:border-purple-300"
                          : category === "cooking"
                          ? "bg-pink-50/50 dark:bg-pink-950/20 border-pink-200/70 dark:border-pink-900/40 hover:border-pink-300"
                          : "bg-white dark:bg-zinc-900/90 border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm"
                      }`}
                    >
                      {/* Left accent bar (Google Calendar style) */}
                      <div
                        className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full"
                        style={{
                          backgroundColor:
                            isMeeting
                              ? "#f59e0b"
                              : task.priority === "P1"
                              ? "#f43f5e"
                              : catConfig.color,
                        }}
                      />

                      <div className="pl-1.5 space-y-1.5">
                        {/* Time & Priority Row */}
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-zinc-400" />
                            <span>{timeDisplay}</span>
                          </span>

                          <span
                            className={`px-1.5 py-0.2 rounded-md font-bold text-[10px] ${
                              task.priority === "P1"
                                ? "bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400"
                                : task.priority === "P2"
                                ? "bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400"
                                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                            }`}
                          >
                            {task.priority}
                          </span>
                        </div>

                        {/* Title and Complete Button */}
                        <div className="flex items-start gap-2.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleComplete(task.id);
                            }}
                            className={`w-4 h-4 mt-0.5 rounded-full border flex items-center justify-center shrink-0 transition ${
                              task.is_completed
                                ? "bg-zinc-700 border-zinc-700 text-white dark:bg-zinc-300 dark:text-zinc-900"
                                : "border-zinc-300 dark:border-zinc-600 hover:border-zinc-500"
                            }`}
                          >
                            {task.is_completed && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </button>

                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-xs font-semibold leading-snug ${
                                task.is_completed
                                  ? "line-through text-zinc-400"
                                  : "text-zinc-900 dark:text-zinc-100"
                              }`}
                            >
                              {task.title}
                            </p>

                            {task.notes && (
                              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-0.5">
                                {task.notes}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Badges & Actions Row */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px]">
                          {/* Course / Category Badge */}
                          {category !== "course" ? (
                            <span
                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-semibold border ${catConfig.badgeClass}`}
                            >
                              <span>{catConfig.icon}</span>
                              <span>{catConfig.label}</span>
                            </span>
                          ) : task.course_name ? (
                            <span className="font-semibold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/40">
                              📚 {task.course_name}
                            </span>
                          ) : null}

                          {/* Virtual class meeting badge */}
                          {isMeeting && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100/70 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-medium">
                              <Video className="w-2.5 h-2.5" />
                              <span>Virtual Lecture</span>
                            </span>
                          )}

                          {/* Join Zoom link button if available */}
                          {zoomUrl && (
                            <a
                              href={zoomUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400 hover:underline bg-white dark:bg-zinc-800 border border-blue-200 dark:border-blue-900/60 px-1.5 py-0.5 rounded ml-auto"
                            >
                              <Video className="w-2.5 h-2.5 text-blue-500" />
                              <span>Join Zoom</span>
                              <ArrowUpRight className="w-2.5 h-2.5 opacity-60" />
                            </a>
                          )}

                          {/* Direct Canvas link button if available */}
                          {directUrl && !zoomUrl && (
                            <a
                              href={directUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-0.5 font-medium text-blue-600 dark:text-blue-400 hover:underline ml-auto"
                            >
                              <span>Canvas</span>
                              <ArrowUpRight className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
