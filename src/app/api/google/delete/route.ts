import { NextRequest, NextResponse } from "next/server";
import { deleteFromGoogleCalendar } from "@/lib/google/calendar";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { eventId, calendarId = "primary", accessToken: bodyAccessToken, refreshToken: bodyRefreshToken } = body;

    if (!eventId) {
      return NextResponse.json({ success: true, message: "No event ID to delete." });
    }

    const accessToken = bodyAccessToken || req.cookies.get("gcal_access_token")?.value;
    const refreshToken = bodyRefreshToken || req.cookies.get("gcal_refresh_token")?.value;

    if (!accessToken && !refreshToken) {
      return NextResponse.json({ success: true, message: "Google not connected, skipping remote deletion." });
    }

    const success = await deleteFromGoogleCalendar(
      { access_token: accessToken, refresh_token: refreshToken },
      calendarId,
      eventId
    );

    return NextResponse.json({ success });
  } catch (err: any) {
    console.error("Google delete route error:", err);
    return NextResponse.json({ error: err?.message || "Failed to delete event." }, { status: 500 });
  }
}
