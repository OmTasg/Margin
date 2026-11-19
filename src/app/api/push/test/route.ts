import { NextRequest, NextResponse } from "next/server";
import {
  sendWebPushToSubscription,
  broadcastWebPush,
} from "@/lib/server/webPushService";
import { savePushSubscription } from "@/lib/server/pushStore";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { subscription } = body;

    const testPayload = {
      title: "Margin · Notification Active 🔔",
      body: "You're all set! You will now receive lock screen reminders for your assignments and tasks.",
      tag: "margin-test-push",
      data: {
        url: "/",
        timestamp: Date.now(),
      },
    };

    if (subscription && subscription.endpoint && subscription.keys) {
      // Save subscription and send test directly to it
      await savePushSubscription({
        endpoint: subscription.endpoint,
        keys: subscription.keys,
        userAgent: req.headers.get("user-agent") || undefined,
      });

      const res = await sendWebPushToSubscription(subscription, testPayload);
      if (!res.success) {
        return NextResponse.json(
          { error: res.error || "Failed to dispatch push notification." },
          { status: 500 }
        );
      }
      return NextResponse.json({ success: true, deliveredTo: subscription.endpoint });
    }

    // Otherwise broadcast to all registered devices
    const broadcastRes = await broadcastWebPush(testPayload);
    if (broadcastRes.sent === 0 && broadcastRes.failed === 0) {
      return NextResponse.json(
        {
          error:
            "No devices are currently subscribed to push notifications. Tap 'Enable Phone Lock Screen Notifications' in Margin on your iPhone.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: broadcastRes.sent > 0,
      sent: broadcastRes.sent,
      failed: broadcastRes.failed,
    });
  } catch (err: any) {
    console.error("Test push error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to trigger test push notification." },
      { status: 500 }
    );
  }
}
