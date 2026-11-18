"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
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
  VideoOff,
  X,
  Maximize2,
  Minimize2,
  Hourglass,
  Layers,
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
  subDays,
  isToday,
} from "date-fns";
import {
  resolveDirectCanvasUrl,
  getCanvasAppDeepLink,
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
  hideLectures?: boolean;
  onToggleHideLectures?: () => void;
}

export function CalendarView({
  tasks,
  settings,
  onToggleComplete,
  onEditTask,
  onAddTaskOnDate,
  hideLectures,
  onToggleHideLectures,
}: Props) {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date());
  const [isDayPanelOpen, setIsDayPanelOpen] = useState(true);
  const [isMaximized, setIsMaximized] = useState(false);
  const dayPanelRef = useRef<HTMLDivElement>(null);
  const [localHideLectures, setLocalHideLectures] = useState<boolean>(
    hideLectures !== undefined ? hideLectures : true
  );

  useEffect(() => {
    if (hideLectures !== undefined) {
      setLocalHideLectures(hideLectures);
    }
  }, [hideLectures]);

  const effectiveHideLectures =
    hideLectures !== undefined ? hideLectures : localHideLectures;

  const handleToggleHideLectures = () => {
    if (onToggleHideLectures) {
      onToggleHideLectures();
    } else {
      setLocalHideLectures((prev) => !prev);
    }
  };

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => {
    const now = new Date();
    setCurrentMonth(now);
    setSelectedDay(now);
    setIsDayPanelOpen(true);
  };

  const prevDay = () => {
    if (!selectedDay) return;
    const prev = subDays(selectedDay, 1);
    setSelectedDay(prev);
    if (!isSameMonth(prev, currentMonth)) {
      setCurrentMonth(prev);
    }
  };

  const nextDay = () => {
    if (!selectedDay) return;
    const next = addDays(selectedDay, 1);
    setSelectedDay(next);
    if (!isSameMonth(next, currentMonth)) {
      setCurrentMonth(next);
    }
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  // Total lecture count across all tasks
  const totalLecturesCount = useMemo(() => {
    return tasks.filter((t) => t.is_lecture_or_meeting || isLectureOrMeeting(t))
      .length;
  }, [tasks]);

  // Group tasks by day (YYYY-MM-DD string key), respecting hide lectures toggle
  const tasksByDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    tasks.forEach((task) => {
      if (!task.due_date) return;
      const isMeeting = task.is_lecture_or_meeting || isLectureOrMeeting(task);
      if (effectiveHideLectures && isMeeting) return;

      const d = new Date(task.due_date);
      if (isNaN(d.getTime())) return;
      const key = format(d, "yyyy-MM-dd");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(task);
    });
    return map;
  }, [tasks, effectiveHideLectures]);

  // Count of hidden lectures on the currently selected day
  const hiddenLecturesOnSelectedDayCount = useMemo(() => {
    if (!selectedDay || !effectiveHideLectures) return 0;
    const dayKey = format(selectedDay, "yyyy-MM-dd");
    return tasks.filter((t) => {
      if (!t.due_date) return false;
      const d = new Date(t.due_date);
      if (isNaN(d.getTime())) return false;
      if (format(d, "yyyy-MM-dd") !== dayKey) return false;
      return t.is_lecture_or_meeting || isLectureOrMeeting(t);
    }).length;
  }, [selectedDay, tasks, effectiveHideLectures]);

  // Generate calendar grid days
  const calendarDays = useMemo(() => {
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

  // Selected day tasks sorted chronologically
  const selectedDayKey = selectedDay ? format(selectedDay, "yyyy-MM-dd") : null;
  const selectedDayTasks = useMemo(() => {
    if (!selectedDayKey) return [];
    const list = [...(tasksByDay.get(selectedDayKey) || [])];

    return list.sort((a, b) => {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });
  }, [selectedDayKey, tasksByDay]);

  const handleSelectDay = (dayItem: Date) => {
    setSelectedDay(dayItem);
    setIsDayPanelOpen(true);
    // On mobile (< 1024px), smoothly scroll the day schedule below into view
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setTimeout(() => {
        dayPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 50);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header Navigation & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-zinc-200/80 dark:border-zinc-800/80">
        {/* Row 1 on mobile: Month + Navigation Controls */}
        <div className="flex items-center justify-between w-full sm:w-auto gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
              {format(currentMonth, "MMMM yyyy")}
            </h2>
            <button
              onClick={goToToday}
              className="px-2 py-0.5 text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              Today
            </button>
          </div>

          {/* Month pagination arrows */}
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

        {/* Row 2 on mobile / Right side on desktop: Hide / Show Lectures Toggle */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleToggleHideLectures}
            className={`flex-1 sm:flex-initial px-3 py-1.5 text-xs font-medium rounded-xl border transition-all flex items-center justify-center gap-1.5 shadow-sm ${
              effectiveHideLectures
                ? "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300/80 dark:border-amber-800/80 hover:bg-amber-100 dark:hover:bg-amber-900/50"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            }`}
            title={
              effectiveHideLectures
                ? "Click to show Zoom and virtual lectures"
                : "Click to hide Zoom and virtual lectures"
            }
          >
            {effectiveHideLectures ? (
              <>
                <VideoOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Hide Lectures {totalLecturesCount > 0 && `(${totalLecturesCount})`}</span>
              </>
            ) : (
              <>
                <Video className="w-3.5 h-3.5 text-zinc-500" />
                <span>Show Lectures {totalLecturesCount > 0 && `(${totalLecturesCount})`}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Responsive Grid Layout */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Month Grid: Full width on mobile; takes 6 cols (50%) on desktop when day panel is open */}
        {(!isMaximized || !isDayPanelOpen) && (
          <div
            className={`w-full transition-all duration-200 ${
              isDayPanelOpen && selectedDay
                ? "col-span-1 lg:col-span-6 xl:col-span-6"
                : "col-span-1 lg:col-span-12"
            }`}
          >
            {/* Weekday Labels - Single letters on mobile so they never collide! */}
            <div className="w-full grid grid-cols-7 gap-1 text-center text-xs font-semibold text-zinc-400 dark:text-zinc-500 pb-1">
              {weekDayNames.map((name, i) => (
                <div key={name} className="py-1">
                  <span className="sm:hidden">{["S", "M", "T", "W", "T", "F", "S"][i]}</span>
                  <span className="hidden sm:inline">{name}</span>
                </div>
              ))}
            </div>

            {/* Month Days Grid - Edge-to-edge full width on mobile */}
            <div className="w-full grid grid-cols-7 gap-1 sm:gap-px bg-zinc-200/50 sm:bg-zinc-200/60 dark:bg-zinc-800/40 sm:dark:bg-zinc-800/60 rounded-2xl overflow-hidden border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm p-1 sm:p-0">
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
                    className={`w-full aspect-square sm:aspect-auto sm:min-h-[75px] md:min-h-[105px] p-1 sm:p-2 rounded-xl sm:rounded-none bg-white dark:bg-[#14151c] transition-colors cursor-pointer flex flex-col items-center sm:items-stretch justify-between group ${
                      !isCurrentMonth ? "opacity-30" : ""
                    } ${
                      isSelected
                        ? "ring-2 ring-blue-500 bg-blue-50/30 dark:bg-blue-950/30 z-10 font-bold shadow-sm"
                        : "hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                    }`}
                  >
                    {/* Day Number Header */}
                    <div className="flex items-center justify-center sm:justify-between w-full">
                      <span
                        className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full transition ${
                          isCurrentDay
                            ? "bg-blue-600 text-white font-bold shadow-sm"
                            : isSelected
                            ? "bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold"
                            : "text-zinc-700 dark:text-zinc-300"
                        }`}
                      >
                        {format(dayItem, "d")}
                      </span>

                      {/* Quick Add Button on Day Hover (desktop only) */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddTaskOnDate(dayItem);
                        }}
                        title={`Add task on ${format(dayItem, "MMM d")}`}
                        className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-md transition hidden sm:block"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Mobile Dot Indicators (< md screens): clean, compact, centered, unsquashed! */}
                    <div className="flex md:hidden items-center justify-center gap-1 mt-auto pb-1">
                      {dayTasks.slice(0, 3).map((task) => (
                        <span
                          key={task.id}
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${getPriorityDot(
                            task.priority
                          )}`}
                        />
                      ))}
                      {dayTasks.length > 3 && (
                        <span className="text-[8px] font-bold text-zinc-400 dark:text-zinc-500 leading-none">
                          +{dayTasks.length - 3}
                        </span>
                      )}
                    </div>

                    {/* Desktop Task Item Badges (md: screens and up) */}
                    <div className="hidden md:block mt-1 space-y-1 flex-1 overflow-hidden">
                      {dayTasks.slice(0, 3).map((task) => {
                        const isMeeting =
                          task.is_lecture_or_meeting || isLectureOrMeeting(task);

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
        )}

        {/* Large, Google Calendar-inspired Single Day Schedule Panel */}
        {isDayPanelOpen && selectedDay && (
          <div
            ref={dayPanelRef}
            className={`w-full ${
              isMaximized
                ? "col-span-1 lg:col-span-12"
                : "col-span-1 lg:col-span-6 xl:col-span-6"
            } bg-zinc-50/90 dark:bg-[#181922] border border-zinc-200/90 dark:border-zinc-800/90 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4 animate-in fade-in duration-150 lg:sticky lg:top-20 mt-3 lg:mt-0`}
          >
            {/* Day Header with Day Flipping Arrows and Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-200/80 dark:border-zinc-800/80">
              <div className="flex items-center gap-2">
                {/* Previous / Next Day Navigation Controls */}
                <div className="flex items-center gap-0.5 mr-1">
                  <button
                    type="button"
                    onClick={prevDay}
                    title="Previous day"
                    className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={nextDay}
                    title="Next day"
                    className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                      {format(selectedDay, "EEEE")}
                    </span>
                    {isToday(selectedDay) && (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                        Today
                      </span>
                    )}
                  </div>
                  <h3 className="text-base sm:text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight mt-0.5">
                    {format(selectedDay, "MMMM d, yyyy")}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {selectedDayTasks.length}{" "}
                    {selectedDayTasks.length === 1 ? "task" : "tasks"} scheduled
                  </p>
                </div>
              </div>

              {/* Day Header Action Buttons: Add, Maximize/Minimize, Close */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onAddTaskOnDate(selectedDay)}
                  title="Add task on this day"
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-xs font-semibold flex items-center gap-1 transition shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Task</span>
                </button>

                {/* Maximize / Split Toggle Button */}
                <button
                  type="button"
                  onClick={() => setIsMaximized(!isMaximized)}
                  title={
                    isMaximized
                      ? "Split view with month grid"
                      : "Maximize day view"
                  }
                  className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition border border-zinc-200/80 dark:border-zinc-800/80"
                >
                  {isMaximized ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </button>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => {
                    setIsDayPanelOpen(false);
                    setIsMaximized(false);
                  }}
                  title="Close side schedule"
                  className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Subtle banner if lectures on this day are hidden */}
            {hiddenLecturesOnSelectedDayCount > 0 && effectiveHideLectures && (
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 flex items-center justify-between text-xs text-amber-800 dark:text-amber-300">
                <div className="flex items-center gap-2">
                  <VideoOff className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>
                    {hiddenLecturesOnSelectedDayCount} virtual{" "}
                    {hiddenLecturesOnSelectedDayCount === 1
                      ? "class / lecture"
                      : "classes / lectures"}{" "}
                    hidden on this day
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleToggleHideLectures}
                  className="underline hover:text-amber-950 dark:hover:text-amber-100 font-semibold text-[11px]"
                >
                  Show Lectures
                </button>
              </div>
            )}

            {/* Spacious Schedule Body (Timeline view) */}
            {selectedDayTasks.length === 0 ? (
              <div className="py-20 text-center text-zinc-400 dark:text-zinc-500">
                <CalendarIcon className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  No tasks scheduled for this day
                </p>
                <p className="text-xs opacity-70 mt-1">
                  Enjoy your free time, or schedule an assignment or habit!
                </p>
                <button
                  type="button"
                  onClick={() => onAddTaskOnDate(selectedDay)}
                  className="mt-4 px-4 py-2 text-xs font-semibold rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 transition shadow-sm"
                >
                  + Add task for {format(selectedDay, "MMMM d")}
                </button>
              </div>
            ) : (
              <div
                className={`space-y-3 overflow-y-auto pr-1 ${
                  isMaximized
                    ? "grid grid-cols-1 md:grid-cols-2 gap-3 space-y-0 max-h-[75vh]"
                    : "max-h-[72vh]"
                }`}
              >
                {selectedDayTasks.map((task) => {
                  const directUrl =
                    resolveDirectCanvasUrl(
                      task.external_url,
                      task.notes,
                      task.canvas_uid
                    ) || task.external_url;
                  const isMeeting =
                    task.is_lecture_or_meeting || isLectureOrMeeting(task);
                  const category = (task.category ||
                    inferTaskCategory(
                      task.title,
                      task.course_name
                    )) as TaskCategory;
                  const catConfig =
                    CATEGORY_CONFIG[category] || CATEGORY_CONFIG.personal;
                  const zoomMatch = task.notes
                    ? task.notes.match(
                        /(https?:\/\/[^\s<>"'\\]*zoom\.us\/[^\s<>"'\\]*)/i
                      )
                    : null;
                  const zoomUrl = zoomMatch ? zoomMatch[1] : null;

                  // Format due time (e.g. 3:30 PM)
                  const timeDisplay = task.due_date
                    ? format(new Date(task.due_date), "h:mm a")
                    : "Any time";

                  return (
                    <div
                      key={task.id}
                      onClick={() => onEditTask(task)}
                      className={`p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer group relative ${
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
                        className="absolute left-0 top-2 bottom-2 w-1.5 rounded-r-full"
                        style={{
                          backgroundColor: isMeeting
                            ? "#f59e0b"
                            : task.priority === "P1"
                            ? "#f43f5e"
                            : task.priority === "P2"
                            ? "#f59e0b"
                            : catConfig.color,
                        }}
                      />

                      <div className="pl-2 space-y-2">
                        {/* Time & Priority Row */}
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-zinc-400" />
                            <span>{timeDisplay}</span>
                            {task.estimated_duration_minutes && (
                              <span className="text-[11px] font-normal text-zinc-400 flex items-center gap-0.5 ml-1">
                                <Hourglass className="w-3 h-3 opacity-60" />
                                <span>~{task.estimated_duration_minutes}m</span>
                              </span>
                            )}
                          </span>

                          <span
                            className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
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

                        {/* Title & Complete Checkbox */}
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
                            {task.is_completed && (
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            )}
                          </button>

                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm font-semibold leading-snug ${
                                task.is_completed
                                  ? "line-through text-zinc-400"
                                  : "text-zinc-900 dark:text-zinc-100"
                              }`}
                            >
                              {task.title}
                            </p>

                            {task.notes && (
                              <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-1">
                                {task.notes}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Badges & Action Links Row */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                          {/* Course / Category Badge */}
                          {category !== "course" ? (
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold border ${catConfig.badgeClass}`}
                            >
                              <span>{catConfig.icon}</span>
                              <span>{catConfig.label}</span>
                            </span>
                          ) : task.course_name ? (
                            <span className="font-semibold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/40">
                              📚 {task.course_name}
                            </span>
                          ) : null}

                          {/* Virtual class meeting badge */}
                          {isMeeting && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100/70 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-medium">
                              <Video className="w-3 h-3" />
                              <span>Virtual Lecture</span>
                            </span>
                          )}

                          {/* Join Zoom link button */}
                          {zoomUrl && (
                            <a
                              href={zoomUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400 hover:underline bg-white dark:bg-zinc-800 border border-blue-200 dark:border-blue-900/60 px-2 py-0.5 rounded-md ml-auto"
                            >
                              <Video className="w-3 h-3 text-blue-500" />
                              <span>Join Zoom</span>
                              <ArrowUpRight className="w-3 h-3 opacity-60" />
                            </a>
                          )}

                          {/* Direct Canvas link */}
                          {directUrl && !zoomUrl && (
                            <a
                              href={
                                typeof navigator !== "undefined" &&
                                /iPad|iPhone|iPod|Android/i.test(navigator.userAgent) &&
                                settings.canvas_open_in_app !== false
                                  ? getCanvasAppDeepLink(directUrl) || directUrl
                                  : directUrl
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => {
                                e.stopPropagation();
                                const isMobile =
                                  typeof navigator !== "undefined" &&
                                  /iPad|iPhone|iPod|Android/i.test(navigator.userAgent);
                                if (isMobile && settings.canvas_open_in_app !== false) {
                                  const deepLink = getCanvasAppDeepLink(directUrl);
                                  if (deepLink) {
                                    e.preventDefault();
                                    window.location.href = deepLink;
                                  }
                                }
                              }}
                              className="inline-flex items-center gap-0.5 font-medium text-blue-600 dark:text-blue-400 hover:underline ml-auto"
                            >
                              <span>Canvas</span>
                              <ArrowUpRight className="w-3 h-3" />
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
