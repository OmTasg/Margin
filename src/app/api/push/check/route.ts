import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseUrl, getSupabaseAnonKey } from "@/lib/supabase/client";
import { broadcastWebPush } from "@/lib/server/webPushService";
import { format } from "date-fns";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const NOTIFIED_PUSH_LOG = path.join(
  process.cwd(),
  ".margin_notified_push.json"
);

function getNotifiedKeys(): Record<string, number> {
  try {
    if (fs.existsSync(NOTIFIED_PUSH_LOG)) {
      return JSON.parse(fs.readFileSync(NOTIFIED_PUSH_LOG, "utf-8"));
    }
  } catch {}
  return {};
}

function markPushed(key: string) {
  try {
    const data = getNotifiedKeys();
    data[key] = Date.now();
    fs.writeFileSync(NOTIFIED_PUSH_LOG, JSON.stringify(data, null, 2), "utf-8");
  } catch {}
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    let tasks: any[] = body.tasks || [];

    // If no tasks provided in body, load active tasks from Supabase
    const url = getSupabaseUrl();
    const key = getSupabaseAnonKey();
    if (tasks.length === 0 && url && key) {
      const supabase = createClient(url, key);
      const { data } = await supabase
        .from("tasks")
        .select("*")
        .eq("is_completed", false)
        .not("due_date", "is", null);
      if (data) tasks = data;
    }

    if (tasks.length === 0) {
      return NextResponse.json({ success: true, dispatched: 0 });
    }

    const now = Date.now();
    const notified = getNotifiedKeys();
    let dispatched = 0;

    for (const task of tasks) {
      if (task.is_completed || !task.due_date) continue;

      const dueTime = new Date(task.due_date).getTime();
      if (isNaN(dueTime)) continue;

      const leadMins =
        typeof task.reminder_lead_time_minutes === "number"
          ? task.reminder_lead_time_minutes
          : 15;

      // 1. Lead-time reminder (e.g. 15 minutes before)
      if (leadMins > 0) {
        const leadTriggerTime = dueTime - leadMins * 60 * 1000;
        if (now >= leadTriggerTime && now < dueTime) {
          const leadKey = `lead-${task.id}-${task.due_date}-${leadMins}`;
          if (!notified[leadKey]) {
            markPushed(leadKey);

            const timeStr = format(new Date(task.due_date), "h:mm a");
            const leadStr =
              leadMins >= 1440
                ? `${Math.round(leadMins / 1440)}d`
                : leadMins >= 60
                ? `${Math.round(leadMins / 60)}h`
                : `${leadMins}m`;

            const coursePrefix = task.course_name ? `[${task.course_name}] ` : "";
            const title = `Reminder: ${coursePrefix}${task.title}`;
            const bodyText = `Due in ${leadStr} at ${timeStr}.`;

            const pushRes = await broadcastWebPush({
              title,
              body: bodyText,
              tag: `margin-lead-${task.id}`,
              data: { taskId: task.id },
            });

            if (pushRes.sent > 0) dispatched += pushRes.sent;
          }
        }
      }

      // 2. Due-time reminder (within 1 hour of due date)
      if (now >= dueTime && now - dueTime < 60 * 60 * 1000) {
        const dueKey = `due-${task.id}-${task.due_date}`;
        if (!notified[dueKey]) {
          markPushed(dueKey);

          const timeStr = format(new Date(task.due_date), "h:mm a");
          const coursePrefix = task.course_name ? `[${task.course_name}] ` : "";
          const title = `Due Now: ${coursePrefix}${task.title}`;
          const bodyText = `Scheduled for ${timeStr}. Tap to review or mark done.`;

          const pushRes = await broadcastWebPush({
            title,
            body: bodyText,
            tag: `margin-due-${task.id}`,
            data: { taskId: task.id },
          });

          if (pushRes.sent > 0) dispatched += pushRes.sent;
        }
      }
    }

    return NextResponse.json({ success: true, dispatched });
  } catch (err: any) {
    console.error("Push check error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to process push check." },
      { status: 500 }
    );
  }
}

// Allow GET for cron monitoring
export async function GET(req: NextRequest) {
  return POST(req);
}
