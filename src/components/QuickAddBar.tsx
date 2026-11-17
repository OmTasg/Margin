"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Plus,
  Calendar as CalendarIcon,
  Clock,
  Sparkles,
  Tag,
  Hourglass,
  ChevronDown,
  X,
} from "lucide-react";
import { Priority, Task, UserSettings } from "@/lib/types";
import { parseNaturalLanguageTask } from "@/lib/naturalLanguage";
import { addDays } from "date-fns";

interface Props {
  settings: UserSettings;
  onAddTask: (task: Partial<Task>) => Promise<any>;
  inputRef?: React.RefObject<HTMLInputElement>;
}

export function QuickAddBar({ settings, onAddTask, inputRef: externalRef }: Props) {
  const localRef = useRef<HTMLInputElement>(null);
  const inputRef = externalRef || localRef;
  const containerRef = useRef<HTMLDivElement>(null);

  const [input, setInput] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [priority, setPriority] = useState<Priority>("P2");
  const [dueDateType, setDueDateType] = useState<"none" | "today" | "tomorrow" | "custom">("today");
  const [customDateTime, setCustomDateTime] = useState("");
  const [course, setCourse] = useState("");
  const [showCourseInput, setShowCourseInput] = useState(false);
  const [reminderMinutes, setReminderMinutes] = useState(
    settings.default_reminder_lead_time_minutes
  );
  const [estimatedDuration, setEstimatedDuration] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync default reminder lead time from settings
  useEffect(() => {
    setReminderMinutes(settings.default_reminder_lead_time_minutes);
  }, [settings.default_reminder_lead_time_minutes]);

  // Click outside to collapse if empty
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node) &&
        !input.trim()
      ) {
        setIsExpanded(false);
        setShowCourseInput(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [input]);

  // Dynamic natural language parsing preview
  const nlpPreview = input.trim() ? parseNaturalLanguageTask(input) : null;

  const handleQuickAdd = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const parsed = parseNaturalLanguageTask(input);
      const finalPriority = parsed.priority || priority;

      let finalDueDate: string | null = null;
      if (parsed.dueDate) {
        finalDueDate = parsed.dueDate.toISOString();
      } else if (dueDateType === "today") {
        const d = new Date();
        d.setHours(23, 59, 0, 0);
        finalDueDate = d.toISOString();
      } else if (dueDateType === "tomorrow") {
        const d = addDays(new Date(), 1);
        d.setHours(23, 59, 0, 0);
        finalDueDate = d.toISOString();
      } else if (dueDateType === "custom" && customDateTime) {
        finalDueDate = new Date(customDateTime).toISOString();
      }

      const finalCourse = parsed.courseName || (course.trim() ? course.trim() : null);
      const finalDuration = parsed.estimatedDurationMinutes ?? estimatedDuration;

      await onAddTask({
        title: parsed.cleanTitle || input.trim(),
        priority: finalPriority,
        due_date: finalDueDate,
        reminder_lead_time_minutes: reminderMinutes,
        estimated_duration_minutes: finalDuration,
        course_name: finalCourse,
        source: "manual",
      });

      // Reset
      setInput("");
      setDueDateType("today");
      setCustomDateTime("");
      setCourse("");
      setShowCourseInput(false);
      setEstimatedDuration(null);
      setIsExpanded(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const reminderOptions = [
    { label: "At due time", value: 0 },
    { label: "15m before", value: 15 },
    { label: "1h before", value: 60 },
    { label: "3h before", value: 180 },
    { label: "1d before", value: 1440 },
  ];

  const durationOptions = [
    { label: "15m", value: 15 },
    { label: "30m", value: 30 },
    { label: "45m", value: 45 },
    { label: "1h", value: 60 },
    { label: "1.5h", value: 90 },
    { label: "2h", value: 120 },
  ];

  return (
    <div
      ref={containerRef}
      className={`mb-6 transition-all duration-200 ${
        isExpanded
          ? "bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3.5 shadow-sm"
          : "bg-transparent"
      }`}
    >
      <form onSubmit={handleQuickAdd} className="space-y-3">
        {/* Collapsible / Focusable Input Field */}
        <div
          onClick={() => {
            setIsExpanded(true);
            inputRef.current?.focus();
          }}
          className={`flex items-center gap-2.5 transition-all ${
            !isExpanded
              ? "py-2.5 px-3.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-900/60 hover:border-zinc-300 dark:hover:border-zinc-700 cursor-text"
              : ""
          }`}
        >
          <Plus
            className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform ${
              isExpanded ? "rotate-90 text-zinc-600 dark:text-zinc-300" : ""
            }`}
          />
          <input
            ref={inputRef}
            type="text"
            value={input}
            onFocus={() => setIsExpanded(true)}
            onChange={(e) => {
              setInput(e.target.value);
              if (!isExpanded) setIsExpanded(true);
            }}
            placeholder={
              isExpanded
                ? "What do you need to get done? (e.g. Physics Pset 4 p1 tomorrow 5pm ~45m #PHYS41)"
                : "New task... (press N)"
            }
            className="flex-1 text-sm bg-transparent text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none py-0.5"
          />

          {isExpanded && (
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="submit"
                disabled={!input.trim() || isSubmitting}
                className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 disabled:opacity-30 text-white dark:text-zinc-900 text-xs font-semibold rounded-lg transition active:scale-95 shadow-sm"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setInput("");
                  setIsExpanded(false);
                }}
                className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-lg transition"
                aria-label="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Dynamic Natural Language Detection Preview */}
        {isExpanded && nlpPreview && (nlpPreview.priority || nlpPreview.dueDate || nlpPreview.courseName || nlpPreview.estimatedDurationMinutes) && (
          <div className="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400 pl-1">
            <Sparkles className="w-3 h-3 text-zinc-400 shrink-0" />
            <span className="truncate">
              Detected:{" "}
              {nlpPreview.priority && <strong className="font-medium text-zinc-800 dark:text-zinc-200">Priority {nlpPreview.priority} · </strong>}
              {nlpPreview.dueDate && <strong className="font-medium text-zinc-800 dark:text-zinc-200">Due {nlpPreview.dueDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} · </strong>}
              {nlpPreview.estimatedDurationMinutes && <strong className="font-medium text-zinc-800 dark:text-zinc-200">~{nlpPreview.estimatedDurationMinutes}m · </strong>}
              {nlpPreview.courseName && <strong className="font-medium text-zinc-800 dark:text-zinc-200">[{nlpPreview.courseName}]</strong>}
            </span>
          </div>
        )}

        {/* Collapsible Options Bar (Things 3 style, unboxed, quiet) */}
        {isExpanded && (
          <div className="pt-1.5 border-t border-zinc-200/60 dark:border-zinc-800/60 flex flex-wrap items-center gap-2 text-xs">
            {/* Due Date: Today, Tomorrow, Pick Date */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setDueDateType("today")}
                className={`px-2 py-1 text-xs rounded-md transition ${
                  dueDateType === "today"
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-medium"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setDueDateType("tomorrow")}
                className={`px-2 py-1 text-xs rounded-md transition ${
                  dueDateType === "tomorrow"
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-medium"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
              >
                Tomorrow
              </button>
              <button
                type="button"
                onClick={() => setDueDateType(dueDateType === "custom" ? "none" : "custom")}
                className={`px-2 py-1 text-xs rounded-md flex items-center gap-1 transition ${
                  dueDateType === "custom"
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-medium"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
              >
                <CalendarIcon className="w-3 h-3 opacity-60" />
                <span>Date...</span>
              </button>
            </div>

            <span className="text-zinc-300 dark:text-zinc-700">|</span>

            {/* Priority Selector with subtle colored dots */}
            <div className="flex items-center gap-1 shrink-0">
              {(["P1", "P2", "P3"] as Priority[]).map((p) => {
                const isSelected = priority === p;
                const dotColor =
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
                    className={`px-2 py-1 text-xs rounded-md flex items-center gap-1 transition ${
                      isSelected
                        ? "bg-zinc-200/80 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold"
                        : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
                    <span>{p}</span>
                  </button>
                );
              })}
            </div>

            <span className="text-zinc-300 dark:text-zinc-700">|</span>

            {/* Estimated Duration Selector */}
            <div className="relative inline-flex items-center shrink-0">
              <Hourglass className="w-3 h-3 text-zinc-400 absolute left-2 pointer-events-none" />
              <select
                value={estimatedDuration ?? ""}
                onChange={(e) =>
                  setEstimatedDuration(e.target.value ? parseInt(e.target.value, 10) : null)
                }
                className="pl-6 pr-2 py-1 text-xs bg-transparent border border-zinc-200/80 dark:border-zinc-800 rounded-md text-zinc-700 dark:text-zinc-300 font-medium focus:outline-none cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700 transition"
              >
                <option value="">⏱ Estimate</option>
                {durationOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <span className="text-zinc-300 dark:text-zinc-700">|</span>

            {/* Reminder Lead Time Selector - Reliable & Bug-free native select */}
            <div className="relative inline-flex items-center shrink-0">
              <Clock className="w-3 h-3 text-zinc-400 absolute left-2 pointer-events-none" />
              <select
                value={reminderMinutes}
                onChange={(e) => setReminderMinutes(parseInt(e.target.value, 10))}
                className="pl-6 pr-2 py-1 text-xs bg-transparent border border-zinc-200/80 dark:border-zinc-800 rounded-md text-zinc-700 dark:text-zinc-300 font-medium focus:outline-none cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700 transition"
              >
                {reminderOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    ⏰ {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Course Tag */}
            <div className="shrink-0 ml-auto">
              {showCourseInput ? (
                <input
                  type="text"
                  placeholder="COURSE"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  onBlur={() => {
                    if (!course.trim()) setShowCourseInput(false);
                  }}
                  autoFocus
                  className="w-24 px-2 py-1 text-xs bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md text-zinc-900 dark:text-zinc-100 uppercase"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setShowCourseInput(true)}
                  className="px-2 py-1 text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 flex items-center gap-1 transition"
                >
                  <Tag className="w-3 h-3" />
                  <span>{course ? `[${course.toUpperCase()}]` : "+ Course"}</span>
                </button>
              )}
            </div>

            {/* Custom Date Time input if picked */}
            {dueDateType === "custom" && (
              <div className="w-full pt-2 flex items-center gap-2">
                <span className="text-xs text-zinc-400">Due at:</span>
                <input
                  type="datetime-local"
                  value={customDateTime}
                  onChange={(e) => setCustomDateTime(e.target.value)}
                  className="px-2.5 py-1 text-xs bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md text-zinc-900 dark:text-zinc-100"
                />
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
