import { NextResponse } from "next/server";
import { getGoogleAuthUrl } from "@/lib/google/calendar";

export const dynamic = "force-dynamic";

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret || clientId.includes("your-google-client-id")) {
    return NextResponse.json(
      {
        error: "Google OAuth credentials are not configured in environment variables. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.",
        isConfigured: false,
      },
      { status: 400 }
    );
  }

  try {
    const url = getGoogleAuthUrl();
    return NextResponse.redirect(url);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to generate Google auth URL" },
      { status: 500 }
    );
  }
}
