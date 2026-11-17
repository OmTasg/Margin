import { Priority } from "./types";

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
