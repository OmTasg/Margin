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
  ShoppingCart,
} from "lucide-react";

interface Props {
  currentView: ViewTab;
  onViewChange: (v: ViewTab) => void;
  counts: {
    today: number;
    upcoming: number;
    all: number;
    shopping?: number;
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
  const tabs: {
    id: ViewTab;
    label: string;
    shortLabel: string;
    icon: React.ReactNode;
    count?: number;
    hotkey?: string;
  }[] = [
    {
      id: "today",
      label: "Today",
      shortLabel: "Today",
      icon: <Sun className="w-3.5 h-3.5 text-amber-500" />,
      count: counts.today,
      hotkey: "1",
    },
    {
      id: "upcoming",
      label: "Upcoming",
      shortLabel: "Upcoming",
      icon: <Clock className="w-3.5 h-3.5 text-blue-500" />,
      count: counts.upcoming,
      hotkey: "2",
    },
    {
      id: "calendar",
      label: "Calendar",
      shortLabel: "Calendar",
      icon: <CalendarIcon className="w-3.5 h-3.5 text-indigo-500" />,
      hotkey: "3",
    },
    {
      id: "shopping",
      label: "Shopping",
      shortLabel: "Shopping",
      icon: <ShoppingCart className="w-3.5 h-3.5 text-emerald-500" />,
      count: counts.shopping,
      hotkey: "4",
    },
    {
      id: "all",
      label: "All Tasks",
      shortLabel: "All",
      icon: <Layers className="w-3.5 h-3.5 text-zinc-400" />,
      count: counts.all,
      hotkey: "5",
    },
    {
      id: "completed",
      label: "Done",
      shortLabel: "Done",
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />,
      count: counts.completed > 0 ? counts.completed : undefined,
      hotkey: "6",
    },
  ];

  return (
    <div>
      {/* Mobile-Optimized 6-Column Segmented Tab Bar */}
      <div className="sm:hidden space-y-2.5 mb-4">
        <div className="grid grid-cols-6 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/60 shadow-inner">
          {tabs.map((tab) => {
            const isActive = currentView === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onViewChange(tab.id)}
                className={`flex flex-col items-center justify-center py-2 px-0.5 rounded-xl transition-all relative ${
                  isActive
                    ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm font-bold"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 font-medium"
                }`}
              >
                <div className="relative flex items-center justify-center">
                  {tab.icon}
                  {typeof tab.count === "number" && tab.count > 0 && (
                    <span
                      className={`absolute -top-1.5 -right-2.5 text-[9px] font-bold px-1 py-0.2 rounded-full leading-none ${
                        isActive
                          ? "bg-blue-600 text-white"
                          : "bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </div>
                <span className="text-[10px] mt-1 tracking-tight leading-none truncate max-w-full">
                  {tab.shortLabel}
                </span>
              </button>
            );
          })}
        </div>

        {/* Mobile Full-Width Quick-Add Button */}
        <button
          type="button"
          onClick={onOpenNewTask}
          className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-sm active:scale-[0.98]"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Task</span>
        </button>
      </div>

      {/* Desktop / Tablet Tab Navigation Bar */}
      <div className="hidden sm:flex flex-wrap items-center justify-between gap-3 mb-5 pb-3 border-b border-zinc-200/70 dark:border-zinc-800/70">
        <nav aria-label="Views" className="flex items-center gap-1.5 py-1">
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

        {/* Prominent + New Task Action Button on Desktop */}
        <button
          type="button"
          onClick={onOpenNewTask}
          title="Create new task (Press N)"
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 shadow-sm transition active:scale-95 shrink-0 ml-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Task</span>
          <kbd className="font-mono text-[10px] opacity-60 ml-0.5">N</kbd>
        </button>
      </div>
    </div>
  );
}
