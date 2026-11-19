import { NextRequest, NextResponse } from "next/server";
import { savePushSubscription } from "@/lib/server/pushStore";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { subscription, userAgent, supabaseUrl, supabaseAnonKey } = body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json(
        { error: "Invalid subscription payload." },
        { status: 400 }
      );
    }

    const { p256dh, auth } = subscription.keys;
    if (!p256dh || !auth) {
      return NextResponse.json(
        { error: "Missing cryptographic keys in subscription." },
        { status: 400 }
      );
    }

    await savePushSubscription({
      endpoint: subscription.endpoint,
      keys: { p256dh, auth },
      userAgent: userAgent || req.headers.get("user-agent") || undefined,
      supabaseUrl,
      supabaseAnonKey,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Push subscribe route error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to register subscription." },
      { status: 500 }
    );
  }
}
