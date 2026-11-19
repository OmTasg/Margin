"use client";

import { VAPID_PUBLIC_KEY, urlBase64ToUint8Array } from "./pushConfig";

export interface PushStatus {
  isSupported: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
  subscription: PushSubscription | null;
  error?: string;
}

/**
 * Check if Web Push is supported on this browser and device.
 * iOS 16.4+ supports this when added to the Home Screen (PWA mode).
 */
export function isPushNotificationSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/**
 * Get current push subscription status.
 */
export async function getPushSubscriptionStatus(): Promise<PushStatus> {
  if (!isPushNotificationSupported()) {
    return {
      isSupported: false,
      permission: "denied",
      isSubscribed: false,
      subscription: null,
      error: "Web Push is not supported in this browser. On iPhone, Margin must be added to your Home Screen.",
    };
  }

  try {
    const permission = Notification.permission;
    const reg = await navigator.serviceWorker.ready;
    const subscription = await reg.pushManager.getSubscription();

    return {
      isSupported: true,
      permission,
      isSubscribed: Boolean(subscription),
      subscription,
    };
  } catch (err: any) {
    return {
      isSupported: true,
      permission: Notification.permission,
      isSubscribed: false,
      subscription: null,
      error: err?.message || "Failed to inspect push subscription",
    };
  }
}

/**
 * Subscribe the current device (e.g. iPhone PWA) to Apple APNs Web Push.
 */
export async function registerPushSubscription(): Promise<{
  success: boolean;
  subscription?: PushSubscription;
  error?: string;
}> {
  if (!isPushNotificationSupported()) {
    return {
      success: false,
      error:
        "Push notifications are only supported on iPhone when Margin is added to your Home Screen (Safari Share ➔ Add to Home Screen).",
    };
  }

  try {
    // 1. Request permission if not already granted
    let perm = Notification.permission;
    if (perm !== "granted") {
      perm = await Notification.requestPermission();
    }

    if (perm !== "granted") {
      return {
        success: false,
        error:
          perm === "denied"
            ? "Notifications are blocked. Please go to iPhone Settings ➔ Safari / Margin to allow notifications."
            : "Notification permission was not granted.",
      };
    }

    // 2. Ensure Service Worker is active and ready
    const reg = await navigator.serviceWorker.ready;
    if (!reg) {
      return { success: false, error: "Service Worker is not ready." };
    }

    // 3. Check for existing subscription or create a new one
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      const appServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: appServerKey as any,
      });
    }

    // 4. Send subscription to our server backend (Supabase / API)
    const rawSub = sub.toJSON();
    const res = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subscription: rawSub,
        userAgent: navigator.userAgent,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      console.warn("Server subscription registration warning:", errData);
    }

    try {
      localStorage.setItem("margin_push_subscribed", "true");
    } catch {}

    return {
      success: true,
      subscription: sub,
    };
  } catch (err: any) {
    console.error("Push subscription error:", err);
    return {
      success: false,
      error: err?.message || "Failed to subscribe to push notifications.",
    };
  }
}

/**
 * Dispatch an immediate test push notification from server via Apple APNs to this device.
 */
export async function sendTestPush(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const regStatus = await registerPushSubscription();
    if (!regStatus.success || !regStatus.subscription) {
      return {
        success: false,
        error: regStatus.error || "Could not register push subscription.",
      };
    }

    const rawSub = regStatus.subscription.toJSON();
    const res = await fetch("/api/push/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription: rawSub }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.error || "Failed to dispatch test push notification.",
      };
    }

    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Error triggering test push notification.",
    };
  }
}
