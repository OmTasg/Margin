"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Task, UserSettings } from "@/lib/types";
import { format } from "date-fns";
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  sendBrowserNotification,
  playNotificationChime,
  dispatchTestNotification,
  NotificationPermissionStatus,
} from "@/lib/notifications";

const NOTIFIED_STORAGE_KEY = "margin_notified_reminders_v1";

interface NotifiedRecord {
  [key: string]: number; // key -> timestamp when fired
}

interface Props {
  tasks: Task[];
  settings: UserSettings;
  onNotifyInApp?: (info: {
    type: "info" | "warning";
    title: string;
    message: string;
    taskId?: string;
  }) => void;
}

export function useNotificationScheduler({
  tasks,
  settings,
  onNotifyInApp,
}: Props) {
  const [permission, setPermission] = useState<NotificationPermissionStatus>("default");
  const notifiedMapRef = useRef<NotifiedRecord>({});

  // Initialize permission and load fired reminder cache
  useEffect(() => {
    if (typeof window === "undefined") return;

    setPermission(getNotificationPermission());

    try {
      const raw = localStorage.getItem(NOTIFIED_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const now = Date.now();
        const threeDaysAgo = now - 3 * 24 * 60 * 60 * 1000;
        const cleaned: NotifiedRecord = {};

        // Prune records older than 3 days
        Object.keys(parsed).forEach((k) => {
          if (parsed[k] > threeDaysAgo) {
            cleaned[k] = parsed[k];
          }
        });

        notifiedMapRef.current = cleaned;
        localStorage.setItem(NOTIFIED_STORAGE_KEY, JSON.stringify(cleaned));
      }
    } catch {
      notifiedMapRef.current = {};
    }
  }, []);

  const markNotified = useCallback((key: string) => {
    notifiedMapRef.current[key] = Date.now();
    try {
      localStorage.setItem(
        NOTIFIED_STORAGE_KEY,
        JSON.stringify(notifiedMapRef.current)
      );
    } catch {
      // Ignore quota errors
    }
  }, []);

  const isAlreadyNotified = useCallback((key: string): boolean => {
    return Boolean(notifiedMapRef.current[key]);
  }, []);

  // Periodic reminder checker
  const checkUpcomingReminders = useCallback(() => {
    if (typeof window === "undefined") return;
    const now = Date.now();

    tasks.forEach((task) => {
      if (task.is_completed || !task.due_date) return;

      const dueTime = new Date(task.due_date).getTime();
      if (isNaN(dueTime)) return;

      const leadMins =
        typeof task.reminder_lead_time_minutes === "number"
          ? task.reminder_lead_time_minutes
          : settings.default_reminder_lead_time_minutes;

      // 1. Lead-Time Reminder (e.g. 15m or 1h before)
      if (leadMins > 0) {
        const leadTriggerTime = dueTime - leadMins * 60 * 1000;
        // Fire if we've passed the trigger time, haven't passed due date, and haven't notified yet
        if (now >= leadTriggerTime && now < dueTime) {
          const leadKey = `lead-${task.id}-${task.due_date}-${leadMins}`;
          if (!isAlreadyNotified(leadKey)) {
            markNotified(leadKey);

            const timeStr = format(new Date(task.due_date), "h:mm a");
            const leadStr =
              leadMins >= 1440
                ? `${Math.round(leadMins / 1440)}d`
                : leadMins >= 60
                ? `${Math.round(leadMins / 60)}h`
                : `${leadMins}m`;

            const title = `Reminder: ${task.course_name ? `[${task.course_name}] ` : ""}${task.title}`;
            const body = `Due in ${leadStr} at ${timeStr}.`;

            // Trigger system notification
            sendBrowserNotification({
              title,
              body,
              tag: `margin-lead-${task.id}`,
              data: { taskId: task.id },
            });

            // Audio chime
            if (settings.notification_sound_enabled !== false) {
              playNotificationChime();
            }

            // In-app alert toast
            if (onNotifyInApp) {
              onNotifyInApp({
                type: "warning",
                title: "Upcoming Due Date",
                message: `${title} · Due at ${timeStr}`,
                taskId: task.id,
              });
            }
          }
        }
      }

      // 2. Exact Due-Time Alert or Catch-Up within 3 hours
      if (settings.notify_at_due_time !== false) {
        const threeHours = 3 * 60 * 60 * 1000;
        if (now >= dueTime && now - dueTime < threeHours) {
          const dueKey = `due-${task.id}-${task.due_date}`;
          if (!isAlreadyNotified(dueKey)) {
            markNotified(dueKey);

            const timeStr = format(new Date(task.due_date), "h:mm a");
            const isJustNow = now - dueTime < 5 * 60 * 1000;
            const title = isJustNow
              ? `Due Now: ${task.course_name ? `[${task.course_name}] ` : ""}${task.title}`
              : `Past Due: ${task.course_name ? `[${task.course_name}] ` : ""}${task.title}`;
            const body = isJustNow
              ? `Scheduled for ${timeStr}. Tap to review or mark done.`
              : `Was scheduled for ${timeStr}. Tap to review or complete.`;

            // Trigger system notification
            sendBrowserNotification({
              title,
              body,
              tag: `margin-due-${task.id}`,
              data: { taskId: task.id },
            });

            // Audio chime
            if (settings.notification_sound_enabled !== false) {
              playNotificationChime();
            }

            // In-app alert toast
            if (onNotifyInApp) {
              onNotifyInApp({
                type: "warning",
                title: isJustNow ? "Task Due Now" : "Task Past Due",
                message: `${title}`,
                taskId: task.id,
              });
            }
          }
        }
      }
    });

    // Dispatch background web push for subscribed mobile devices (via Apple APNs)
    if (typeof window !== "undefined" && tasks.length > 0) {
      fetch("/api/push/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks }),
      }).catch(() => {});
    }
  }, [tasks, settings, isAlreadyNotified, markNotified, onNotifyInApp]);

  // Set up intervals and visibility listeners
  useEffect(() => {
    checkUpcomingReminders();

    // Check every 15 seconds
    const interval = setInterval(checkUpcomingReminders, 15000);

    // Also check immediately when user switches tabs or focuses window back to Margin
    const handleWakeup = () => {
      setPermission(getNotificationPermission());
      checkUpcomingReminders();
    };

    document.addEventListener("visibilitychange", handleWakeup);
    window.addEventListener("focus", handleWakeup);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleWakeup);
      window.removeEventListener("focus", handleWakeup);
    };
  }, [checkUpcomingReminders]);

  const requestPermission = useCallback(async () => {
    const res = await requestNotificationPermission();
    setPermission(res);
    return res;
  }, []);

  const testNotification = useCallback(async () => {
    const res = await dispatchTestNotification();
    setPermission(res.permission);
    return res;
  }, []);

  return {
    isSupported: isNotificationSupported(),
    permission,
    requestPermission,
    testNotification,
  };
}
