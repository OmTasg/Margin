"use client";

import React from "react";
import { Priority, TaskSource, SortOption } from "@/lib/types";
import { Filter, ArrowUpDown } from "lucide-react";

interface Props {
  priorityFilter: Priority | "all";
  onPriorityChange: (p: Priority | "all") => void;
  sourceFilter: TaskSource | "all";
  onSourceChange: (s: TaskSource | "all") => void;
  courseFilter: string | "all";
  onCourseChange: (c: string | "all") => void;
  availableCourses: string[];
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
}

export function FilterBar({
  priorityFilter,
  onPriorityChange,
  sourceFilter,
  onSourceChange,
  courseFilter,
  onCourseChange,
  availableCourses,
  sortBy,
  onSortChange,
}: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2.5 mb-4 text-xs">
      {/* Left: Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {/* Source Pills */}
        <div className="flex items-center bg-zinc-200/60 dark:bg-zinc-800/80 p-0.5 rounded-lg">
          <button
            onClick={() => onSourceChange("all")}
            className={`px-2.5 py-1 rounded-md font-medium transition ${
              sourceFilter === "all"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            All Sources
          </button>
          <button
            onClick={() => onSourceChange("canvas")}
            className={`px-2.5 py-1 rounded-md font-medium transition ${
              sourceFilter === "canvas"
                ? "bg-white dark:bg-zinc-900 text-rose-600 dark:text-rose-400 shadow-sm font-semibold"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            Canvas
          </button>
          <button
            onClick={() => onSourceChange("manual")}
            className={`px-2.5 py-1 rounded-md font-medium transition ${
              sourceFilter === "manual"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm font-semibold"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            Manual
          </button>
        </div>

        {/* Priority Filter */}
        <div className="flex items-center bg-zinc-200/60 dark:bg-zinc-800/80 p-0.5 rounded-lg">
          <button
            onClick={() => onPriorityChange("all")}
            className={`px-2 py-1 rounded-md font-medium transition ${
              priorityFilter === "all"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            All P
          </button>
          <button
            onClick={() => onPriorityChange("P1")}
            className={`px-2 py-1 rounded-md font-bold transition ${
              priorityFilter === "P1"
                ? "bg-rose-500 text-white shadow-sm"
                : "text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
            }`}
          >
            P1
          </button>
          <button
            onClick={() => onPriorityChange("P2")}
            className={`px-2 py-1 rounded-md font-bold transition ${
              priorityFilter === "P2"
                ? "bg-amber-500 text-white shadow-sm"
                : "text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30"
            }`}
          >
            P2
          </button>
          <button
            onClick={() => onPriorityChange("P3")}
            className={`px-2 py-1 rounded-md font-bold transition ${
              priorityFilter === "P3"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30"
            }`}
          >
            P3
          </button>
        </div>

        {/* Course Filter Dropdown if courses exist */}
        {availableCourses.length > 0 && (
          <select
            value={courseFilter}
            onChange={(e) => onCourseChange(e.target.value)}
            className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-700 dark:text-zinc-300 font-medium focus:outline-none"
          >
            <option value="all">All Courses</option>
            {availableCourses.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Right: Sort By Dropdown */}
      <div className="flex items-center gap-1.5 ml-auto">
        <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400" />
        <span className="text-zinc-500 dark:text-zinc-400 font-medium hidden sm:inline">
          Sort:
        </span>
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-700 dark:text-zinc-300 font-medium focus:outline-none"
        >
          <option value="dueDate">Due Date</option>
          <option value="priority">Priority</option>
          <option value="course">Course</option>
          <option value="title">Title</option>
        </select>
      </div>
    </div>
  );
}
