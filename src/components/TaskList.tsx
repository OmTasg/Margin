"use client";

import React, { useState } from "react";
import { Task, UserSettings } from "@/lib/types";
import { TaskCard } from "./TaskCard";
import { ChevronDown, ChevronRight, CheckCircle2, Clock, Calendar, Check } from "lucide-react";

export type ViewTab = "today" | "upcoming" | "calendar" | "all" | "completed";

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
  currentView: ViewTab;
  settings: UserSettings;
  onToggleComplete: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onPushToGCal: (task: Task) => Promise<any>;
  onOpenNewTask: () => void;
}

export function TaskList({
  groupedTasks,
  currentView,
  settings,
  onToggleComplete,
  onEdit,
  onDelete,
  onPushToGCal,
  onOpenNewTask,
}: Props) {
  const [showCompletedInAll, setShowCompletedInAll] = useState(false);

  const { overdue, today, tomorrow, later, noDueDate, completed, totalActiveCount } =
    groupedTasks;

  if (totalActiveCount === 0 && completed.length === 0) {
    return (
      <div className="py-20 text-center text-zinc-400 dark:text-zinc-500">
        <CheckCircle2 className="w-10 h-10 mx-auto mb-3 opacity-30 text-zinc-400" />
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">No tasks on your radar</p>
        <p className="text-xs mt-1 opacity-70">
          Sync Canvas in Settings or press <kbd className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800">N</kbd> to add a task
        </p>
        <button
          type="button"
          onClick={onOpenNewTask}
          className="mt-4 px-4 py-1.5 text-xs font-semibold rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 transition shadow-sm"
        >
          + Create Task
        </button>
      </div>
    );
  }

  // --- View: TODAY ---
  if (currentView === "today") {
    const hasTodayOrOverdue = overdue.length > 0 || today.length > 0;

    return (
      <div className="space-y-6 pb-20">
        {/* Overdue Items (Require Immediate Action) */}
        {overdue.length > 0 && (
          <section className="bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/70 dark:border-rose-900/40 rounded-2xl p-4">
            <div className="flex items-center justify-between pb-2 text-xs font-bold tracking-wider uppercase text-rose-600 dark:text-rose-400">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Overdue (&lt; 48 hours)</span>
              </span>
              <span className="font-mono text-[11px] px-1.5 py-0.5 rounded-full bg-rose-200/70 dark:bg-rose-900/60">
                {overdue.length}
              </span>
            </div>
            <div className="divide-y divide-rose-200/50 dark:divide-rose-900/30">
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

        {/* Due Today */}
        {today.length > 0 ? (
          <section>
            <div className="flex items-center gap-2 pb-2 text-xs font-semibold tracking-wider uppercase text-zinc-900 dark:text-zinc-100">
              <span>Today</span>
              <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                {today.length}
              </span>
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
        ) : (
          !hasTodayOrOverdue && (
            <div className="py-16 text-center text-zinc-400 dark:text-zinc-500">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-500/80 stroke-1" />
              <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                All clear for Today
              </p>
              <p className="text-xs mt-1 text-zinc-400">
                You have no tasks or assignments due today.
              </p>
              <button
                type="button"
                onClick={onOpenNewTask}
                className="mt-4 px-4 py-1.5 text-xs font-semibold rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 transition shadow-sm"
              >
                + Add a Task for Today
              </button>
            </div>
          )
        )}
      </div>
    );
  }

  // --- View: UPCOMING ---
  if (currentView === "upcoming") {
    const hasUpcoming = tomorrow.length > 0 || later.length > 0;

    return (
      <div className="space-y-6 pb-20">
        {tomorrow.length > 0 && (
          <section>
            <div className="flex items-center gap-2 pb-2 text-xs font-semibold tracking-wider uppercase text-zinc-700 dark:text-zinc-300">
              <span>Tomorrow</span>
              <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                {tomorrow.length}
              </span>
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

        {later.length > 0 && (
          <section>
            <div className="flex items-center gap-2 pb-2 text-xs font-semibold tracking-wider uppercase text-zinc-500 dark:text-zinc-400">
              <span>Later this Week &amp; Beyond</span>
              <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                {later.length}
              </span>
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

        {!hasUpcoming && (
          <div className="py-16 text-center text-zinc-400 dark:text-zinc-500">
            <Calendar className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
              No upcoming tasks
            </p>
            <p className="text-xs mt-1 text-zinc-400">
              Enjoy your free schedule or plan ahead.
            </p>
          </div>
        )}
      </div>
    );
  }

  // --- View: COMPLETED ARCHIVE ---
  if (currentView === "completed") {
    return (
      <div className="space-y-4 pb-20">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-200/60 dark:border-zinc-800/60">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Completed Tasks ({completed.length})
          </h2>
        </div>

        {completed.length === 0 ? (
          <div className="py-16 text-center text-zinc-400 dark:text-zinc-500">
            <p className="text-xs italic">No completed tasks yet.</p>
          </div>
        ) : (
          <div>
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
      </div>
    );
  }

  // --- View: ALL TASKS (Full overview) ---
  return (
    <div className="space-y-6 pb-20">
      {/* 1. Overdue */}
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

      {/* 2. Today */}
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

      {/* 3. Tomorrow */}
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

      {/* 4. Upcoming / Later */}
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

      {/* 6. Completed Collapsible in All View */}
      {completed.length > 0 && (
        <section className="pt-4">
          <button
            type="button"
            onClick={() => setShowCompletedInAll(!showCompletedInAll)}
            className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition py-1"
          >
            {showCompletedInAll ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
            <span>Completed ({completed.length})</span>
          </button>

          {showCompletedInAll && (
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
