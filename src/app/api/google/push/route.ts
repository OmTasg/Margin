import { NextRequest, NextResponse } from "next/server";
import { syncTaskToGoogleCalendar } from "@/lib/google/calendar";
import { Task } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { task, calendarId = "primary", accessToken: bodyAccessToken, refreshToken: bodyRefreshToken } = body;

    if (!task || !task.title) {
      return NextResponse.json({ error: "Invalid task data provided." }, { status: 400 });
    }

    const accessToken = bodyAccessToken || req.cookies.get("gcal_access_token")?.value;
    const refreshToken = bodyRefreshToken || req.cookies.get("gcal_refresh_token")?.value;

    if (!accessToken && !refreshToken) {
      return NextResponse.json(
        { error: "Google Calendar is not connected. Please connect in Settings." },
        { status: 401 }
      );
    }

    const result = await syncTaskToGoogleCalendar(
      { access_token: accessToken, refresh_token: refreshToken },
      calendarId,
      task as Task
    );

    return NextResponse.json({
      success: true,
      eventId: result.eventId,
      htmlLink: result.htmlLink,
    });
  } catch (err: any) {
    console.error("Google push route error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to push task to Google Calendar." },
      { status: 500 }
    );
  }
}
