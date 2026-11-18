import { Task, RecurrenceRule, RecurrenceFrequency } from "./types";
import { addDays, addWeeks, addMonths, addYears, format } from "date-fns";

export const WEEKDAY_SHORT = ["S", "M", "T", "W", "T", "F", "S"];
export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const WEEKDAY_FULL = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const ORDINALS = ["first", "second", "third", "fourth", "fifth"];

/**
 * Calculates which nth weekday of the month a date falls on (e.g. 3rd Tuesday)
 */
export function getNthWeekdayOfMonth(date: Date): {
  nth: number;
  dayName: string;
  ordinalStr: string;
} {
  const dayOfMonth = date.getDate();
  const nth = Math.ceil(dayOfMonth / 7);
  const dayName = WEEKDAY_FULL[date.getDay()];
  const ordinalStr = ORDINALS[nth - 1] || `${nth}th`;
  return { nth, dayName, ordinalStr };
}

/**
 * Returns a human-friendly label for a recurrence rule, mirroring Google Calendar.
 * e.g. "Weekly on Tuesday", "Monthly on the third Tuesday", "Daily", etc.
 */
export function getRecurrenceLabel(
  rule: RecurrenceRule | null | undefined,
  referenceDate?: Date | string | null
): string {
  if (!rule || rule.frequency === "none") {
    return "Does not repeat";
  }

  const ref = referenceDate
    ? typeof referenceDate === "string"
      ? new Date(referenceDate)
      : referenceDate
    : new Date();

  const safeRef = isNaN(ref.getTime()) ? new Date() : ref;

  switch (rule.frequency) {
    case "daily": {
      const interval = rule.interval || 1;
      return interval === 1 ? "Daily" : `Every ${interval} days`;
    }

    case "weekdays":
      return "Every weekday (Monday to Friday)";

    case "weekly": {
      const interval = rule.interval || 1;
      if (rule.days_of_week && rule.days_of_week.length > 0) {
        if (rule.days_of_week.length === 7) return "Daily";
        if (
          rule.days_of_week.length === 5 &&
          [1, 2, 3, 4, 5].every((d) => rule.days_of_week!.includes(d))
        ) {
          return "Every weekday (Monday to Friday)";
        }
        const names = rule.days_of_week
          .map((d) => WEEKDAY_LABELS[d])
          .join(", ");
        return interval === 1
          ? `Weekly on ${names}`
          : `Every ${interval} weeks on ${names}`;
      }
      const dayName = WEEKDAY_FULL[safeRef.getDay()];
      return interval === 1
        ? `Weekly on ${dayName}`
        : `Every ${interval} weeks on ${dayName}`;
    }

    case "monthly": {
      const interval = rule.interval || 1;
      const { ordinalStr, dayName } = getNthWeekdayOfMonth(safeRef);
      const suffix = `on the ${ordinalStr} ${dayName}`;
      return interval === 1
        ? `Monthly ${suffix}`
        : `Every ${interval} months ${suffix}`;
    }

    case "yearly": {
      const monthDay = format(safeRef, "MMMM d");
      const interval = rule.interval || 1;
      return interval === 1
        ? `Annually on ${monthDay}`
        : `Every ${interval} years on ${monthDay}`;
    }

    case "custom": {
      const interval = rule.interval || 1;
      const unit = rule.unit || "week";
      let base = "";
      if (unit === "day") {
        base = interval === 1 ? "Daily" : `Every ${interval} days`;
      } else if (unit === "week") {
        const days =
          rule.days_of_week && rule.days_of_week.length > 0
            ? rule.days_of_week.map((d) => WEEKDAY_LABELS[d]).join(", ")
            : WEEKDAY_FULL[safeRef.getDay()];
        base =
          interval === 1
            ? `Weekly on ${days}`
            : `Every ${interval} weeks on ${days}`;
      } else if (unit === "month") {
        base = interval === 1 ? "Monthly" : `Every ${interval} months`;
      } else {
        base = interval === 1 ? "Annually" : `Every ${interval} years`;
      }

      if (rule.ends_type === "after_occurrences" && rule.ends_after_count) {
        return `${base} (${rule.ends_after_count} times)`;
      } else if (rule.ends_type === "on_date" && rule.ends_on_date) {
        return `${base} (until ${rule.ends_on_date})`;
      }
      return base;
    }

    default:
      return "Does not repeat";
  }
}

/**
 * Calculates the next occurrence Date for a given recurrence rule.
 * Returns null if the recurrence has ended.
 */
export function getNextOccurrenceDate(
  currentDueDate: Date | string,
  rule: RecurrenceRule
): Date | null {
  if (!rule || rule.frequency === "none") return null;

  const base =
    typeof currentDueDate === "string"
      ? new Date(currentDueDate)
      : new Date(currentDueDate.getTime());

  if (isNaN(base.getTime())) return null;

  // Check occurrences limit
  const currentCount = rule.occurrence_count || 1;
  if (
    rule.ends_type === "after_occurrences" &&
    rule.ends_after_count &&
    currentCount >= rule.ends_after_count
  ) {
    return null;
  }

  let next: Date;

  switch (rule.frequency) {
    case "daily": {
      next = addDays(base, rule.interval || 1);
      break;
    }

    case "weekdays": {
      let candidate = addDays(base, 1);
      while (candidate.getDay() === 0 || candidate.getDay() === 6) {
        candidate = addDays(candidate, 1);
      }
      next = candidate;
      break;
    }

    case "weekly": {
      const interval = rule.interval || 1;
      const days =
        rule.days_of_week && rule.days_of_week.length > 0
          ? [...rule.days_of_week].sort((a, b) => a - b)
          : [base.getDay()];

      const currentDay = base.getDay();
      const nextDaySameWeek = days.find((d) => d > currentDay);

      if (nextDaySameWeek !== undefined) {
        next = addDays(base, nextDaySameWeek - currentDay);
      } else {
        const firstDayNextCycle = days[0];
        const daysToNextWeek = 7 - currentDay + firstDayNextCycle;
        const extraWeeks = Math.max(0, interval - 1);
        next = addDays(base, daysToNextWeek + extraWeeks * 7);
      }
      break;
    }

    case "monthly": {
      next = addMonths(base, rule.interval || 1);
      break;
    }

    case "yearly": {
      next = addYears(base, rule.interval || 1);
      break;
    }

    case "custom": {
      const interval = rule.interval || 1;
      const unit = rule.unit || "week";

      if (unit === "day") {
        next = addDays(base, interval);
      } else if (unit === "week") {
        const days =
          rule.days_of_week && rule.days_of_week.length > 0
            ? [...rule.days_of_week].sort((a, b) => a - b)
            : [base.getDay()];

        const currentDay = base.getDay();
        const nextDaySameWeek = days.find((d) => d > currentDay);

        if (nextDaySameWeek !== undefined) {
          next = addDays(base, nextDaySameWeek - currentDay);
        } else {
          const firstDayNextCycle = days[0];
          const daysToNextWeek = 7 - currentDay + firstDayNextCycle;
          const extraWeeks = Math.max(0, interval - 1);
          next = addDays(base, daysToNextWeek + extraWeeks * 7);
        }
      } else if (unit === "month") {
        next = addMonths(base, interval);
      } else {
        next = addYears(base, interval);
      }
      break;
    }

    default:
      return null;
  }

  // Check end-date limit
  if (rule.ends_type === "on_date" && rule.ends_on_date) {
    const [y, m, d] = rule.ends_on_date.split("-").map(Number);
    const endBoundary = new Date(y, m - 1, d, 23, 59, 59, 999);
    if (next.getTime() > endBoundary.getTime()) {
      return null;
    }
  }

  return next;
}

/**
 * When a recurring task is completed, creates the subsequent occurrence.
 */
export function calculateNextTaskOccurrence(completedTask: Task): Task | null {
  if (!completedTask.recurrence || completedTask.recurrence.frequency === "none") {
    return null;
  }

  const referenceDate = completedTask.due_date || completedTask.completed_at || new Date();
  const nextDate = getNextOccurrenceDate(referenceDate, completedTask.recurrence);

  if (!nextDate) return null;

  const currentCount = completedTask.recurrence.occurrence_count || 1;
  const nextOccurrenceRule: RecurrenceRule = {
    ...completedTask.recurrence,
    occurrence_count: currentCount + 1,
  };

  const nextTask: Task = {
    ...completedTask,
    id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    due_date: nextDate.toISOString(),
    is_completed: false,
    completed_at: null,
    recurrence: nextOccurrenceRule,
    recurring_parent_id:
      completedTask.recurring_parent_id || completedTask.id,
    google_event_id: null,
    google_calendar_id: null,
    is_pushed_to_google: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return nextTask;
}
