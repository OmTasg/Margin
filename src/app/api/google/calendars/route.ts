import { NextRequest, NextResponse } from "next/server";
import { listGoogleCalendars } from "@/lib/google/calendar";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const accessToken = body.accessToken || req.cookies.get("gcal_access_token")?.value;
    const refreshToken = body.refreshToken || req.cookies.get("gcal_refresh_token")?.value;

    if (!accessToken && !refreshToken) {
      return NextResponse.json(
        { error: "Google account is not connected. Please connect Google Calendar in Settings." },
        { status: 401 }
      );
    }

    const calendars = await listGoogleCalendars({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    return NextResponse.json({ calendars });
  } catch (err: any) {
    console.error("List calendars error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to fetch Google calendars" },
      { status: 500 }
    );
  }
}
