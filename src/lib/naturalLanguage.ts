import { Priority } from "./types";
import { addDays, setHours, setMinutes, nextDay, Day } from "date-fns";

export interface ParsedTaskInput {
  cleanTitle: string;
  priority?: Priority;
  dueDate?: Date | null;
  courseName?: string;
}

const DAY_MAP: Record<string, Day> = {
  sunday: 0,
  sun: 0,
  monday: 1,
  mon: 1,
  tuesday: 2,
  tue: 2,
  wednesday: 3,
  wed: 3,
  thursday: 4,
  thu: 4,
  friday: 5,
  fri: 5,
  saturday: 6,
  sat: 6,
};

export function parseNaturalLanguageTask(input: string): ParsedTaskInput {
  let title = input.trim();
  let priority: Priority | undefined = undefined;
  let dueDate: Date | null = null;
  let courseName: string | undefined = undefined;

  // 1. Extract Course / Category: #course or [course] or course:course
  const hashtagMatch = title.match(/(?:^|\s)#([a-zA-Z0-9_\-]+)/);
  if (hashtagMatch) {
    courseName = hashtagMatch[1].toUpperCase();
    title = title.replace(hashtagMatch[0], " ").trim();
  } else {
    const bracketMatch = title.match(/\[([a-zA-Z0-9_\-\s]{2,12})\]/);
    if (bracketMatch) {
      courseName = bracketMatch[1].trim();
      title = title.replace(bracketMatch[0], " ").trim();
    }
  }

  // 2. Extract Priority: !p1, p1, high, !p2, p2, med, medium, !p3, p3, low
  const p1Match = title.match(/(?:^|\s)(?:!p1|\bp1\b|\bhigh\b)(?:$|\s)/i);
  if (p1Match) {
    priority = "P1";
    title = title.replace(p1Match[0], " ").trim();
  } else {
    const p2Match = title.match(/(?:^|\s)(?:!p2|\bp2\b|\bmed\b|\bmedium\b)(?:$|\s)/i);
    if (p2Match) {
      priority = "P2";
      title = title.replace(p2Match[0], " ").trim();
    } else {
      const p3Match = title.match(/(?:^|\s)(?:!p3|\bp3\b|\blow\b)(?:$|\s)/i);
      if (p3Match) {
        priority = "P3";
        title = title.replace(p3Match[0], " ").trim();
      }
    }
  }

  // 3. Extract Time (e.g. 5pm, 5:30pm, 17:00, 11:59pm, at 9am)
  let extractedHours = 23;
  let extractedMinutes = 59;
  let hasSpecificTime = false;

  const timeMatch = title.match(/(?:(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm))\b/i);
  if (timeMatch) {
    hasSpecificTime = true;
    let hour = parseInt(timeMatch[1], 10);
    const minute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const meridian = timeMatch[3].toLowerCase();

    if (meridian === "pm" && hour < 12) hour += 12;
    if (meridian === "am" && hour === 12) hour = 0;

    extractedHours = hour;
    extractedMinutes = minute;
    title = title.replace(timeMatch[0], " ").trim();
  } else {
    const militaryTimeMatch = title.match(/(?:^|\s)(?:at\s+)?([01]?\d|2[0-3]):([0-5]\d)(?:$|\s)/);
    if (militaryTimeMatch) {
      hasSpecificTime = true;
      extractedHours = parseInt(militaryTimeMatch[1], 10);
      extractedMinutes = parseInt(militaryTimeMatch[2], 10);
      title = title.replace(militaryTimeMatch[0], " ").trim();
    }
  }

  // 4. Extract Date: today, tomorrow, day of week
  const now = new Date();
  const todayMatch = title.match(/(?:^|\s)\b(today|tod)\b(?:$|\s)/i);
  if (todayMatch) {
    const base = new Date();
    dueDate = setMinutes(setHours(base, extractedHours), extractedMinutes);
    title = title.replace(todayMatch[0], " ").trim();
  }

  const tomorrowMatch = title.match(/(?:^|\s)\b(tomorrow|tmrw|tom)\b(?:$|\s)/i);
  if (tomorrowMatch) {
    const base = addDays(new Date(), 1);
    dueDate = setMinutes(setHours(base, extractedHours), extractedMinutes);
    title = title.replace(tomorrowMatch[0], " ").trim();
  }

  // Check day of week
  for (const [dayName, dayIndex] of Object.entries(DAY_MAP)) {
    const dayRegex = new RegExp(`(?:^|\\s)\\b(on\\s+)?(${dayName})\\b(?:$|\\s)`, "i");
    const dayMatch = title.match(dayRegex);
    if (dayMatch) {
      const base = nextDay(now, dayIndex);
      dueDate = setMinutes(setHours(base, extractedHours), extractedMinutes);
      title = title.replace(dayMatch[0], " ").trim();
      break;
    }
  }

  // If time was specified but no day was matched, assume today (or tomorrow if time passed)
  if (hasSpecificTime && !dueDate) {
    const candidate = setMinutes(setHours(new Date(), extractedHours), extractedMinutes);
    if (candidate < now) {
      dueDate = addDays(candidate, 1);
    } else {
      dueDate = candidate;
    }
  }

  // Clean extra spaces
  title = title.replace(/\s+/g, " ").trim();

  return {
    cleanTitle: title || input.trim(),
    priority,
    dueDate,
    courseName,
  };
}
