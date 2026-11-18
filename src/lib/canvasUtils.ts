import { Priority, TaskCategory } from "./types";

export const CATEGORY_CONFIG: Record<
  TaskCategory,
  { label: string; icon: string; color: string; badgeClass: string }
> = {
  course: {
    label: "Course",
    icon: "📚",
    color: "#3b82f6",
    badgeClass: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200/60 dark:border-blue-900/40",
  },
  gym: {
    label: "Gym & Fitness",
    icon: "🏋️",
    color: "#f97316",
    badgeClass: "bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border-orange-200/60 dark:border-orange-900/40",
  },
  shopping: {
    label: "Shopping",
    icon: "🛒",
    color: "#10b981",
    badgeClass: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-900/40",
  },
  laundry: {
    label: "Laundry & Chores",
    icon: "🧺",
    color: "#8b5cf6",
    badgeClass: "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200/60 dark:border-purple-900/40",
  },
  cooking: {
    label: "Cooking & Food",
    icon: "🍳",
    color: "#ec4899",
    badgeClass: "bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 border-pink-200/60 dark:border-pink-900/40",
  },
  personal: {
    label: "Personal",
    icon: "💡",
    color: "#64748b",
    badgeClass: "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700",
  },
};

/**
 * Automatically infers task category based on title, course name, or notes
 */
export function inferTaskCategory(title: string, courseName?: string | null): TaskCategory {
  if (courseName && courseName.trim()) return "course";
  const lower = title.toLowerCase();

  if (/\b(gym|workout|lift|lifting|cardio|run|running|legs?|chest|fitness|push|pull|squat|bench)\b/.test(lower)) {
    return "gym";
  }
  if (/\b(shop|shopping|groceries|grocery|buy|target|costco|trader joe|walmart|store|market|order)\b/.test(lower)) {
    return "shopping";
  }
  if (/\b(laundry|wash clothes|clean|cleaning|vacuum|dishes|trash|chores?|mop)\b/.test(lower)) {
    return "laundry";
  }
  if (/\b(cook|cooking|meal prep|dinner|lunch|breakfast|food|bake|baking|recipe|eat|groceries)\b/.test(lower)) {
    return "cooking";
  }
  return "personal";
}

/**
 * Detects whether a Canvas calendar event is actually a virtual lecture / Zoom meeting
 * rather than an assignment or to-do.
 */
export function isLectureOrMeeting(task: {
  title?: string;
  notes?: string;
  course_name?: string | null;
  canvas_uid?: string | null;
  external_url?: string | null;
}): boolean {
  const notes = (task.notes || "").toLowerCase();
  const title = (task.title || "").toLowerCase();
  const course = (task.course_name || "").toLowerCase();
  const uid = (task.canvas_uid || "").toLowerCase();
  const url = (task.external_url || "").toLowerCase();

  // 1. Explicit Zoom, Teams, Webex, Google Meet links
  if (
    notes.includes("zoom.us") ||
    notes.includes("join zoom meeting") ||
    notes.includes("zoom online meeting") ||
    notes.includes("teams.microsoft.com") ||
    notes.includes("webex.com") ||
    notes.includes("meet.google.com")
  ) {
    return true;
  }

  // 2. Canvas Calendar Event rather than assignment/quiz
  if (uid.includes("event-calendar-event") || url.includes("#calendar_event_")) {
    return true;
  }

  // 3. Keywords indicating lecture / recurring class meeting
  const lectureKeywords = [
    /\blecture\b/i,
    /\bvirtual\s+(fa|sp|su|fall|spring|summer)\b/i,
    /\bclass\s+meeting\b/i,
    /\boffice\s+hours\b/i,
    /\brecitation\b/i,
    /\bdiscussion\s+section\b/i,
  ];

  const assignmentKeywords = [
    /\bhomework\b/i,
    /\bhw\b/i,
    /\bquiz\b/i,
    /\bexam\b/i,
    /\bmidterm\b/i,
    /\bfinal\b/i,
    /\bpset\b/i,
    /\bproblem set\b/i,
    /\bassignment\b/i,
    /\bproject\b/i,
    /\bessay\b/i,
    /\blab\b/i,
    /\bpaper\b/i,
    /\breading\b/i,
    /\bdue\b/i,
    /\bsubmit\b/i,
  ];

  const hasAssignmentKeyword = assignmentKeywords.some((p) => p.test(title));
  if (!hasAssignmentKeyword) {
    if (lectureKeywords.some((p) => p.test(title) || p.test(course) || p.test(notes))) {
      return true;
    }
  }

  return false;
}

export function parseCanvasSummary(summary: string): { title: string; courseName: string | null } {
  let title = (summary || "").trim();
  let courseName: string | null = null;

  // Canvas usually formats assignment summaries as "Assignment Title [Course Name]"
  const bracketMatch = title.match(/^(.*?)\s*\[(.*?)\]$/);
  if (bracketMatch) {
    title = bracketMatch[1].trim();
    courseName = bracketMatch[2].trim();
  } else {
    // Check if course name is at the beginning, e.g. "[CS101] Homework 1"
    const prefixMatch = title.match(/^\[(.*?)\]\s*(.*)$/);
    if (prefixMatch) {
      courseName = prefixMatch[1].trim();
      title = prefixMatch[2].trim();
    }
  }

  return { title, courseName };
}

export function cleanDescription(rawDesc: string): string {
  if (!rawDesc) return "";
  // Strip HTML tags if present
  let text = rawDesc.replace(/<[^>]*>/g, " ");
  // Unescape common ical sequences
  text = text.replace(/\\n/g, "\n").replace(/\\,/g, ",").replace(/\\;/g, ";").replace(/\\\\/g, "\\");
  // Remove excessive whitespace
  return text.trim();
}

export function extractCanvasUrl(description: string, eventUrl?: string, uid?: string): string | null {
  // 1. Search description for direct assignment/quiz/discussion links
  if (description) {
    const directMatch = description.match(
      /(https?:\/\/[^\s<>"'\\]+\/courses\/\d+\/(?:assignments|quizzes|discussion_topics|calendar_events)\/\d+)/i
    );
    if (directMatch) {
      return directMatch[1];
    }
  }

  // 2. Process eventUrl if available
  if (eventUrl && eventUrl.startsWith("http")) {
    const trimmed = eventUrl.trim();

    // Already a direct link
    if (/\/courses\/\d+\/(?:assignments|quizzes|discussion_topics|calendar_events)\/\d+/i.test(trimmed)) {
      return trimmed;
    }

    // Transform Canvas Calendar URLs: https://<domain>/calendar?include_contexts=course_12345#assignment_67890
    try {
      const parsedUrl = new URL(trimmed);
      const domain = `${parsedUrl.protocol}//${parsedUrl.host}`;
      const search = parsedUrl.search;
      const hash = parsedUrl.hash;

      // Extract course ID
      const courseMatch =
        search.match(/(?:include_contexts=course_|courses?_id=|courses?\/)(\d+)/i) ||
        (description ? description.match(/\/courses\/(\d+)/i) : null);
      const courseId = courseMatch ? courseMatch[1] : null;

      // Extract assignment/quiz/event ID from hash or UID
      const hashAssignmentMatch = hash.match(/#(?:assignment_|event_assignment_)?(\d+)/i);
      const hashQuizMatch = hash.match(/#quiz_(\d+)/i);
      const hashEventMatch = hash.match(/#calendar_event_(\d+)/i);
      const uidAssignmentMatch = uid ? uid.match(/event-assignment-(\d+)/i) : null;
      const uidQuizMatch = uid ? uid.match(/event-quiz-(\d+)/i) : null;

      const assignmentId = hashAssignmentMatch
        ? hashAssignmentMatch[1]
        : uidAssignmentMatch
        ? uidAssignmentMatch[1]
        : null;

      if (courseId && assignmentId) {
        return `${domain}/courses/${courseId}/assignments/${assignmentId}`;
      }
      if (courseId && (hashQuizMatch || uidQuizMatch)) {
        const quizId = hashQuizMatch ? hashQuizMatch[1] : uidQuizMatch![1];
        return `${domain}/courses/${courseId}/quizzes/${quizId}`;
      }
      if (courseId && hashEventMatch) {
        return `${domain}/courses/${courseId}/calendar_events/${hashEventMatch[1]}`;
      }
    } catch {
      // Ignore URL parsing errors
    }

    return trimmed;
  }

  // 3. Fallback: check description for any course link
  if (description) {
    const generalCourseMatch = description.match(/(https?:\/\/[^\s<>"'\\]+\/courses\/\d+[^\s<>"'\\]*)/i);
    if (generalCourseMatch) return generalCourseMatch[1];
  }

  return null;
}

/**
 * Resolves a direct Canvas assignment URL from any URL (including calendar links), description, or UID.
 */
export function resolveDirectCanvasUrl(
  url?: string | null,
  description?: string,
  uid?: string | null
): string | null {
  if (!url && !description && !uid) return null;
  return extractCanvasUrl(description || "", url || undefined, uid || undefined);
}

/**
 * Automatically calculates task priority based on Canvas due date:
 * - Due within 24 hours (or overdue < 48 hours): P1 (High/Urgent)
 * - Due within 1 to 4 days (up to 96 hours): P2 (Medium)
 * - Due > 4 days: P3 (Low)
 */
export function calculateCanvasPriority(dueDateStr: string | null | undefined): Priority {
  if (!dueDateStr) return "P3";
  const dueDate = new Date(dueDateStr);
  if (isNaN(dueDate.getTime())) return "P3";

  const diffHours = (dueDate.getTime() - Date.now()) / (1000 * 60 * 60);

  if (diffHours <= 24) {
    return "P1";
  }
  if (diffHours <= 96) {
    return "P2";
  }
  return "P3";
}

/**
 * Checks if a task is overdue by more than 2 days (48 hours)
 */
export function isMoreThanTwoDaysOverdue(dueDateStr: string | null | undefined): boolean {
  if (!dueDateStr) return false;
  const dueDate = new Date(dueDateStr);
  if (isNaN(dueDate.getTime())) return false;
  const twoDaysMs = 48 * 60 * 60 * 1000;
  return Date.now() - dueDate.getTime() > twoDaysMs;
}
