import { Task } from "../types";

/**
 * Generates an instant, zero-auth Google Calendar event creation URL
 * Opens directly in the Google Calendar web app or mobile app with all fields pre-filled.
 */
export function generateGoogleCalendarUrl(task: Task): string {
  const baseUrl = "https://calendar.google.com/calendar/render?action=TEMPLATE";

  const titlePrefix = task.course_name ? `[${task.course_name}] ` : "";
  const title = encodeURIComponent(`${titlePrefix}${task.title}`);

  // Calculate start and end times in UTC format (YYYYMMDDTHHmmssZ)
  let dueDate = task.due_date ? new Date(task.due_date) : new Date();
  if (isNaN(dueDate.getTime())) {
    dueDate = new Date();
  }

  // 30-minute block ending at due date
  const startDate = new Date(dueDate.getTime() - 30 * 60 * 1000);
  const formatDateUtc = (d: Date) => {
    return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  };

  const dates = `${formatDateUtc(startDate)}/${formatDateUtc(dueDate)}`;

  const detailsParts: string[] = [];
  if (task.notes) {
    detailsParts.push(task.notes);
  }
  if (task.external_url) {
    detailsParts.push(`\nCanvas Assignment:\n${task.external_url}`);
  }
  detailsParts.push(`\nPriority: ${task.priority}`);
  detailsParts.push(`Reminder Lead Time: ${task.reminder_lead_time_minutes}m before`);

  const details = encodeURIComponent(detailsParts.join("\n"));
  const location = task.external_url ? encodeURIComponent(task.external_url) : "";

  return `${baseUrl}&text=${title}&dates=${dates}&details=${details}${location ? `&location=${location}` : ""}`;
}

/**
 * Formats tasks into standard iCalendar (.ics) format for subscription in Google Calendar
 */
export function generateIcsFeed(tasks: Task[]): string {
  const formatIcsDate = (isoStr?: string | null) => {
    if (!isoStr) return "";
    const d = new Date(isoStr);
    return isNaN(d.getTime())
      ? ""
      : d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  };

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//FocusTask App//FocusTask Calendar Feed//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:FocusTask Tasks",
    "X-WR-TIMEZONE:UTC",
  ];

  tasks
    .filter((t) => !t.is_completed && t.due_date)
    .forEach((t) => {
      const dueDate = new Date(t.due_date!);
      const startDate = new Date(dueDate.getTime() - 30 * 60 * 1000);

      const titlePrefix = t.course_name ? `[${t.course_name}] ` : "";
      const summary = `${titlePrefix}${t.title}`.replace(/[,;]/g, "\\$&");
      const desc = (t.notes ? `${t.notes}\n\n` : "") +
        (t.external_url ? `Canvas: ${t.external_url}\n` : "") +
        `Priority: ${t.priority}`;

      lines.push("BEGIN:VEVENT");
      lines.push(`UID:${t.canvas_uid || `focustask-${t.id}`}`);
      lines.push(`DTSTAMP:${formatIcsDate(new Date().toISOString())}`);
      lines.push(`DTSTART:${formatIcsDate(startDate.toISOString())}`);
      lines.push(`DTEND:${formatIcsDate(dueDate.toISOString())}`);
      lines.push(`SUMMARY:${summary}`);
      lines.push(`DESCRIPTION:${desc.replace(/\n/g, "\\n").replace(/[,;]/g, "\\$&")}`);
      if (t.external_url) {
        lines.push(`URL:${t.external_url}`);
      }
      lines.push("END:VEVENT");
    });

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
