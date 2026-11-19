import { NextRequest, NextResponse } from "next/server";
import { generateIcsFeed } from "@/lib/google/calendarUrl";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseUrl, getSupabaseAnonKey } from "@/lib/supabase/client";
import { Task } from "@/lib/types";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  let url = getSupabaseUrl();
  let key = getSupabaseAnonKey();

  if ((!url || !key) && typeof window === "undefined") {
    try {
      const credsPath = path.join(process.env.VERCEL ? "/tmp" : process.cwd(), ".margin_supabase_creds.json");
      if (fs.existsSync(credsPath)) {
        const creds = JSON.parse(fs.readFileSync(credsPath, "utf-8"));
        if (creds.url) url = creds.url;
        if (creds.key) key = creds.key;
      }
    } catch {}
  }

  let tasks: Task[] = [];
  const searchParams = req.nextUrl.searchParams;
  const excludeCanvas = searchParams.get("excludeCanvas") === "true";

  if (url && key) {
    try {
      const supabase = createClient(url, key);
      let query = supabase
        .from("tasks")
        .select("*")
        .eq("is_completed", false)
        .not("due_date", "is", null);

      if (excludeCanvas) {
        query = query.neq("source", "canvas");
      }

      const { data, error } = await query;
      if (!error && data) {
        tasks = data as Task[];
      }
    } catch (err) {
      console.error("Failed to fetch tasks for iCal feed:", err);
    }
  }

  const icsData = generateIcsFeed(tasks);

  return new NextResponse(icsData, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="margin-reminders.ics"',
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
