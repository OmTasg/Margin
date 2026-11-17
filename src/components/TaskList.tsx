"use client";

import React, { useState } from "react";
import { Task, UserSettings } from "@/lib/types";
import { TaskCard } from "./TaskCard";
import { ChevronDown, ChevronRight, Check } from "lucide-react";

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
      <div className="py-20 text-center text-zinc-400 dark:text-zinc-500">
        <p className="text-sm font-medium">No tasks</p>
        <p className="text-xs mt-1 opacity-70">
          Press <kbd className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800">N</kbd> to add your first task
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* 1. Overdue Tasks */}
      {overdue.length > 0 && (
        <section>
          <div className="flex items-center gap-2 pb-1.5 text-xs font-semibold tracking-wider uppercase text-rose-500">
            <span>Overdue</span>
            <span className="font-mono text-[11px] opacity-70">({overdue.length})</span>
          </div>
          <div>
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
        <section>
          <div className="flex items-center gap-2 pb-1.5 text-xs font-semibold tracking-wider uppercase text-zinc-900 dark:text-zinc-100">
            <span>Today</span>
            <span className="font-mono text-[11px] text-zinc-400">({today.length})</span>
          </div>
          <div>
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
        <section>
          <div className="flex items-center gap-2 pb-1.5 text-xs font-semibold tracking-wider uppercase text-zinc-600 dark:text-zinc-400">
            <span>Tomorrow</span>
            <span className="font-mono text-[11px] text-zinc-400">({tomorrow.length})</span>
          </div>
          <div>
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

      {/* 4. Upcoming / Later Tasks */}
      {later.length > 0 && (
        <section>
          <div className="flex items-center gap-2 pb-1.5 text-xs font-semibold tracking-wider uppercase text-zinc-500 dark:text-zinc-400">
            <span>Upcoming</span>
            <span className="font-mono text-[11px] text-zinc-400">({later.length})</span>
          </div>
          <div>
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

      {/* 5. Someday / No Due Date */}
      {noDueDate.length > 0 && (
        <section>
          <div className="flex items-center gap-2 pb-1.5 text-xs font-semibold tracking-wider uppercase text-zinc-400 dark:text-zinc-500">
            <span>Someday</span>
            <span className="font-mono text-[11px] text-zinc-400">({noDueDate.length})</span>
          </div>
          <div>
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

      {/* Peaceful All-Caught-Up message */}
      {totalActiveCount === 0 && completed.length > 0 && (
        <div className="py-12 text-center text-zinc-400 dark:text-zinc-500">
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">All tasks completed</p>
          <p className="text-xs mt-0.5 opacity-60">You have no remaining items on your list.</p>
        </div>
      )}

      {/* 6. Completed Collapsible Archive */}
      {completed.length > 0 && (
        <section className="pt-4">
          <button
            type="button"
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition py-1"
          >
            {showCompleted ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
            <span>Completed ({completed.length})</span>
          </button>

          {showCompleted && (
            <div className="mt-1 animate-in fade-in duration-150">
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
