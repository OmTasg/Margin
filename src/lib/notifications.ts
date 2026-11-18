"use client";

/**
 * Native Notification & Audio Chime Service for Margin
 * Supports Web Notifications API, Service Worker Push/Notifications, and Web Audio API Chimes.
 */

export type NotificationPermissionStatus =
  | "granted"
  | "denied"
  | "default"
  | "unsupported";

/**
 * Check if the browser environment supports Web Notifications.
 */
export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

/**
 * Get current browser notification permission status.
 */
export function getNotificationPermission(): NotificationPermissionStatus {
  if (!isNotificationSupported()) return "unsupported";
  return Notification.permission as NotificationPermissionStatus;
}

/**
 * Request permission from the user to display notifications.
 * Must be initiated from a user gesture (e.g. clicking a button).
 */
export async function requestNotificationPermission(): Promise<NotificationPermissionStatus> {
  if (!isNotificationSupported()) return "unsupported";

  try {
    const permission = await Notification.requestPermission();
    return permission as NotificationPermissionStatus;
  } catch (err) {
    console.warn("Error requesting notification permission:", err);
    return Notification.permission as NotificationPermissionStatus;
  }
}

/**
 * Play a calm, pleasant, minimalist chime using the browser's Web Audio API.
 * No external mp3 asset required; zero network overhead and instant playback.
 */
export function playNotificationChime(): void {
  if (typeof window === "undefined") return;

  try {
    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // First bell tone (D5 - 587.33 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, now);
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.12);

    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.45);

    // Harmonic chime tone (A5 to D6 - 880 to 1174.66 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880, now + 0.08);
    osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.28);

    gain2.gain.setValueAtTime(0.09, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.55);
  } catch (e) {
    // Graceful fallback if autoplay restrictions block audio context
    console.debug("Audio chime skipped:", e);
  }
}

/**
 * Send a native device / browser notification.
 * Uses Service Worker showNotification if available (essential for mobile PWA/iOS 16.4+),
 * falling back to standard desktop Notification constructor.
 */
export async function sendBrowserNotification({
  title,
  body,
  tag,
  data,
}: {
  title: string;
  body: string;
  tag?: string;
  data?: any;
}): Promise<boolean> {
  if (!isNotificationSupported()) return false;
  if (Notification.permission !== "granted") return false;

  const icon = "/icons/icon-192x192.png";
  const badge = "/icons/icon-192x192.png";

  try {
    // 1. Try Service Worker showNotification first (supports PWA installed mode on mobile/desktop)
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && reg.showNotification) {
        await reg.showNotification(title, {
          body,
          icon,
          badge,
          tag,
          data,
          vibrate: [200, 100, 200],
        } as any);
        return true;
      }
    }

    // 2. Fallback to standard web Notification
    const n = new Notification(title, {
      body,
      icon,
      badge,
      tag,
      data,
    });

    n.onclick = () => {
      window.focus();
      n.close();
    };

    return true;
  } catch (err) {
    console.warn("Failed to dispatch browser notification:", err);
    return false;
  }
}

/**
 * Dispatch a test notification and chime to verify permissions and device audio.
 */
export async function dispatchTestNotification(): Promise<{
  success: boolean;
  permission: NotificationPermissionStatus;
  error?: string;
}> {
  if (!isNotificationSupported()) {
    return {
      success: false,
      permission: "unsupported",
      error: "Notifications are not supported in this browser environment.",
    };
  }

  let permission = Notification.permission as NotificationPermissionStatus;
  if (permission !== "granted") {
    permission = await requestNotificationPermission();
  }

  if (permission !== "granted") {
    return {
      success: false,
      permission,
      error:
        permission === "denied"
          ? "Notifications are blocked. Please enable them in your browser or device settings."
          : "Notification permission was not granted.",
    };
  }

  playNotificationChime();

  const sent = await sendBrowserNotification({
    title: "Margin · Notifications Active 🔔",
    body: "You're all set! You will now receive timely reminders for your Canvas assignments and tasks.",
    tag: "margin-test-notification",
  });

  return {
    success: sent,
    permission,
    error: sent ? undefined : "Failed to trigger system notification.",
  };
}
