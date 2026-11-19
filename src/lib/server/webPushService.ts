import * as webpush from "web-push";
import {
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY,
  VAPID_SUBJECT,
} from "@/lib/pushConfig";
import {
  getAllPushSubscriptions,
  removePushSubscription,
  StoredPushSubscription,
} from "./pushStore";

// Initialize VAPID details
webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, any>;
}

/**
 * Send a web push notification to a specific subscription.
 */
export async function sendWebPushToSubscription(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: PushNotificationPayload
): Promise<{ success: boolean; error?: string }> {
  try {
    const stringified = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || "/icons/icon-192x192.png",
      badge: payload.badge || "/icons/icon-192x192.png",
      tag: payload.tag || "margin-notification",
      data: payload.data || {},
    });

    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      },
      stringified,
      {
        TTL: 60 * 60 * 24, // 24 hours
        urgency: "high",
      }
    );

    return { success: true };
  } catch (err: any) {
    console.error("Web Push delivery error:", err?.statusCode, err?.message);

    // If subscription is expired or unsubscribed (404 / 410 Gone), remove it
    if (err?.statusCode === 404 || err?.statusCode === 410) {
      await removePushSubscription(subscription.endpoint);
    }

    return {
      success: false,
      error: err?.message || "Failed to deliver push notification",
    };
  }
}

/**
 * Broadcast a web push notification to all registered subscriptions (e.g. phone + tablet).
 */
export async function broadcastWebPush(
  payload: PushNotificationPayload
): Promise<{ sent: number; failed: number }> {
  const subscriptions = await getAllPushSubscriptions();
  if (subscriptions.length === 0) {
    return { sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;

  await Promise.all(
    subscriptions.map(async (sub) => {
      const res = await sendWebPushToSubscription(sub, payload);
      if (res.success) {
        sent++;
      } else {
        failed++;
      }
    })
  );

  return { sent, failed };
}
