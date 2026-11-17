import { google } from "googleapis";
import { Task, GoogleCalendarItem } from "../types";

export function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const redirectUri = `${appUrl}/api/auth/google/callback`;

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export function getGoogleAuthUrl(): string {
  const oauth2Client = getOAuth2Client();

  const scopes = [
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/userinfo.email",
  ];

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    prompt: "consent",
    include_granted_scopes: true,
  });
}

export async function exchangeCodeForTokens(code: string) {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

export async function getUserEmailWithToken(accessToken: string): Promise<string | null> {
  try {
    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({ access_token: accessToken });
    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    return userInfo.data.email || null;
  } catch (error) {
    console.error("Error fetching Google user email:", error);
    return null;
  }
}

export function getCalendarClientWithTokens(tokens: {
  access_token?: string | null;
  refresh_token?: string | null;
}) {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    access_token: tokens.access_token || undefined,
    refresh_token: tokens.refresh_token || undefined,
  });
  return google.calendar({ version: "v3", auth: oauth2Client });
}

export async function listGoogleCalendars(tokens: {
  access_token?: string | null;
  refresh_token?: string | null;
}): Promise<GoogleCalendarItem[]> {
  const calendar = getCalendarClientWithTokens(tokens);
  const response = await calendar.calendarList.list({
    minAccessRole: "writer",
  });

  const items = response.data.items || [];
  return items.map((item) => ({
    id: item.id || "primary",
    summary: item.summary || "Unnamed Calendar",
    description: item.description || undefined,
    primary: item.primary || false,
    backgroundColor: item.backgroundColor || undefined,
  }));
}

export async function syncTaskToGoogleCalendar(
  tokens: { access_token?: string | null; refresh_token?: string | null },
  calendarId: string,
  task: Task
): Promise<{ eventId: string; htmlLink?: string }> {
  const calendar = getCalendarClientWithTokens(tokens);
  const targetCalId = calendarId || "primary";

  // Compute start and end times
  let dueDate = task.due_date ? new Date(task.due_date) : new Date();
  if (isNaN(dueDate.getTime())) {
    dueDate = new Date();
  }

  // End time is the deadline. Start time is 30 mins before, or exact time.
  const endTime = dueDate.toISOString();
  const startTime = new Date(dueDate.getTime() - 30 * 60 * 1000).toISOString();

  const titlePrefix = task.course_name ? `[${task.course_name}] ` : "";
  const summary = `${titlePrefix}${task.title}`;

  const descriptionParts: string[] = [];
  if (task.notes) {
    descriptionParts.push(task.notes);
  }
  if (task.external_url) {
    descriptionParts.push(`\nCanvas Assignment Link:\n${task.external_url}`);
  }
  descriptionParts.push(`\nPriority: ${task.priority}`);
  descriptionParts.push(`Managed by TodoApp PWA`);

  const description = descriptionParts.join("\n");

  const reminderMinutes = typeof task.reminder_lead_time_minutes === "number"
    ? task.reminder_lead_time_minutes
    : 15;

  const eventRequestBody: any = {
    summary,
    description,
    start: { dateTime: startTime },
    end: { dateTime: endTime },
    reminders: {
      useDefault: false,
      overrides: [
        { method: "popup", minutes: Math.max(0, reminderMinutes) },
      ],
    },
  };

  // If already pushed to Google, try to update existing event
  if (task.google_event_id) {
    try {
      const updated = await calendar.events.patch({
        calendarId: targetCalId,
        eventId: task.google_event_id,
        requestBody: eventRequestBody,
      });

      if (updated.data.id) {
        return {
          eventId: updated.data.id,
          htmlLink: updated.data.htmlLink || undefined,
        };
      }
    } catch (err: any) {
      // If 404 or 410 (event was deleted in GCal), proceed to create a fresh one below
      if (err.code !== 404 && err.code !== 410) {
        console.error("Error updating Google Calendar event, creating new one:", err);
      }
    }
  }

  // Otherwise, insert new event
  const created = await calendar.events.insert({
    calendarId: targetCalId,
    requestBody: eventRequestBody,
  });

  return {
    eventId: created.data.id || "",
    htmlLink: created.data.htmlLink || undefined,
  };
}

export async function deleteFromGoogleCalendar(
  tokens: { access_token?: string | null; refresh_token?: string | null },
  calendarId: string,
  eventId: string
): Promise<boolean> {
  try {
    const calendar = getCalendarClientWithTokens(tokens);
    await calendar.events.delete({
      calendarId: calendarId || "primary",
      eventId,
    });
    return true;
  } catch (err: any) {
    // If already deleted or not found, return true
    if (err.code === 404 || err.code === 410) {
      return true;
    }
    console.error("Error deleting Google Calendar event:", err);
    return false;
  }
}
