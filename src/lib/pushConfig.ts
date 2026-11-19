/**
 * Web Push & VAPID Configuration for Margin
 * Supports standard RFC 8291 / RFC 8292 Web Push Protocol used by Apple APNs (iOS 16.4+)
 * and Google FCM (Chrome / Android).
 */

export const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  "BDvC6vJ9-gDkBPOHQkomC8dq6-nhyZwS1u99rs_kmPt9GOgWbjmtnDdmMwuzV5LeHEsms2qwNlEpq789bXPcl2Q";

export const VAPID_PRIVATE_KEY =
  process.env.VAPID_PRIVATE_KEY ||
  "Dx532lbNZtPvhg6xeF2mI3dU3EWrDRTPWZCn0g1CF7c";

export const VAPID_SUBJECT =
  process.env.VAPID_SUBJECT || "mailto:support@marginapp.com";

/**
 * Utility to convert base64 URL-safe VAPID key to Uint8Array for PushManager.subscribe
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
