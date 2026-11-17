import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  const response = NextResponse.json({ success: true, message: "Disconnected from Google Calendar." });

  // Clear HTTP cookies
  response.cookies.delete("gcal_access_token");
  response.cookies.delete("gcal_refresh_token");
  response.cookies.delete("gcal_user_email");

  return response;
}
