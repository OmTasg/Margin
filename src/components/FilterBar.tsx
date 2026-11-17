"use client";

import React from "react";
import { Priority, TaskSource, SortOption } from "@/lib/types";
import { ArrowUpDown } from "lucide-react";

interface Props {
  selectedPriorities: Priority[];
  onTogglePriority: (p: Priority) => void;
  onClearPriorities: () => void;
  sourceFilter: TaskSource | "all";
  onSourceChange: (s: TaskSource | "all") => void;
  courseFilter: string | "all";
  onCourseChange: (c: string | "all") => void;
  availableCourses: string[];
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  showSort?: boolean;
}

export function FilterBar({
  selectedPriorities,
  onTogglePriority,
  onClearPriorities,
  sourceFilter,
  onSourceChange,
  courseFilter,
  onCourseChange,
  availableCourses,
  sortBy,
  onSortChange,
  showSort = true,
}: Props) {
  const isAllPrioritiesSelected = selectedPriorities.length === 0;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2.5 mb-4 pb-2 text-xs">
      {/* Left: Filters */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
        {/* Multi-Select Priority Filter */}
        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800/80 p-0.5 rounded-lg border border-zinc-200/60 dark:border-zinc-700/60 shrink-0">
          <button
            type="button"
            onClick={onClearPriorities}
            title="Show all priorities"
            className={`px-2 py-1 rounded-md font-medium transition ${
              isAllPrioritiesSelected
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            All P
          </button>

          {(["P1", "P2", "P3"] as Priority[]).map((p) => {
            const isSelected = selectedPriorities.includes(p);
            const dot =
              p === "P1"
                ? "bg-rose-500"
                : p === "P2"
                ? "bg-amber-500"
                : "bg-zinc-400";

            return (
              <button
                key={p}
                type="button"
                onClick={() => onTogglePriority(p)}
                title={`Toggle ${p} priority filter (multi-select)`}
                className={`px-2 py-1 rounded-md inline-flex items-center gap-1.5 font-medium transition ${
                  isSelected
                    ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-semibold shadow-sm ring-1 ring-zinc-300 dark:ring-zinc-700"
                    : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${dot}`}></span>
                <span>{p}</span>
              </button>
            );
          })}
        </div>

        <span className="text-zinc-300 dark:text-zinc-700">|</span>

        {/* Source Filter */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onSourceChange("all")}
            className={`px-2 py-1 rounded-md transition ${
              sourceFilter === "all"
                ? "bg-zinc-200/80 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            All Sources
          </button>
          <button
            onClick={() => onSourceChange("canvas")}
            className={`px-2 py-1 rounded-md transition ${
              sourceFilter === "canvas"
                ? "bg-zinc-200/80 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            Canvas
          </button>
          <button
            onClick={() => onSourceChange("manual")}
            className={`px-2 py-1 rounded-md transition ${
              sourceFilter === "manual"
                ? "bg-zinc-200/80 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            Manual
          </button>
        </div>

        {/* Course Filter Dropdown */}
        {availableCourses.length > 0 && (
          <>
            <span className="text-zinc-300 dark:text-zinc-700">|</span>
            <select
              value={courseFilter}
              onChange={(e) => onCourseChange(e.target.value)}
              className="px-2 py-1 bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-md text-zinc-700 dark:text-zinc-300 font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">All Courses</option>
              {availableCourses.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </>
        )}
      </div>

      {/* Right: Sort By Dropdown */}
      {showSort && (
        <div className="flex items-center gap-1.5 text-zinc-400 ml-auto shrink-0">
          <ArrowUpDown className="w-3.5 h-3.5 opacity-60" />
          <span className="text-zinc-400 text-xs hidden sm:inline">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-md px-2 py-0.5 text-zinc-700 dark:text-zinc-300 text-xs font-medium focus:outline-none cursor-pointer"
          >
            <option value="dueDate">Due Date</option>
            <option value="priority">Priority</option>
            <option value="course">Course</option>
            <option value="title">Title</option>
          </select>
        </div>
      )}
    </div>
  );
}
