import { createClient } from "@supabase/supabase-js";
import { getSupabaseUrl, getSupabaseAnonKey } from "@/lib/supabase/client";
import fs from "fs";
import path from "path";

export interface StoredPushSubscription {
  id?: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  user_agent?: string;
  created_at?: string;
  updated_at?: string;
}

const LOCAL_SUBSCRIPTIONS_FILE = path.join(
  process.cwd(),
  ".margin_push_subscriptions.json"
);

function getLocalSubscriptions(): StoredPushSubscription[] {
  try {
    if (fs.existsSync(LOCAL_SUBSCRIPTIONS_FILE)) {
      const raw = fs.readFileSync(LOCAL_SUBSCRIPTIONS_FILE, "utf-8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.debug("Could not read local subscriptions file:", err);
  }
  return [];
}

function saveLocalSubscriptions(subs: StoredPushSubscription[]) {
  try {
    fs.writeFileSync(LOCAL_SUBSCRIPTIONS_FILE, JSON.stringify(subs, null, 2), "utf-8");
  } catch (err) {
    console.debug("Could not write local subscriptions file:", err);
  }
}

/**
 * Save a push subscription to Supabase and local cache.
 */
export async function savePushSubscription(sub: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  userAgent?: string;
}): Promise<void> {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();

  // 1. Always save to local server file cache
  const existing = getLocalSubscriptions();
  const filtered = existing.filter((s) => s.endpoint !== sub.endpoint);
  filtered.push({
    endpoint: sub.endpoint,
    keys: sub.keys,
    user_agent: sub.userAgent,
    updated_at: new Date().toISOString(),
  });
  saveLocalSubscriptions(filtered);

  // 2. Save to Supabase if configured
  if (url && key) {
    try {
      const supabase = createClient(url, key);
      await supabase.from("push_subscriptions").upsert(
        {
          endpoint: sub.endpoint,
          p256dh: sub.keys.p256dh,
          auth: sub.keys.auth,
          user_agent: sub.userAgent || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "endpoint" }
      );
    } catch (err) {
      console.warn("Could not save push subscription to Supabase:", err);
    }
  }
}

/**
 * Retrieve all registered push subscriptions.
 */
export async function getAllPushSubscriptions(): Promise<StoredPushSubscription[]> {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();

  const localSubs = getLocalSubscriptions();

  if (url && key) {
    try {
      const supabase = createClient(url, key);
      const { data, error } = await supabase
        .from("push_subscriptions")
        .select("endpoint, p256dh, auth, user_agent, updated_at");

      if (!error && data && data.length > 0) {
        // Merge Supabase and local
        const mergedMap = new Map<string, StoredPushSubscription>();
        localSubs.forEach((s) => mergedMap.set(s.endpoint, s));
        data.forEach((row: any) => {
          mergedMap.set(row.endpoint, {
            endpoint: row.endpoint,
            keys: {
              p256dh: row.p256dh,
              auth: row.auth,
            },
            user_agent: row.user_agent,
            updated_at: row.updated_at,
          });
        });
        return Array.from(mergedMap.values());
      }
    } catch (err) {
      console.warn("Could not fetch push subscriptions from Supabase:", err);
    }
  }

  return localSubs;
}

/**
 * Remove an expired / unsubscribed endpoint.
 */
export async function removePushSubscription(endpoint: string): Promise<void> {
  const existing = getLocalSubscriptions();
  saveLocalSubscriptions(existing.filter((s) => s.endpoint !== endpoint));

  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  if (url && key) {
    try {
      const supabase = createClient(url, key);
      await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
    } catch (err) {
      console.warn("Could not remove push subscription from Supabase:", err);
    }
  }
}
