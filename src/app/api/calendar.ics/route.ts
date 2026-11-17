import { NextRequest, NextResponse } from "next/server";
import { generateIcsFeed } from "@/lib/google/calendarUrl";
import { Task } from "@/lib/types";
import { INITIAL_SAMPLE_TASKS } from "@/lib/storage/localStore";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // If tasks are provided via query parameter or cookie, we can serialize them;
  // default to sample tasks or empty calendar if none supplied
  const icsData = generateIcsFeed(INITIAL_SAMPLE_TASKS);

  return new NextResponse(icsData, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="focustask.ics"',
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
