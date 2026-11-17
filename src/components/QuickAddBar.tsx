"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Plus,
  Calendar as CalendarIcon,
  Clock,
  Sparkles,
  Tag,
  AlertTriangle,
  Send,
  ChevronDown,
} from "lucide-react";
import { Priority, Task, UserSettings } from "@/lib/types";
import { parseNaturalLanguageTask } from "@/lib/naturalLanguage";
import { format, addDays } from "date-fns";

interface Props {
  settings: UserSettings;
  onAddTask: (task: Partial<Task>) => Promise<any>;
  inputRef?: React.RefObject<HTMLInputElement>;
}

export function QuickAddBar({ settings, onAddTask, inputRef: externalRef }: Props) {
  const localRef = useRef<HTMLInputElement>(null);
  const inputRef = externalRef || localRef;

  const [input, setInput] = useState("");
  const [priority, setPriority] = useState<Priority>("P2");
  const [dueDateType, setDueDateType] = useState<"none" | "today" | "tomorrow" | "custom">("today");
  const [customDateTime, setCustomDateTime] = useState("");
  const [course, setCourse] = useState("");
  const [showCourseInput, setShowCourseInput] = useState(false);
  const [reminderMinutes, setReminderMinutes] = useState(
    settings.default_reminder_lead_time_minutes
  );
  const [showReminderPicker, setShowReminderPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync reminder default with settings
  useEffect(() => {
    setReminderMinutes(settings.default_reminder_lead_time_minutes);
  }, [settings.default_reminder_lead_time_minutes]);

  // Live natural language preview hint
  const nlpPreview = input.trim() ? parseNaturalLanguageTask(input) : null;

  const handleQuickAdd = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Parse natural language from title
      const parsed = parseNaturalLanguageTask(input);

      // Determine final priority: parsed NLP takes precedence if explicitly mentioned, otherwise pill
      const finalPriority = parsed.priority || priority;

      // Determine final due date:
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

      // Determine final course
      const finalCourse = parsed.courseName || (course.trim() ? course.trim() : null);

      await onAddTask({
        title: parsed.cleanTitle || input.trim(),
        priority: finalPriority,
        due_date: finalDueDate,
        reminder_lead_time_minutes: reminderMinutes,
        course_name: finalCourse,
        source: "manual",
      });

      // Reset form
      setInput("");
      setDueDateType("today");
      setCustomDateTime("");
      setCourse("");
      setShowCourseInput(false);
      setShowReminderPicker(false);
    } finally {
      setIsSubmitting(false);
      inputRef.current?.focus();
    }
  };

  const priorityStyles: Record<Priority, { label: string; activeClass: string; inactiveClass: string }> = {
    P1: {
      label: "P1 High",
      activeClass: "bg-rose-500 text-white border-rose-500 shadow-sm",
      inactiveClass: "text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/40",
    },
    P2: {
      label: "P2 Med",
      activeClass: "bg-amber-500 text-white border-amber-500 shadow-sm",
      inactiveClass: "text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/50 hover:bg-amber-50 dark:hover:bg-amber-950/40",
    },
    P3: {
      label: "P3 Low",
      activeClass: "bg-blue-600 text-white border-blue-600 shadow-sm",
      inactiveClass: "text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/50 hover:bg-blue-50 dark:hover:bg-blue-950/40",
    },
  };

  const reminderOptions = [
    { label: "At due date", value: 0 },
    { label: "15m before", value: 15 },
    { label: "1h before", value: 60 },
    { label: "3h before", value: 180 },
    { label: "1d before", value: 1440 },
  ];

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-lg p-3 sm:p-4 mb-6 transition-all focus-within:ring-2 focus-within:ring-blue-500/50">
      <form onSubmit={handleQuickAdd} className="space-y-3">
        {/* Main Input Field */}
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Add a task... try 'Problem set 3 p1 tomorrow 5pm #CS106'"
            className="flex-1 text-base sm:text-sm bg-transparent text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 focus:outline-none py-1"
          />

          <button
            type="submit"
            disabled={!input.trim() || isSubmitting}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white text-sm font-semibold rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 transition shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span className="hidden sm:inline">Add Task</span>
          </button>
        </div>

        {/* Dynamic Natural Language Detection Hint */}
        {nlpPreview && (nlpPreview.priority || nlpPreview.dueDate || nlpPreview.courseName) && (
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/40 text-[11px] text-blue-700 dark:text-blue-300">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">
              Detected:{" "}
              {nlpPreview.priority && <strong>Priority {nlpPreview.priority} • </strong>}
              {nlpPreview.dueDate && (
                <strong>Due {format(nlpPreview.dueDate, "EEE, MMM d @ h:mm a")} • </strong>
              )}
              {nlpPreview.courseName && <strong>Course [{nlpPreview.courseName}]</strong>}
            </span>
          </div>
        )}

        {/* Quick Select Pills Bar */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
          {/* Due Date Pills */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setDueDateType("today")}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition ${
                dueDateType === "today"
                  ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100"
                  : "text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setDueDateType("tomorrow")}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition ${
                dueDateType === "tomorrow"
                  ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100"
                  : "text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              Tomorrow
            </button>
            <button
              type="button"
              onClick={() => {
                setDueDateType(dueDateType === "custom" ? "none" : "custom");
              }}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg border flex items-center gap-1 transition ${
                dueDateType === "custom"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              <CalendarIcon className="w-3 h-3" />
              <span>Pick Date</span>
            </button>
          </div>

          <span className="w-px h-4 bg-zinc-200 dark:bg-zinc-800 shrink-0"></span>

          {/* Priority Pills */}
          <div className="flex items-center gap-1 shrink-0">
            {(["P1", "P2", "P3"] as Priority[]).map((p) => {
              const cfg = priorityStyles[p];
              const isSelected = priority === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition ${
                    isSelected ? cfg.activeClass : cfg.inactiveClass
                  }`}
                >
                  {cfg.label}
                </button>
              );
            })}
          </div>

          <span className="w-px h-4 bg-zinc-200 dark:bg-zinc-800 shrink-0"></span>

          {/* Course / Tag Pill */}
          <div className="shrink-0">
            {showCourseInput ? (
              <input
                type="text"
                placeholder="Course (e.g. CS106)"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                onBlur={() => {
                  if (!course.trim()) setShowCourseInput(false);
                }}
                autoFocus
                className="w-32 px-2 py-1 text-xs bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 uppercase"
              />
            ) : (
              <button
                type="button"
                onClick={() => setShowCourseInput(true)}
                className="px-2.5 py-1 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-1 transition"
              >
                <Tag className="w-3 h-3" />
                <span>{course ? `[${course.toUpperCase()}]` : "+ Course"}</span>
              </button>
            )}
          </div>

          {/* Reminder Time Pill */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setShowReminderPicker(!showReminderPicker)}
              className="px-2.5 py-1 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-1 transition"
            >
              <Clock className="w-3 h-3 text-indigo-500" />
              <span>
                {reminderOptions.find((r) => r.value === reminderMinutes)?.label ||
                  `${reminderMinutes}m before`}
              </span>
              <ChevronDown className="w-3 h-3 text-zinc-400" />
            </button>

            {showReminderPicker && (
              <div className="absolute right-0 bottom-full mb-1 z-40 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl py-1 w-36">
                {reminderOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setReminderMinutes(opt.value);
                      setShowReminderPicker(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-700 transition ${
                      reminderMinutes === opt.value
                        ? "font-semibold text-blue-600 dark:text-blue-400"
                        : "text-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Custom Date Time Input if 'Pick Date' selected */}
        {dueDateType === "custom" && (
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">Due at:</span>
            <input
              type="datetime-local"
              value={customDateTime}
              onChange={(e) => setCustomDateTime(e.target.value)}
              className="px-2.5 py-1 text-xs bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        )}
      </form>
    </div>
  );
}
