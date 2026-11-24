"use client";

import React, { useState, useEffect } from "react";
import { UserSettings, GoogleCalendarItem } from "@/lib/types";
import {
  X,
  Clock,
  BookOpen,
  Calendar,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Moon,
  Sun,
  Smartphone,
  Share,
  Download,
  Bell,
  Volume2,
  Sparkles,
  Cloud,
  CloudOff,
} from "lucide-react";
import { format } from "date-fns";
import {
  isSupabaseConfigured,
  getSupabaseConfigDetails,
  setCustomSupabaseCredentials,
} from "@/lib/supabase/client";
import {
  getNotificationPermission,
  requestNotificationPermission,
  dispatchTestNotification,
  NotificationPermissionStatus,
} from "@/lib/notifications";
import {
  isPushNotificationSupported,
  getPushSubscriptionStatus,
  registerPushSubscription,
  sendTestPush,
} from "@/lib/pushClient";

interface Props {
  isOpen: boolean;
  settings: UserSettings;
  calendars: GoogleCalendarItem[];
  isLoadingCalendars: boolean;
  isSyncingCanvas: boolean;
  onClose: () => void;
  onUpdateSettings: (updates: Partial<UserSettings>) => void;
  onSyncCanvas: (icsUrl: string) => Promise<any>;
  onDisconnectGoogle: () => Promise<void>;
  onBatchPushGCal: () => Promise<any>;
  theme: "dark" | "light" | "system";
  onSetTheme: (t: "dark" | "light" | "system") => void;
  isCloudSyncing?: boolean;
  cloudSyncError?: string | null;
  onSyncCloud?: () => Promise<void> | void;
}

export function SettingsDrawer({
  isOpen,
  settings,
  isSyncingCanvas,
  onClose,
  onUpdateSettings,
  onSyncCanvas,
  theme,
  onSetTheme,
  isCloudSyncing,
  cloudSyncError,
  onSyncCloud,
}: Props) {
  const [canvasUrlInput, setCanvasUrlInput] = useState(settings.canvas_ics_url || "");
  const [showCanvasHelp, setShowCanvasHelp] = useState(false);
  const [customReminderMins, setCustomReminderMins] = useState<string>("");
  const [isCustomReminder, setIsCustomReminder] = useState(false);
  const [customHorizonDays, setCustomHorizonDays] = useState<string>("");
  const [isCustomHorizon, setIsCustomHorizon] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIos, setIsIos] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermissionStatus>("default");
  const [notificationFeedback, setNotificationFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const isIOS =
    typeof navigator !== "undefined" &&
    /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isStandalone =
    typeof window !== "undefined" &&
    (window.matchMedia("(display-mode: standalone)").matches ||
      Boolean((window.navigator as any).standalone));

  const [isPushSubscribed, setIsPushSubscribed] = useState(false);
  const [isPushLoading, setIsPushLoading] = useState(false);

  useEffect(() => {
    if (isOpen && typeof window !== "undefined") {
      getPushSubscriptionStatus().then((status) => {
        setIsPushSubscribed(status.isSubscribed);
      });
    }
  }, [isOpen]);

  const handleEnablePush = async () => {
    setIsPushLoading(true);
    setNotificationFeedback(null);
    try {
      const res = await registerPushSubscription();
      if (res.success) {
        setIsPushSubscribed(true);
        setNotificationPermission("granted");
        onUpdateSettings({ notifications_enabled: true });
        setNotificationFeedback({
          type: "success",
          message: "iPhone Lock Screen Push Notifications enabled via Apple APNs! 🎉",
        });
      } else {
        setNotificationFeedback({
          type: "error",
          message: res.error || "Failed to enable push notifications.",
        });
      }
    } finally {
      setIsPushLoading(false);
    }
  };

  const handleTestPush = async () => {
    setIsPushLoading(true);
    setNotificationFeedback(null);
    try {
      const res = await sendTestPush();
      if (res.success) {
        setNotificationFeedback({
          type: "success",
          message: "Push notification sent! Check your phone's screen/lock screen right now 🔔",
        });
      } else {
        setNotificationFeedback({
          type: "error",
          message: res.error || "Failed to send test push notification.",
        });
      }
    } finally {
      setIsPushLoading(false);
    }
  };

  const [supabaseConfig, setSupabaseConfig] = useState(getSupabaseConfigDetails());
  const [customSupabaseUrl, setCustomSupabaseUrl] = useState("");
  const [customSupabaseKey, setCustomSupabaseKey] = useState("");

  useEffect(() => {
    if (isOpen) {
      setSupabaseConfig(getSupabaseConfigDetails());
    }
  }, [isOpen]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setNotificationPermission(getNotificationPermission());
    }
  }, [isOpen]);

  const handleEnableNotifications = async () => {
    const res = await requestNotificationPermission();
    setNotificationPermission(res);
    if (res === "granted") {
      onUpdateSettings({ notifications_enabled: true });
      setNotificationFeedback({
        type: "success",
        message:
          "Notifications enabled! You will now receive timely alerts before tasks are due.",
      });
    } else if (res === "denied") {
      setNotificationFeedback({
        type: "error",
        message:
          "Notifications are blocked in your browser. Click the lock/settings icon in your address bar to allow them.",
      });
    }
  };

  const handleTestNotification = async () => {
    setNotificationFeedback(null);
    const res = await dispatchTestNotification();
    setNotificationPermission(res.permission);
    if (res.success) {
      setNotificationFeedback({
        type: "success",
        message: "Test notification and chime dispatched successfully!",
      });
    } else {
      setNotificationFeedback({
        type: "error",
        message: res.error || "Failed to trigger notification.",
      });
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setIsInstalled(standalone);

    const iosCheck =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIos(iosCheck);

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!isOpen) return null;

  const reminderPresets = [
    { label: "At due time", value: 0 },
    { label: "15m before", value: 15 },
    { label: "1h before", value: 60 },
    { label: "3h before", value: 180 },
    { label: "1d before", value: 1440 },
  ];

  const lookaheadPresets = [
    { label: "Today only", value: 0 },
    { label: "+ 1 Day", value: 1 },
    { label: "+ 2 Days", value: 2 },
    { label: "+ 3 Days (Default)", value: 3 },
    { label: "+ 5 Days", value: 5 },
    { label: "+ 7 Days (Week)", value: 7 },
  ];

  const isCustomReminderActive =
    isCustomReminder ||
    !reminderPresets.some(
      (opt) => opt.value === settings.default_reminder_lead_time_minutes
    );

  const isCustomHorizonActive =
    isCustomHorizon ||
    !lookaheadPresets.some(
      (opt) => opt.value === (settings.today_view_lookahead_days ?? 3)
    );

  const handleReminderChange = (val: number) => {
    setIsCustomReminder(false);
    onUpdateSettings({ default_reminder_lead_time_minutes: val });
  };

  const handleCustomReminderSubmit = () => {
    const mins = parseInt(customReminderMins, 10);
    if (!isNaN(mins) && mins >= 0) {
      onUpdateSettings({ default_reminder_lead_time_minutes: mins });
      setIsCustomReminder(false);
      setCustomReminderMins("");
    }
  };

  const handleHorizonChange = (val: number) => {
    setIsCustomHorizon(false);
    onUpdateSettings({ today_view_lookahead_days: val });
  };

  const handleCustomHorizonSubmit = () => {
    const days = parseInt(customHorizonDays, 10);
    if (!isNaN(days) && days >= 0 && days <= 365) {
      onUpdateSettings({ today_view_lookahead_days: days });
      setIsCustomHorizon(false);
      setCustomHorizonDays("");
    }
  };

  const handleCanvasSyncClick = async () => {
    if (!canvasUrlInput.trim()) {
      setSyncFeedback({
        type: "error",
        message: "Please enter your Canvas Calendar feed (.ics) URL first.",
      });
      return;
    }

    setSyncFeedback(null);
    const result = await onSyncCanvas(canvasUrlInput.trim());
    if (result.success) {
      setSyncFeedback({
        type: "success",
        message: `Synced: ${result.importedCount} new, ${result.updatedCount} updated (${result.totalFound} total).`,
      });
    } else {
      setSyncFeedback({
        type: "error",
        message: result.error || "Failed to sync Canvas feed.",
      });
    }
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setIsInstalled(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 w-full max-w-md h-full flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-right duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200/80 dark:border-zinc-800/80 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Settings
              </h2>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/40">
                v2.5
              </span>
            </div>
            <p className="text-xs text-zinc-400">Margin preferences & feeds</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
          {/* SECTION 1: Default Reminder Lead Time */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 text-zinc-900 dark:text-zinc-100 font-medium">
              <Clock className="w-3.5 h-3.5 opacity-60" />
              <span>Default Reminder Lead Time</span>
            </div>
            <p className="text-zinc-400 leading-relaxed">
              New manual and Canvas tasks inherit this reminder time automatically.
            </p>

            <div className="grid grid-cols-3 gap-1.5">
              {reminderPresets.map((opt) => {
                const isSelected =
                  !isCustomReminderActive &&
                  settings.default_reminder_lead_time_minutes === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleReminderChange(opt.value)}
                    className={`py-1.5 px-2 text-xs rounded-lg border transition ${
                      isSelected
                        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold border-transparent"
                        : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => {
                  setIsCustomReminder(true);
                  setCustomReminderMins(String(settings.default_reminder_lead_time_minutes));
                }}
                className={`py-1.5 px-2 text-xs rounded-lg border transition ${
                  isCustomReminderActive
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold border-transparent"
                    : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                Custom...
              </button>
            </div>

            {isCustomReminderActive && (
              <div className="flex items-center gap-2 pt-1 animate-in fade-in duration-100">
                <input
                  type="number"
                  min="0"
                  max="10080"
                  placeholder="Minutes before due"
                  value={customReminderMins}
                  onChange={(e) => setCustomReminderMins(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100"
                />
                <button
                  type="button"
                  onClick={handleCustomReminderSubmit}
                  className="px-3 py-1.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-medium rounded-lg"
                >
                  Set
                </button>
              </div>
            )}
          </div>

          <hr className="border-zinc-200/80 dark:border-zinc-800/80" />

          {/* SECTION: Today View Horizon */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-zinc-900 dark:text-zinc-100 font-medium">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                <span>Today View Horizon</span>
              </div>
              <span className="text-[11px] font-mono text-zinc-400">
                {(settings.today_view_lookahead_days ?? 3) === 0
                  ? "Today only"
                  : `+${settings.today_view_lookahead_days ?? 3} days`}
              </span>
            </div>
            <p className="text-zinc-400 leading-relaxed text-[11px]">
              Choose how many upcoming days appear in your Today view for a rolling radar of upcoming deadlines.
            </p>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
              {lookaheadPresets.map((opt) => {
                const currentVal = settings.today_view_lookahead_days ?? 3;
                const isSelected = !isCustomHorizonActive && currentVal === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleHorizonChange(opt.value)}
                    className={`py-1.5 px-2 text-xs rounded-lg border transition ${
                      isSelected
                        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold border-transparent"
                        : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => {
                  setIsCustomHorizon(true);
                  setCustomHorizonDays(String(settings.today_view_lookahead_days ?? 3));
                }}
                className={`py-1.5 px-2 text-xs rounded-lg border transition ${
                  isCustomHorizonActive
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold border-transparent"
                    : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                Custom...
              </button>
            </div>

            {isCustomHorizonActive && (
              <div className="flex items-center gap-2 pt-1 animate-in fade-in duration-100">
                <input
                  type="number"
                  min="0"
                  max="365"
                  placeholder="Number of days (e.g. 4, 10, 14)"
                  value={customHorizonDays}
                  onChange={(e) => setCustomHorizonDays(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleCustomHorizonSubmit}
                  className="px-3 py-1.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-medium rounded-lg"
                >
                  Set
                </button>
              </div>
            )}
          </div>

          <hr className="border-zinc-200/80 dark:border-zinc-800/80" />

          {/* SECTION: Device Notifications & Audio Chimes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-zinc-900 dark:text-zinc-100 font-medium">
                <Bell className="w-3.5 h-3.5 text-blue-500" />
                <span>Device Notifications & Audio</span>
              </div>

              {notificationPermission === "granted" ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                  Allowed ✅
                </span>
              ) : notificationPermission === "denied" ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400">
                  Blocked 🚫
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                  Not Enabled
                </span>
              )}
            </div>

            <p className="text-zinc-400 leading-relaxed text-[11px]">
              Receive native device notifications and chimes when assignments or habits are nearing their due time, even if Margin is in the background.
            </p>

            {/* Phone Lock Screen Push via Apple APNs */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-50/50 to-indigo-50/30 dark:from-blue-950/20 dark:to-indigo-950/10 border border-blue-200/80 dark:border-blue-900/40 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    Phone Lock Screen Push (Apple APNs)
                  </span>
                </div>
                {isPushSubscribed ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                    Connected 🟢
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                    Not Active
                  </span>
                )}
              </div>

              <p className="text-zinc-500 dark:text-zinc-400 text-[11px] leading-relaxed">
                Sends native notifications directly to your iPhone Lock Screen and Apple Watch when assignments or habits are nearing their deadline, even when your phone is locked and Margin is closed.
              </p>

              {isIOS && !isStandalone && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-[11px] space-y-1">
                  <span className="font-semibold">📲 Required on iPhone:</span>
                  <p className="leading-relaxed">
                    Open Margin in Safari, tap <strong>Share</strong> (square with arrow up) ➔ <strong>&ldquo;Add to Home Screen&rdquo;</strong>, then open the installed Margin app from your home screen to activate push notifications.
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-stretch gap-2 pt-1">
                {!isPushSubscribed ? (
                  <button
                    type="button"
                    onClick={handleEnablePush}
                    disabled={isPushLoading}
                    className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-sm disabled:opacity-50"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>{isPushLoading ? "Enabling..." : "Enable iPhone Lock Screen Push"}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleTestPush}
                    disabled={isPushLoading}
                    className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-sm disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>{isPushLoading ? "Sending..." : "Send Test Push to Phone 📲"}</span>
                  </button>
                )}
              </div>

              <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60 space-y-1.5">
                <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>24/7 Cloud Trigger (When Screen is Off)</span>
                </span>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Apple APNs push notifications require a cloud cron to trigger alerts when your phone is turned off or Margin is closed. Run this free 1-minute cron in your Supabase SQL Editor:
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const sql = `-- Run this once in your Supabase SQL Editor for 24/7 lock-screen notifications:
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.schedule(
    'margin-push-reminders',
    '* * * * *',
    $$
    SELECT net.http_post(
        url := 'https://margin-vilh.vercel.app/api/push/cron',
        headers := '{"Content-Type": "application/json"}'::jsonb,
        body := '{}'::jsonb
    );
    $$
);`;
                    navigator.clipboard.writeText(sql);
                    alert("24/7 Supabase Cron SQL copied to clipboard! Paste and run it in your Supabase SQL Editor.");
                  }}
                  className="w-full py-1.5 px-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-[11px] font-medium rounded-lg flex items-center justify-center gap-1.5 transition border border-zinc-200 dark:border-zinc-700"
                >
                  <span>📋 Copy 24/7 Supabase Cron SQL</span>
                </button>
              </div>
            </div>

            {/* Laptop / Browser Audio & Banner */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Laptop / Desktop Notifications
                </span>
                <span className="text-[10px] text-zinc-400">
                  {notificationPermission === "granted" ? "Allowed" : "Not Allowed"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {notificationPermission !== "granted" && (
                  <button
                    type="button"
                    onClick={handleEnableNotifications}
                    className="flex-1 py-2 px-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>Allow Browser Notifications</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleTestNotification}
                  className="flex-1 py-2 px-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition border border-zinc-200 dark:border-zinc-700"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Test Laptop Chime & Banner</span>
                </button>
              </div>
            </div>

            {notificationFeedback && (
              <div
                className={`p-2.5 rounded-lg border text-xs flex items-start gap-2 ${
                  notificationFeedback.type === "success"
                    ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300"
                    : "bg-rose-50/50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900 text-rose-800 dark:text-rose-300"
                }`}
              >
                {notificationFeedback.type === "success" ? (
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                )}
                <span className="leading-tight">{notificationFeedback.message}</span>
              </div>
            )}

            {/* Sub-options: Chime sound & Due-time alert */}
            <div className="space-y-1.5 pt-1">
              <label className="flex items-center justify-between p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800/60 cursor-pointer">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="text-zinc-700 dark:text-zinc-300 font-medium">Audio chime on reminder</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notification_sound_enabled !== false}
                  onChange={(e) =>
                    onUpdateSettings({ notification_sound_enabled: e.target.checked })
                  }
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800/60 cursor-pointer">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="text-zinc-700 dark:text-zinc-300 font-medium">Alert at exact due time</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notify_at_due_time !== false}
                  onChange={(e) =>
                    onUpdateSettings({ notify_at_due_time: e.target.checked })
                  }
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
              </label>
            </div>
          </div>

          <hr className="border-zinc-200/80 dark:border-zinc-800/80" />

          {/* SECTION 2: Canvas LMS Integration */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-zinc-900 dark:text-zinc-100 font-medium">
                <BookOpen className="w-3.5 h-3.5 opacity-60" />
                <span>Canvas LMS Calendar Feed</span>
              </div>

              <button
                type="button"
                onClick={() => setShowCanvasHelp(!showCanvasHelp)}
                className="text-[11px] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 flex items-center gap-1"
              >
                <HelpCircle className="w-3 h-3" />
                <span>How to find</span>
              </button>
            </div>

            {showCanvasHelp && (
              <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 text-zinc-600 dark:text-zinc-300 space-y-1">
                <p className="font-medium text-zinc-800 dark:text-zinc-200">Instructions:</p>
                <ol className="list-decimal list-inside space-y-0.5 opacity-80">
                  <li>Log in to Canvas.</li>
                  <li>Click <strong>Calendar</strong> on the left.</li>
                  <li>Click <strong>Calendar Feed</strong> on the bottom/sidebar.</li>
                  <li>Copy and paste the <code className="font-mono">.ics</code> link below.</li>
                </ol>
              </div>
            )}

            <div>
              <input
                type="url"
                value={canvasUrlInput}
                onChange={(e) => {
                  setCanvasUrlInput(e.target.value);
                  onUpdateSettings({ canvas_ics_url: e.target.value });
                }}
                placeholder="https://canvas.../feeds/calendars/user_...ics"
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-lg text-zinc-900 dark:text-zinc-100 text-xs font-mono focus:outline-none focus:border-zinc-400"
              />
            </div>

            {settings.canvas_last_synced_at && (
              <p className="text-[11px] text-zinc-400">
                Last synced: {format(new Date(settings.canvas_last_synced_at), "MMM d @ h:mm a")}
              </p>
            )}

            {syncFeedback && (
              <div
                className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 ${
                  syncFeedback.type === "success"
                    ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300"
                    : "bg-rose-50/50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900 text-rose-800 dark:text-rose-300"
                }`}
              >
                {syncFeedback.type === "success" ? (
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                )}
                <span>{syncFeedback.message}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleCanvasSyncClick}
              disabled={isSyncingCanvas}
              className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 disabled:opacity-40 text-white dark:text-zinc-900 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition"
            >
              <RefreshCw
                className={`w-3 h-3 ${isSyncingCanvas ? "animate-spin" : ""}`}
              />
              <span>{isSyncingCanvas ? "Syncing..." : "Sync Canvas Now"}</span>
            </button>

            {/* Virtual classes filter toggle */}
            <label className="flex items-start gap-2.5 pt-1 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={settings.hide_virtual_classes !== false}
                onChange={(e) =>
                  onUpdateSettings({ hide_virtual_classes: e.target.checked })
                }
                className="mt-0.5 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="font-medium text-zinc-800 dark:text-zinc-200">
                  Hide Virtual Classes &amp; Zoom Meetings
                </span>
                <p className="text-[11px] text-zinc-400">
                  Automatically hide recurring lecture blocks and Zoom links from your daily to-do list.
                </p>
              </div>
            </label>

            {/* Open in Canvas App Toggle on mobile */}
            <label className="flex items-start gap-2.5 pt-1 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={settings.canvas_open_in_app !== false}
                onChange={(e) =>
                  onUpdateSettings({ canvas_open_in_app: e.target.checked })
                }
                className="mt-0.5 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="font-medium text-zinc-800 dark:text-zinc-200">
                  Open in Canvas Student App (Mobile)
                </span>
                <p className="text-[11px] text-zinc-400">
                  Launches assignment links directly in the official Canvas Student app on mobile instead of opening in Safari.
                </p>
              </div>
            </label>
          </div>

          <hr className="border-zinc-200/80 dark:border-zinc-800/80" />

          {/* SECTION: Cloud Sync & Cross-Device Sync (Supabase) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-zinc-900 dark:text-zinc-100 font-medium">
                <Cloud className="w-3.5 h-3.5 text-blue-500" />
                <span>Cross-Device Sync (Phone & Laptop)</span>
              </div>
              {supabaseConfig.isConfigured ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Connected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40">
                  Local Offline
                </span>
              )}
            </div>

            <p className="text-zinc-400 leading-relaxed text-xs">
              Margin automatically syncs all tasks, categories, and calendar items in real time between your phone and laptop using Supabase.
            </p>

            {/* Status & Sync Now Card */}
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-700/80 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="text-zinc-600 dark:text-zinc-400 block font-medium">
                    {supabaseConfig.isConfigured ? "Supabase Cloud" : "Sync Status"}
                  </span>
                  <span className="text-[11px] text-zinc-500 font-mono truncate max-w-[200px] block">
                    {supabaseConfig.url || "No cloud credentials detected"}
                  </span>
                </div>

                <button
                  type="button"
                  disabled={isCloudSyncing || !supabaseConfig.isConfigured}
                  onClick={async () => {
                    if (onSyncCloud) {
                      await onSyncCloud();
                      alert("Tasks synced successfully with cloud!");
                    }
                  }}
                  className="px-3 py-1.5 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-40 text-white dark:text-zinc-900 font-semibold rounded-lg text-xs transition flex items-center gap-1.5 shadow-sm"
                >
                  <RefreshCw className={`w-3 h-3 ${isCloudSyncing ? "animate-spin" : ""}`} />
                  <span>{isCloudSyncing ? "Syncing..." : "Sync Now"}</span>
                </button>
              </div>

              {cloudSyncError && (
                <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-[11px] text-rose-700 dark:text-rose-300">
                  Sync error: {cloudSyncError}
                </div>
              )}

              {/* Manual setup if not configured via env vars */}
              {!supabaseConfig.isConfigured && (
                <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-700/60 space-y-2">
                  <p className="text-[11px] text-amber-700 dark:text-amber-300">
                    💡 If running locally on your laptop, paste your Supabase URL & Anon Key to connect:
                  </p>
                  <input
                    type="text"
                    placeholder="https://xyz.supabase.co"
                    value={customSupabaseUrl}
                    onChange={(e) => setCustomSupabaseUrl(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  />
                  <input
                    type="password"
                    placeholder="anon public key (eyJhbGci...)"
                    value={customSupabaseKey}
                    onChange={(e) => setCustomSupabaseKey(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customSupabaseUrl.trim() && customSupabaseKey.trim()) {
                        setCustomSupabaseCredentials(customSupabaseUrl, customSupabaseKey);
                        window.location.reload();
                      }
                    }}
                    className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg transition"
                  >
                    Save & Connect Supabase
                  </button>
                </div>
              )}
            </div>

            {/* Migration SQL copy for user */}
            <div className="pt-0.5">
              <button
                type="button"
                onClick={() => {
                  const sql = `-- Run this once in your Supabase SQL Editor if your remote database was created previously:
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add modern columns to tasks table
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'personal';
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS is_lecture_or_meeting BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS canvas_uid TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS recurrence JSONB;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS recurring_parent_id TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS google_event_id TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS google_calendar_id TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS is_pushed_to_google BOOLEAN NOT NULL DEFAULT FALSE;

-- Ensure Realtime broadcast is enabled on tasks table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' AND tablename = 'tasks'
        ) THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
        END IF;
    END IF;
END $$;`;
                  navigator.clipboard.writeText(sql);
                  alert("Supabase SQL migration snippet copied to clipboard! Paste it into your Supabase SQL Editor if your remote table needs column updates.");
                }}
                className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 font-medium"
              >
                <span>📋 Copy Supabase SQL Migration (Fix schema / realtime)</span>
              </button>
            </div>
          </div>

          <hr className="border-zinc-200/80 dark:border-zinc-800/80" />

          {/* SECTION 3: Calendar & Lock-Screen Alarms (Zero Duplicates) */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-zinc-900 dark:text-zinc-100 font-medium">
              <Calendar className="w-3.5 h-3.5 opacity-60" />
              <span>Apple &amp; Google Calendar Alarms</span>
            </div>

            <p className="text-zinc-500 dark:text-zinc-400 text-xs leading-relaxed">
              For 100% reliable hardware alarms on your iPhone lock screen (even when your phone is locked, off, or offline), sync with your phone&apos;s native calendar.
            </p>

            {/* Skip Canvas assignments toggle to avoid duplicates */}
            <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800/60 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.google_skip_canvas_tasks !== false}
                onChange={(e) =>
                  onUpdateSettings({ google_skip_canvas_tasks: e.target.checked })
                }
                className="mt-0.5 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                  Skip Canvas assignments (Avoid Duplicates)
                </span>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-tight">
                  Recommended if Canvas is already linked to your Google Calendar. Only your manual tasks and personal to-dos will be synced.
                </p>
              </div>
            </label>

            {/* 1-Tap Apple Calendar Subscription */}
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 space-y-2">
              <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5" />
                <span>1-Tap Apple Calendar (iPhone Hardware Alarms)</span>
              </span>
              <p className="text-[11px] text-blue-800/80 dark:text-blue-200/80 leading-relaxed">
                Subscribes your iPhone Calendar to Margin with native alarms (<code className="font-mono">VALARM</code>). Rings your lock screen 15m before tasks without needing any app open.
              </p>
              <a
                href={
                  typeof window !== "undefined"
                    ? `webcal://${window.location.host}/api/calendar.ics${settings.google_skip_canvas_tasks !== false ? "?excludeCanvas=true" : ""}`
                    : "#"
                }
                className="inline-flex w-full py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold items-center justify-center gap-1.5 transition text-center"
              >
                <span>📲 Subscribe in iPhone Apple Calendar</span>
              </a>
            </div>

            {/* Google Calendar Feed */}
            <div className="space-y-1.5 pt-1">
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Google Calendar Feed URL
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={
                    typeof window !== "undefined"
                      ? `${window.location.origin}/api/calendar.ics${settings.google_skip_canvas_tasks !== false ? "?excludeCanvas=true" : ""}`
                      : "/api/calendar.ics"
                  }
                  className="flex-1 px-2.5 py-1.5 text-xs font-mono bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-lg text-zinc-700 dark:text-zinc-300 select-all"
                />
                <button
                  type="button"
                  onClick={() => {
                    const url =
                      typeof window !== "undefined"
                        ? `${window.location.origin}/api/calendar.ics${settings.google_skip_canvas_tasks !== false ? "?excludeCanvas=true" : ""}`
                        : "/api/calendar.ics";
                    navigator.clipboard.writeText(url);
                    alert("Calendar Feed URL copied to clipboard!");
                  }}
                  className="px-2.5 py-1.5 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-800 dark:text-zinc-100 font-medium rounded-lg text-xs transition"
                >
                  Copy
                </button>
              </div>
              <p className="text-[10px] text-zinc-400">
                In Google Calendar: click <strong>+ next to &ldquo;Other calendars&rdquo;</strong> ➔ <strong>From URL</strong> ➔ paste this link.
              </p>
            </div>
          </div>

          <hr className="border-zinc-200/80 dark:border-zinc-800/80" />

          {/* SECTION 4: Install PWA (Moved from main screen) */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 text-zinc-900 dark:text-zinc-100 font-medium">
              <Smartphone className="w-3.5 h-3.5 opacity-60" />
              <span>Mobile App Installation</span>
            </div>

            {isInstalled ? (
              <p className="text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Installed as standalone Home Screen app</span>
              </p>
            ) : deferredPrompt ? (
              <button
                type="button"
                onClick={handleInstallClick}
                className="w-full py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-medium rounded-lg flex items-center justify-center gap-2 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install Margin to Home Screen</span>
              </button>
            ) : isIos ? (
              <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 text-zinc-500 dark:text-zinc-400 text-xs leading-relaxed">
                <p>
                  To install on iPhone/iPad: Tap <Share className="w-3 h-3 inline mx-0.5 text-blue-500" /> in Safari, then select <strong>"Add to Home Screen"</strong>.
                </p>
              </div>
            ) : (
              <p className="text-zinc-400 text-xs">
                Open in Safari (iOS) or Chrome (Android) to install directly to your device.
              </p>
            )}
          </div>

          <hr className="border-zinc-200/80 dark:border-zinc-800/80" />

          {/* SECTION 5: Theme */}
          <div className="space-y-2.5">
            <div className="text-zinc-900 dark:text-zinc-100 font-medium">
              Appearance
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => onSetTheme("dark")}
                className={`py-1.5 px-3 rounded-lg border flex items-center justify-center gap-1.5 transition ${
                  theme === "dark"
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold border-transparent"
                    : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400"
                }`}
              >
                <Moon className="w-3 h-3" />
                <span>Dark</span>
              </button>
              <button
                type="button"
                onClick={() => onSetTheme("light")}
                className={`py-1.5 px-3 rounded-lg border flex items-center justify-center gap-1.5 transition ${
                  theme === "light"
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold border-transparent"
                    : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400"
                }`}
              >
                <Sun className="w-3 h-3" />
                <span>Light</span>
              </button>
              <button
                type="button"
                onClick={() => onSetTheme("system")}
                className={`py-1.5 px-3 rounded-lg border flex items-center justify-center gap-1.5 transition ${
                  theme === "system"
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold border-transparent"
                    : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400"
                }`}
              >
                <span>System</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/50 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={async () => {
              if (typeof window !== "undefined") {
                try {
                  if ("caches" in window) {
                    const keys = await caches.keys();
                    await Promise.all(keys.map((k) => caches.delete(k)));
                  }
                  if ("serviceWorker" in navigator) {
                    const regs = await navigator.serviceWorker.getRegistrations();
                    for (const r of regs) await r.unregister();
                  }
                } catch {}
                window.location.reload();
              }
            }}
            className="text-[11px] text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 transition flex items-center gap-1.5 py-1.5 px-2.5 rounded-xl hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60"
            title="Purge cached assets and reload application"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Force Reload & Purge Cache</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-xs font-semibold rounded-xl transition shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
