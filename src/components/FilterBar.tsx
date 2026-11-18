"use client";

import React, { useState, useRef, useEffect } from "react";
import { Priority, TaskSource, SortOption, TaskCategory } from "@/lib/types";
import { CATEGORY_CONFIG } from "@/lib/canvasUtils";
import {
  ArrowUpDown,
  BookOpen,
  Check,
  ChevronDown,
  Search,
  SlidersHorizontal,
  VideoOff,
  Video,
  X,
} from "lucide-react";

interface Props {
  selectedPriorities: Priority[];
  onTogglePriority: (p: Priority) => void;
  onClearPriorities: () => void;
  sourceFilter: TaskSource | "all";
  onSourceChange: (s: TaskSource | "all") => void;
  selectedCourses: string[];
  onToggleCourse: (c: string) => void;
  onClearCourses: () => void;
  onSelectAllCourses: (courses: string[]) => void;
  availableCourses: string[];
  selectedCategory: TaskCategory | "all";
  onSelectCategory: (cat: TaskCategory | "all") => void;
  hideVirtualClasses: boolean;
  onToggleHideVirtualClasses: () => void;
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
  selectedCourses,
  onToggleCourse,
  onClearCourses,
  onSelectAllCourses,
  availableCourses,
  selectedCategory,
  onSelectCategory,
  hideVirtualClasses,
  onToggleHideVirtualClasses,
  sortBy,
  onSortChange,
  showSort = true,
}: Props) {
  const isAllPrioritiesSelected = selectedPriorities.length === 0;
  const [isCourseDropdownOpen, setIsCourseDropdownOpen] = useState(false);
  const [courseSearch, setCourseSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsCourseDropdownOpen(false);
      }
    };
    if (isCourseDropdownOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isCourseDropdownOpen]);

  const filteredCourses = availableCourses.filter((c) =>
    c.toLowerCase().includes(courseSearch.toLowerCase().trim())
  );

  const categories: { id: TaskCategory | "all"; label: string; icon: string }[] = [
    { id: "all", label: "All Types", icon: "✨" },
    { id: "course", label: "Classes", icon: "📚" },
    { id: "gym", label: "Gym", icon: "🏋️" },
    { id: "shopping", label: "Shopping", icon: "🛒" },
    { id: "laundry", label: "Laundry", icon: "🧺" },
    { id: "cooking", label: "Cooking", icon: "🍳" },
    { id: "personal", label: "Personal", icon: "💡" },
  ];

  return (
    <div className="space-y-2.5 mb-5 pb-3 border-b border-zinc-200/70 dark:border-zinc-800/70 text-xs">
      {/* Top Filter Controls Row */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5 py-0.5">
          {/* Multi-Select Course Dropdown UI */}
          {availableCourses.length > 0 && (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsCourseDropdownOpen(!isCourseDropdownOpen)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition ${
                  selectedCourses.length > 0
                    ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900/60 font-semibold shadow-sm"
                    : "bg-zinc-100/70 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 border-zinc-200/70 dark:border-zinc-700/60 hover:border-zinc-300 dark:hover:border-zinc-600"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 opacity-70" />
                <span>
                  {selectedCourses.length === 0
                    ? "All Classes"
                    : selectedCourses.length === 1
                    ? selectedCourses[0]
                    : `Classes (${selectedCourses.length})`}
                </span>
                <ChevronDown className={`w-3 h-3 transition-transform ${isCourseDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Course Multi-Select Popover Menu */}
              {isCourseDropdownOpen && (
                <div className="absolute left-0 top-full mt-1.5 w-64 bg-white dark:bg-[#181922] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl z-40 p-2 space-y-2 animate-in fade-in zoom-in-95 duration-100">
                  {/* Search inside courses */}
                  {availableCourses.length > 4 && (
                    <div className="relative">
                      <Search className="w-3 h-3 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={courseSearch}
                        onChange={(e) => setCourseSearch(e.target.value)}
                        placeholder="Filter classes..."
                        className="w-full pl-7 pr-2 py-1 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none"
                      />
                    </div>
                  )}

                  {/* Header Actions */}
                  <div className="flex items-center justify-between px-1 text-[11px] text-zinc-400">
                    <button
                      type="button"
                      onClick={() => onSelectAllCourses(availableCourses)}
                      className="hover:text-blue-600 dark:hover:text-blue-400 transition"
                    >
                      Select all
                    </button>
                    <button
                      type="button"
                      onClick={onClearCourses}
                      className="hover:text-rose-600 dark:hover:text-rose-400 transition"
                    >
                      Clear
                    </button>
                  </div>

                  {/* Scrollable List with Checkboxes */}
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {filteredCourses.map((c) => {
                      const isSelected = selectedCourses.includes(c);
                      return (
                        <div
                          key={c}
                          onClick={() => onToggleCourse(c)}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition ${
                            isSelected
                              ? "bg-blue-50/70 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-medium"
                              : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                          }`}
                        >
                          <span className="truncate pr-2">{c}</span>
                          <span
                            className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                              isSelected
                                ? "bg-blue-600 border-blue-600 text-white"
                                : "border-zinc-300 dark:border-zinc-700"
                            }`}
                          >
                            {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </span>
                        </div>
                      );
                    })}

                    {filteredCourses.length === 0 && (
                      <p className="text-[11px] text-zinc-400 italic text-center py-2">
                        No matching classes found
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Virtual Class / Zoom Meetings Filter Toggle */}
          <button
            type="button"
            onClick={onToggleHideVirtualClasses}
            title={
              hideVirtualClasses
                ? "Virtual lecture/Zoom meetings are hidden from your to-do list (click to show)"
                : "Virtual lecture/Zoom meetings are currently shown (click to hide)"
            }
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition ${
              hideVirtualClasses
                ? "bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border-amber-200/80 dark:border-amber-900/40"
                : "bg-zinc-100/70 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 border-zinc-200/70 dark:border-zinc-700/60"
            }`}
          >
            {hideVirtualClasses ? (
              <>
                <VideoOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Lectures Hidden</span>
              </>
            ) : (
              <>
                <Video className="w-3.5 h-3.5 opacity-60" />
                <span>Show Lectures</span>
              </>
            )}
          </button>

          <span className="text-zinc-300 dark:text-zinc-700">|</span>

          {/* Priority Multi-Select Filter */}
          <div className="flex items-center gap-1 bg-zinc-100/70 dark:bg-zinc-800/60 p-0.5 rounded-xl border border-zinc-200/70 dark:border-zinc-700/60 shrink-0">
            <button
              type="button"
              onClick={onClearPriorities}
              title="Show all priorities"
              className={`px-2 py-1 rounded-lg font-medium transition ${
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
                  title={`Toggle ${p} priority filter`}
                  className={`px-2 py-1 rounded-lg inline-flex items-center gap-1.5 font-medium transition ${
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
        </div>

        {/* Right: Sort By Dropdown */}
        {showSort && (
          <div className="flex items-center gap-1.5 text-zinc-400 ml-auto shrink-0 py-0.5">
            <ArrowUpDown className="w-3.5 h-3.5 opacity-60" />
            <span className="text-zinc-400 text-xs hidden sm:inline">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              className="bg-zinc-100/70 dark:bg-zinc-800/60 border border-zinc-200/70 dark:border-zinc-700/60 rounded-lg px-2.5 py-1 text-zinc-800 dark:text-zinc-200 text-xs font-medium focus:outline-none cursor-pointer"
            >
              <option value="dueDate">Due Date</option>
              <option value="priority">Priority</option>
              <option value="course">Course</option>
              <option value="title">Title</option>
            </select>
          </div>
        )}
      </div>

      {/* Bottom Category Filter Chips: Academic vs Gym, Shopping, Laundry, Cooking, Personal */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
        <span className="text-[11px] font-medium text-zinc-400 shrink-0 mr-1 hidden sm:inline">
          Filter by:
        </span>
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className={`px-2.5 py-1 rounded-lg font-medium text-xs flex items-center gap-1.5 transition shrink-0 ${
                isSelected
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold shadow-sm"
                  : "bg-zinc-100/60 dark:bg-zinc-800/40 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
