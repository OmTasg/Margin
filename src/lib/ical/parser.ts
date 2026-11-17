import ical from "node-ical";

export interface ParsedCanvasEvent {
  canvas_uid: string;
  title: string;
  notes?: string;
  due_date: string | null;
  course_name?: string | null;
  external_url?: string | null;
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

export function extractCanvasUrl(description: string, eventUrl?: string): string | null {
  if (eventUrl && eventUrl.startsWith("http")) {
    return eventUrl.trim();
  }

  if (!description) return null;

  // Look for Canvas assignment link pattern: /courses/:id/assignments/:id
  const canvasAssignmentRegex = /(https?:\/\/[^\s<>"]+\/courses\/\d+\/assignments\/\d+[^\s<>"]*)/i;
  const match = description.match(canvasAssignmentRegex);
  if (match) {
    return match[1];
  }

  // Fallback to any URL in description
  const generalUrlRegex = /(https?:\/\/[^\s<>"]+)/i;
  const generalMatch = description.match(generalUrlRegex);
  return generalMatch ? generalMatch[1] : null;
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

/**
 * Parses raw iCal ICS string into normalized Canvas events
 */
export async function parseIcsContent(icsData: string): Promise<ParsedCanvasEvent[]> {
  try {
    const parsedData = await ical.async.parseICS(icsData);
    const events: ParsedCanvasEvent[] = [];

    for (const key of Object.keys(parsedData)) {
      const item = parsedData[key];
      if (!item || item.type !== "VEVENT") continue;

      const uid = item.uid || key;
      const rawSummary = item.summary || "Untitled Canvas Assignment";
      const { title, courseName: extractedCourse } = parseCanvasSummary(rawSummary);

      const rawDescription = item.description ? String(item.description) : "";
      const cleanedNotes = cleanDescription(rawDescription);

      const eventUrl = typeof item.url === "object" && item.url ? (item.url as any).val : item.url;
      const externalUrl = extractCanvasUrl(rawDescription, eventUrl);

      // Determine due date: Canvas assignments use DTEND or DTSTART
      let dueDate: Date | null = null;
      if (item.end && item.end instanceof Date && !isNaN(item.end.getTime())) {
        dueDate = item.end;
      } else if (item.start && item.start instanceof Date && !isNaN(item.start.getTime())) {
        dueDate = item.start;
      }

      // Check categories for course name fallback
      let courseName = extractedCourse;
      const categories = (item as any).categories;
      if (!courseName && Array.isArray(categories) && categories.length > 0) {
        courseName = String(categories[0]);
      }

      events.push({
        canvas_uid: uid,
        title,
        notes: cleanedNotes || undefined,
        due_date: dueDate ? dueDate.toISOString() : null,
        course_name: courseName || null,
        external_url: externalUrl || null,
      });
    }

    return events;
  } catch (error) {
    console.error("Error in parseIcsContent, attempting fallback parser:", error);
    return fallbackIcsParser(icsData);
  }
}

/**
 * Robust regex-based fallback parser for ICS if node-ical fails
 */
export function fallbackIcsParser(icsData: string): ParsedCanvasEvent[] {
  const events: ParsedCanvasEvent[] = [];
  const veventBlocks = icsData.split("BEGIN:VEVENT");

  for (let i = 1; i < veventBlocks.length; i++) {
    const block = veventBlocks[i].split("END:VEVENT")[0];
    if (!block) continue;

    const uidMatch = block.match(/UID:(.+?)(\r?\n|$)/);
    const summaryMatch = block.match(/SUMMARY:(.+?)(\r?\n|$)/);
    const descMatch = block.match(/DESCRIPTION:([\s\S]+?)(\r?\n[A-Z0-9-]+:|$)/);
    const urlMatch = block.match(/URL:(.+?)(\r?\n|$)/);
    const dtendMatch = block.match(/DTEND(?:;[^:]+)?:([0-9TZ]+)(\r?\n|$)/);
    const dtstartMatch = block.match(/DTSTART(?:;[^:]+)?:([0-9TZ]+)(\r?\n|$)/);

    const uid = uidMatch ? uidMatch[1].trim() : `fallback-${Date.now()}-${i}`;
    const rawSummary = summaryMatch ? summaryMatch[1].trim() : "Untitled Canvas Assignment";
    const { title, courseName } = parseCanvasSummary(rawSummary);

    const rawDesc = descMatch ? descMatch[1].trim() : "";
    const cleanedNotes = cleanDescription(rawDesc);
    const eventUrl = urlMatch ? urlMatch[1].trim() : undefined;
    const externalUrl = extractCanvasUrl(rawDesc, eventUrl);

    let dueDateStr: string | null = null;
    const dateStr = (dtendMatch ? dtendMatch[1] : dtstartMatch ? dtstartMatch[1] : null);
    if (dateStr) {
      dueDateStr = parseIcsDateString(dateStr);
    }

    events.push({
      canvas_uid: uid,
      title,
      notes: cleanedNotes || undefined,
      due_date: dueDateStr,
      course_name: courseName,
      external_url: externalUrl,
    });
  }

  return events;
}

function parseIcsDateString(str: string): string | null {
  // Format: 20261118T180000Z or 20261118
  try {
    const clean = str.trim();
    if (clean.length === 8) {
      // YYYYMMDD
      const year = parseInt(clean.substring(0, 4), 10);
      const month = parseInt(clean.substring(4, 6), 10) - 1;
      const day = parseInt(clean.substring(6, 8), 10);
      return new Date(Date.UTC(year, month, day, 23, 59, 59)).toISOString();
    }
    const match = clean.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/);
    if (match) {
      const year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1;
      const day = parseInt(match[3], 10);
      const hour = parseInt(match[4], 10);
      const minute = parseInt(match[5], 10);
      const second = parseInt(match[6], 10);
      const isUtc = Boolean(match[7]);

      if (isUtc) {
        return new Date(Date.UTC(year, month, day, hour, minute, second)).toISOString();
      } else {
        return new Date(year, month, day, hour, minute, second).toISOString();
      }
    }
  } catch {
    // Ignore invalid date
  }
  return null;
}
