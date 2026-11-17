import { NextRequest, NextResponse } from "next/server";
import { parseIcsContent, fallbackIcsParser } from "@/lib/ical/parser";
import { Task, UserSettings } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { icsUrl, existingTasks = [], defaultReminderMinutes = 15 } = body;

    if (!icsUrl || typeof icsUrl !== "string") {
      return NextResponse.json(
        { error: "Please provide a valid Canvas iCal (.ics) feed URL." },
        { status: 400 }
      );
    }

    const trimmedUrl = icsUrl.trim();

    // Check if it's a valid web URL or webcal URL
    const fetchUrl = trimmedUrl.replace(/^webcal:\/\//i, "https://");

    let icsData = "";
    try {
      const response = await fetch(fetchUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; CanvasCalendarSync/1.0)",
          Accept: "text/calendar, text/plain, */*",
        },
        cache: "no-store",
      });

      if (!response.ok) {
        return NextResponse.json(
          {
            error: `Failed to fetch Canvas feed: HTTP ${response.status} ${response.statusText}. Please verify the URL.`,
          },
          { status: 400 }
        );
      }

      icsData = await response.text();
    } catch (fetchError: any) {
      return NextResponse.json(
        {
          error: `Could not connect to Canvas URL: ${fetchError?.message || "Network error"}. Check internet connection or feed link.`,
        },
        { status: 400 }
      );
    }

    if (!icsData.includes("BEGIN:VCALENDAR")) {
      return NextResponse.json(
        {
          error: "The provided URL did not return a valid iCalendar (.ics) format. Ensure you copied the 'Calendar Feed' link from Canvas.",
        },
        { status: 400 }
      );
    }

    // Parse the ICS events
    let parsedEvents = await parseIcsContent(icsData);
    if (!parsedEvents || parsedEvents.length === 0) {
      parsedEvents = fallbackIcsParser(icsData);
    }

    const existingMap = new Map<string, Task>();
    for (const t of existingTasks as Task[]) {
      if (t.canvas_uid) {
        existingMap.set(t.canvas_uid, t);
      }
    }

    let importedCount = 0;
    let updatedCount = 0;
    const nowIso = new Date().toISOString();
    const resultTasks: Task[] = [...existingTasks];

    for (const event of parsedEvents) {
      const existing = existingMap.get(event.canvas_uid);

      if (existing) {
        // Check if anything changed
        const dateChanged = existing.due_date !== event.due_date;
        const titleChanged = existing.title !== event.title;
        const notesChanged = existing.notes !== event.notes;
        const urlChanged = existing.external_url !== event.external_url;

        if (dateChanged || titleChanged || notesChanged || urlChanged) {
          const index = resultTasks.findIndex((t) => t.id === existing.id);
          if (index !== -1) {
            resultTasks[index] = {
              ...resultTasks[index],
              title: event.title,
              due_date: event.due_date,
              notes: event.notes || resultTasks[index].notes,
              course_name: event.course_name || resultTasks[index].course_name,
              external_url: event.external_url || resultTasks[index].external_url,
              updated_at: nowIso,
            };
            updatedCount++;
          }
        }
      } else {
        // New assignment from Canvas
        const newTask: Task = {
          id: `canvas-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          title: event.title,
          notes: event.notes,
          priority: "P2", // Default to Medium priority per requirement
          due_date: event.due_date,
          is_completed: false,
          reminder_lead_time_minutes: defaultReminderMinutes,
          source: "canvas",
          external_url: event.external_url,
          course_name: event.course_name,
          canvas_uid: event.canvas_uid,
          is_pushed_to_google: false,
          created_at: nowIso,
          updated_at: nowIso,
        };

        resultTasks.unshift(newTask);
        importedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      importedCount,
      updatedCount,
      totalFound: parsedEvents.length,
      syncedAt: nowIso,
      tasks: resultTasks,
    });
  } catch (err: any) {
    console.error("Canvas sync route error:", err);
    return NextResponse.json(
      { error: err?.message || "An unexpected error occurred during Canvas sync." },
      { status: 500 }
    );
  }
}
