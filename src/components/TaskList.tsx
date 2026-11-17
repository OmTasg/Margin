"use client";

import React, { useState } from "react";
import { Task, UserSettings } from "@/lib/types";
import { TaskCard } from "./TaskCard";
import {
  AlertCircle,
  Calendar,
  Clock,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Inbox,
  Sparkles,
} from "lucide-react";

interface Props {
  groupedTasks: {
    overdue: Task[];
    today: Task[];
    tomorrow: Task[];
    later: Task[];
    noDueDate: Task[];
    completed: Task[];
    totalActiveCount: number;
  };
  settings: UserSettings;
  onToggleComplete: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onPushToGCal: (task: Task) => Promise<any>;
}

export function TaskList({
  groupedTasks,
  settings,
  onToggleComplete,
  onEdit,
  onDelete,
  onPushToGCal,
}: Props) {
  const [showCompleted, setShowCompleted] = useState(false);

  const { overdue, today, tomorrow, later, noDueDate, completed, totalActiveCount } =
    groupedTasks;

  if (totalActiveCount === 0 && completed.length === 0) {
    return (
      <div className="py-16 px-4 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
          <Inbox className="w-8 h-8 stroke-[1.5]" />
        </div>
        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1">
          No tasks found
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
          Add your first task above, connect your Canvas feed in Settings, or press{" "}
          <kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-800 rounded text-xs font-mono">
            N
          </kbd>{" "}
          to start!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* 1. Overdue Tasks */}
      {overdue.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center gap-2 px-1 text-rose-600 dark:text-rose-400 font-bold text-xs uppercase tracking-wider">
            <AlertCircle className="w-4 h-4 shrink-0 animate-pulse" />
            <span>Overdue ({overdue.length})</span>
          </div>
          <div className="space-y-2">
            {overdue.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                settings={settings}
                onToggleComplete={onToggleComplete}
                onEdit={onEdit}
                onDelete={onDelete}
                onPushToGCal={onPushToGCal}
              />
            ))}
          </div>
        </section>
      )}

      {/* 2. Today's Tasks */}
      {today.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center gap-2 px-1 text-zinc-900 dark:text-zinc-100 font-bold text-xs uppercase tracking-wider">
            <Calendar className="w-4 h-4 text-blue-500 shrink-0" />
            <span>Today ({today.length})</span>
          </div>
          <div className="space-y-2">
            {today.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                settings={settings}
                onToggleComplete={onToggleComplete}
                onEdit={onEdit}
                onDelete={onDelete}
                onPushToGCal={onPushToGCal}
              />
            ))}
          </div>
        </section>
      )}

      {/* 3. Tomorrow's Tasks */}
      {tomorrow.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center gap-2 px-1 text-zinc-700 dark:text-zinc-300 font-bold text-xs uppercase tracking-wider">
            <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
            <span>Tomorrow ({tomorrow.length})</span>
          </div>
          <div className="space-y-2">
            {tomorrow.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                settings={settings}
                onToggleComplete={onToggleComplete}
                onEdit={onEdit}
                onDelete={onDelete}
                onPushToGCal={onPushToGCal}
              />
            ))}
          </div>
        </section>
      )}

      {/* 4. Later / Upcoming Tasks */}
      {later.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center gap-2 px-1 text-zinc-500 dark:text-zinc-400 font-bold text-xs uppercase tracking-wider">
            <Calendar className="w-4 h-4 text-zinc-400 shrink-0" />
            <span>Upcoming / Later ({later.length})</span>
          </div>
          <div className="space-y-2">
            {later.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                settings={settings}
                onToggleComplete={onToggleComplete}
                onEdit={onEdit}
                onDelete={onDelete}
                onPushToGCal={onPushToGCal}
              />
            ))}
          </div>
        </section>
      )}

      {/* 5. No Due Date */}
      {noDueDate.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center gap-2 px-1 text-zinc-500 dark:text-zinc-400 font-bold text-xs uppercase tracking-wider">
            <Inbox className="w-4 h-4 text-zinc-400 shrink-0" />
            <span>No Due Date ({noDueDate.length})</span>
          </div>
          <div className="space-y-2">
            {noDueDate.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                settings={settings}
                onToggleComplete={onToggleComplete}
                onEdit={onEdit}
                onDelete={onDelete}
                onPushToGCal={onPushToGCal}
              />
            ))}
          </div>
        </section>
      )}

      {/* All Done Celebration Card if 0 active tasks left */}
      {totalActiveCount === 0 && completed.length > 0 && (
        <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 text-center my-6">
          <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            All caught up!
          </h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            You have zero pending tasks for today. Great work!
          </p>
        </div>
      )}

      {/* 6. Completed Collapsible Archive */}
      {completed.length > 0 && (
        <section className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center justify-between w-full py-2 px-1 text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Completed ({completed.length})</span>
            </div>
            {showCompleted ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>

          {showCompleted && (
            <div className="mt-3 space-y-2 animate-in fade-in duration-200">
              {completed.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  settings={settings}
                  onToggleComplete={onToggleComplete}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onPushToGCal={onPushToGCal}
                />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
