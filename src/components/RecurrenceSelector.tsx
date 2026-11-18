"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Repeat,
  ChevronDown,
  X,
  Check,
  Calendar as CalendarIcon,
} from "lucide-react";
import { RecurrenceRule, RecurrenceFrequency } from "@/lib/types";
import {
  getRecurrenceLabel,
  getNthWeekdayOfMonth,
  WEEKDAY_SHORT,
  WEEKDAY_LABELS,
  WEEKDAY_FULL,
} from "@/lib/recurrenceUtils";
import { format } from "date-fns";

interface Props {
  value: RecurrenceRule | null | undefined;
  onChange: (rule: RecurrenceRule | null) => void;
  referenceDate?: Date | string | null;
}

export function RecurrenceSelector({ value, onChange, referenceDate }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Parse reference date or fallback to today
  const safeDate = React.useMemo(() => {
    if (!referenceDate) return new Date();
    const d = typeof referenceDate === "string" ? new Date(referenceDate) : referenceDate;
    return isNaN(d.getTime()) ? new Date() : d;
  }, [referenceDate]);

  const dayOfWeek = safeDate.getDay(); // 0-6
  const dayName = WEEKDAY_FULL[dayOfWeek];
  const { ordinalStr } = getNthWeekdayOfMonth(safeDate);
  const monthDayStr = format(safeDate, "MMMM d");

  // Custom modal state
  const [customInterval, setCustomInterval] = useState<number>(
    value?.interval || 1
  );
  const [customUnit, setCustomUnit] = useState<"day" | "week" | "month" | "year">(
    value?.unit || "week"
  );
  const [customDaysOfWeek, setCustomDaysOfWeek] = useState<number[]>(
    value?.days_of_week && value.days_of_week.length > 0
      ? value.days_of_week
      : [dayOfWeek]
  );
  const [customEndsType, setCustomEndsType] = useState<
    "never" | "on_date" | "after_occurrences"
  >(value?.ends_type || "never");
  const [customEndsOnDate, setCustomEndsOnDate] = useState<string>(
    value?.ends_on_date || format(new Date(Date.now() + 90 * 86400000), "yyyy-MM-dd")
  );
  const [customEndsAfterCount, setCustomEndsAfterCount] = useState<number>(
    value?.ends_after_count || 10
  );

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const currentLabel = getRecurrenceLabel(value, safeDate);
  const isRepeating = value && value.frequency !== "none";

  const handleSelectPredefined = (freq: RecurrenceFrequency) => {
    if (freq === "none") {
      onChange(null);
    } else if (freq === "daily") {
      onChange({
        frequency: "daily",
        interval: 1,
        ends_type: "never",
      });
    } else if (freq === "weekdays") {
      onChange({
        frequency: "weekdays",
        interval: 1,
        days_of_week: [1, 2, 3, 4, 5],
        ends_type: "never",
      });
    } else if (freq === "weekly") {
      onChange({
        frequency: "weekly",
        interval: 1,
        days_of_week: [dayOfWeek],
        ends_type: "never",
      });
    } else if (freq === "monthly") {
      onChange({
        frequency: "monthly",
        interval: 1,
        ends_type: "never",
      });
    } else if (freq === "yearly") {
      onChange({
        frequency: "yearly",
        interval: 1,
        ends_type: "never",
      });
    }
    setIsOpen(false);
  };

  const handleOpenCustom = () => {
    setIsOpen(false);
    // Initialize custom state from current value if available
    setCustomInterval(value?.interval || 1);
    setCustomUnit(value?.unit || "week");
    setCustomDaysOfWeek(
      value?.days_of_week && value.days_of_week.length > 0
        ? value.days_of_week
        : [dayOfWeek]
    );
    setCustomEndsType(value?.ends_type || "never");
    setCustomEndsOnDate(
      value?.ends_on_date || format(new Date(Date.now() + 90 * 86400000), "yyyy-MM-dd")
    );
    setCustomEndsAfterCount(value?.ends_after_count || 10);
    setIsCustomOpen(true);
  };

  const handleSaveCustom = () => {
    const rule: RecurrenceRule = {
      frequency: "custom",
      interval: Math.max(1, customInterval || 1),
      unit: customUnit,
      days_of_week: customUnit === "week" ? customDaysOfWeek : undefined,
      ends_type: customEndsType,
      ends_on_date: customEndsType === "on_date" ? customEndsOnDate : null,
      ends_after_count:
        customEndsType === "after_occurrences"
          ? Math.max(1, customEndsAfterCount || 1)
          : null,
      occurrence_count: 1,
    };
    onChange(rule);
    setIsCustomOpen(false);
  };

  const toggleDayOfWeek = (dayIdx: number) => {
    setCustomDaysOfWeek((prev) => {
      if (prev.includes(dayIdx)) {
        if (prev.length === 1) return prev; // Keep at least one selected
        return prev.filter((d) => d !== dayIdx);
      } else {
        return [...prev, dayIdx].sort((a, b) => a - b);
      }
    });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition ${
            isRepeating
              ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-900/50 shadow-sm"
              : "bg-white dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 border-zinc-200/80 dark:border-zinc-700/80 hover:border-zinc-300 dark:hover:border-zinc-600"
          }`}
        >
          <Repeat className={`w-3.5 h-3.5 ${isRepeating ? "text-blue-600 dark:text-blue-400" : "text-zinc-400"}`} />
          <span>{currentLabel}</span>
          <ChevronDown className="w-3.5 h-3.5 text-zinc-400 opacity-70 ml-0.5" />
        </button>

        {isRepeating && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange(null);
            }}
            title="Remove recurrence"
            className="p-1 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Google Calendar Style Recurrence Dropdown */}
      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-72 bg-white dark:bg-[#1a1c24] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="text-[11px] font-semibold text-zinc-400 px-3.5 py-1 uppercase tracking-wider">
            Recurrence
          </div>

          <button
            type="button"
            onClick={() => handleSelectPredefined("none")}
            className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-zinc-100 dark:hover:bg-zinc-800 transition ${
              !isRepeating ? "font-semibold text-blue-600 dark:text-blue-400" : "text-zinc-700 dark:text-zinc-300"
            }`}
          >
            <span>Does not repeat</span>
            {!isRepeating && <Check className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={() => handleSelectPredefined("daily")}
            className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-zinc-100 dark:hover:bg-zinc-800 transition ${
              value?.frequency === "daily" ? "font-semibold text-blue-600 dark:text-blue-400" : "text-zinc-700 dark:text-zinc-300"
            }`}
          >
            <span>Daily</span>
            {value?.frequency === "daily" && <Check className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={() => handleSelectPredefined("weekly")}
            className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-zinc-100 dark:hover:bg-zinc-800 transition ${
              value?.frequency === "weekly" ? "font-semibold text-blue-600 dark:text-blue-400" : "text-zinc-700 dark:text-zinc-300"
            }`}
          >
            <span>Weekly on {dayName}</span>
            {value?.frequency === "weekly" && <Check className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={() => handleSelectPredefined("monthly")}
            className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-zinc-100 dark:hover:bg-zinc-800 transition ${
              value?.frequency === "monthly" ? "font-semibold text-blue-600 dark:text-blue-400" : "text-zinc-700 dark:text-zinc-300"
            }`}
          >
            <span>Monthly on the {ordinalStr} {dayName}</span>
            {value?.frequency === "monthly" && <Check className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={() => handleSelectPredefined("yearly")}
            className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-zinc-100 dark:hover:bg-zinc-800 transition ${
              value?.frequency === "yearly" ? "font-semibold text-blue-600 dark:text-blue-400" : "text-zinc-700 dark:text-zinc-300"
            }`}
          >
            <span>Annually on {monthDayStr}</span>
            {value?.frequency === "yearly" && <Check className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={() => handleSelectPredefined("weekdays")}
            className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-zinc-100 dark:hover:bg-zinc-800 transition ${
              value?.frequency === "weekdays" ? "font-semibold text-blue-600 dark:text-blue-400" : "text-zinc-700 dark:text-zinc-300"
            }`}
          >
            <span>Every weekday (Monday to Friday)</span>
            {value?.frequency === "weekdays" && <Check className="w-3.5 h-3.5" />}
          </button>

          <div className="border-t border-zinc-100 dark:border-zinc-800 my-1" />

          <button
            type="button"
            onClick={handleOpenCustom}
            className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-zinc-100 dark:hover:bg-zinc-800 transition ${
              value?.frequency === "custom" ? "font-semibold text-blue-600 dark:text-blue-400" : "text-zinc-700 dark:text-zinc-300"
            }`}
          >
            <span>Custom...</span>
            {value?.frequency === "custom" && <Check className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}

      {/* Google Calendar Style "Custom Recurrence" Modal */}
      {isCustomOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="w-full max-w-sm bg-white dark:bg-[#181a24] rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 text-foreground space-y-5 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Custom recurrence
            </h3>

            {/* Repeat Every Row */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-zinc-600 dark:text-zinc-400 font-medium whitespace-nowrap">
                Repeat every
              </span>
              <input
                type="number"
                min={1}
                max={99}
                value={customInterval}
                onChange={(e) => setCustomInterval(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 px-2.5 py-1.5 text-xs text-center bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <select
                value={customUnit}
                onChange={(e) => setCustomUnit(e.target.value as any)}
                className="flex-1 px-3 py-1.5 text-xs bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none cursor-pointer"
              >
                <option value="day">day{customInterval > 1 ? "s" : ""}</option>
                <option value="week">week{customInterval > 1 ? "s" : ""}</option>
                <option value="month">month{customInterval > 1 ? "s" : ""}</option>
                <option value="year">year{customInterval > 1 ? "s" : ""}</option>
              </select>
            </div>

            {/* Repeat On (Weekdays Pills) - Visible when unit is week */}
            {customUnit === "week" && (
              <div className="space-y-2">
                <span className="text-xs text-zinc-600 dark:text-zinc-400 font-medium block">
                  Repeat on
                </span>
                <div className="flex items-center justify-between gap-1">
                  {WEEKDAY_SHORT.map((initial, idx) => {
                    const isSelected = customDaysOfWeek.includes(idx);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => toggleDayOfWeek(idx)}
                        title={WEEKDAY_LABELS[idx]}
                        className={`w-8 h-8 rounded-full text-xs font-semibold flex items-center justify-center transition ${
                          isSelected
                            ? "bg-blue-600 text-white shadow-sm"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                        }`}
                      >
                        {initial}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Ends Section */}
            <div className="space-y-3">
              <span className="text-xs text-zinc-600 dark:text-zinc-400 font-medium block">
                Ends
              </span>

              {/* Option 1: Never */}
              <label className="flex items-center gap-3 cursor-pointer text-xs">
                <input
                  type="radio"
                  name="custom-ends"
                  checked={customEndsType === "never"}
                  onChange={() => setCustomEndsType("never")}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-zinc-800 dark:text-zinc-200">Never</span>
              </label>

              {/* Option 2: On Date */}
              <label className="flex items-center gap-3 cursor-pointer text-xs">
                <input
                  type="radio"
                  name="custom-ends"
                  checked={customEndsType === "on_date"}
                  onChange={() => setCustomEndsType("on_date")}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-zinc-800 dark:text-zinc-200 w-10">On</span>
                <input
                  type="date"
                  value={customEndsOnDate}
                  disabled={customEndsType !== "on_date"}
                  onChange={(e) => setCustomEndsOnDate(e.target.value)}
                  className={`flex-1 px-3 py-1.5 text-xs bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none ${
                    customEndsType !== "on_date" ? "opacity-50" : ""
                  }`}
                />
              </label>

              {/* Option 3: After X Occurrences */}
              <label className="flex items-center gap-3 cursor-pointer text-xs">
                <input
                  type="radio"
                  name="custom-ends"
                  checked={customEndsType === "after_occurrences"}
                  onChange={() => setCustomEndsType("after_occurrences")}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-zinc-800 dark:text-zinc-200 w-10">After</span>
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="number"
                    min={1}
                    max={999}
                    value={customEndsAfterCount}
                    disabled={customEndsType !== "after_occurrences"}
                    onChange={(e) =>
                      setCustomEndsAfterCount(Math.max(1, parseInt(e.target.value) || 1))
                    }
                    className={`w-16 px-2.5 py-1.5 text-xs text-center bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none ${
                      customEndsType !== "after_occurrences" ? "opacity-50" : ""
                    }`}
                  />
                  <span className="text-zinc-500 dark:text-zinc-400">occurrences</span>
                </div>
              </label>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setIsCustomOpen(false)}
                className="px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCustom}
                className="px-5 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition shadow-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
