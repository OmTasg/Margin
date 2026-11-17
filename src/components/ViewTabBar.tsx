"use client";

import React from "react";
import { ViewTab } from "./TaskList";
import {
  Sun,
  Clock,
  Calendar as CalendarIcon,
  Layers,
  CheckCircle2,
  Plus,
} from "lucide-react";

interface Props {
  currentView: ViewTab;
  onViewChange: (v: ViewTab) => void;
  counts: {
    today: number;
    upcoming: number;
    all: number;
    completed: number;
  };
  onOpenNewTask: () => void;
}

export function ViewTabBar({
  currentView,
  onViewChange,
  counts,
  onOpenNewTask,
}: Props) {
  const tabs: { id: ViewTab; label: string; icon: React.ReactNode; count?: number; hotkey?: string }[] = [
    {
      id: "today",
      label: "Today",
      icon: <Sun className="w-3.5 h-3.5 text-amber-500" />,
      count: counts.today,
      hotkey: "1",
    },
    {
      id: "upcoming",
      label: "Upcoming",
      icon: <Clock className="w-3.5 h-3.5 text-blue-500" />,
      count: counts.upcoming,
      hotkey: "2",
    },
    {
      id: "calendar",
      label: "Calendar",
      icon: <CalendarIcon className="w-3.5 h-3.5 text-indigo-500" />,
      hotkey: "3",
    },
    {
      id: "all",
      label: "All Tasks",
      icon: <Layers className="w-3.5 h-3.5 text-zinc-400" />,
      count: counts.all,
      hotkey: "4",
    },
    {
      id: "completed",
      label: "Done",
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />,
      count: counts.completed > 0 ? counts.completed : undefined,
      hotkey: "5",
    },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-3 border-b border-zinc-200/70 dark:border-zinc-800/70">
      {/* Primary View Tabs */}
      <nav aria-label="Views" className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        {tabs.map((tab) => {
          const isActive = currentView === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onViewChange(tab.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition shrink-0 ${
                isActive
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold shadow-sm"
                  : "bg-zinc-100/70 dark:bg-zinc-800/40 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {typeof tab.count === "number" && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    isActive
                      ? "bg-zinc-800 text-zinc-200 dark:bg-zinc-200 dark:text-zinc-800"
                      : "bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Prominent + New Task Action Button */}
      <button
        type="button"
        onClick={onOpenNewTask}
        title="Create new task (Press N)"
        className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 shadow-sm transition active:scale-95 shrink-0 ml-auto"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>New Task</span>
        <kbd className="hidden sm:inline font-mono text-[10px] opacity-60 ml-0.5">N</kbd>
      </button>
    </div>
  );
}
