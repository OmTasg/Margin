"use client";

import React from "react";
import { Priority, TaskSource, SortOption } from "@/lib/types";
import { ArrowUpDown } from "lucide-react";

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
    <div className="flex flex-wrap items-center justify-between gap-2 mb-4 text-xs">
      {/* Left: Minimal text filters */}
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
        {/* Source Segmented Text */}
        <div className="flex items-center gap-1 text-xs">
          <button
            onClick={() => onSourceChange("all")}
            className={`px-2 py-0.5 rounded-md transition ${
              sourceFilter === "all"
                ? "bg-zinc-200/80 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium"
                : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            All
          </button>
          <button
            onClick={() => onSourceChange("canvas")}
            className={`px-2 py-0.5 rounded-md transition ${
              sourceFilter === "canvas"
                ? "bg-zinc-200/80 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium"
                : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            Canvas
          </button>
          <button
            onClick={() => onSourceChange("manual")}
            className={`px-2 py-0.5 rounded-md transition ${
              sourceFilter === "manual"
                ? "bg-zinc-200/80 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium"
                : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            Manual
          </button>
        </div>

        <span className="text-zinc-300 dark:text-zinc-700 mx-1">·</span>

        {/* Priority Filter */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPriorityChange("all")}
            className={`px-1.5 py-0.5 rounded-md transition ${
              priorityFilter === "all"
                ? "bg-zinc-200/80 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium"
                : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            All P
          </button>
          {(["P1", "P2", "P3"] as Priority[]).map((p) => {
            const isSelected = priorityFilter === p;
            const dot =
              p === "P1"
                ? "bg-rose-500"
                : p === "P2"
                ? "bg-amber-500"
                : "bg-zinc-400";
            return (
              <button
                key={p}
                onClick={() => onPriorityChange(p)}
                className={`px-1.5 py-0.5 rounded-md inline-flex items-center gap-1 transition ${
                  isSelected
                    ? "bg-zinc-200/80 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold"
                    : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${dot}`}></span>
                <span>{p}</span>
              </button>
            );
          })}
        </div>

        {/* Course Filter Dropdown if courses exist */}
        {availableCourses.length > 0 && (
          <>
            <span className="text-zinc-300 dark:text-zinc-700 mx-1">·</span>
            <select
              value={courseFilter}
              onChange={(e) => onCourseChange(e.target.value)}
              className="px-1.5 py-0.5 bg-transparent border-none text-zinc-500 dark:text-zinc-400 font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">Courses</option>
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
      <div className="flex items-center gap-1 text-zinc-400 ml-auto">
        <ArrowUpDown className="w-3 h-3 opacity-60" />
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          className="bg-transparent border-none text-zinc-500 dark:text-zinc-400 text-xs font-medium focus:outline-none cursor-pointer"
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
