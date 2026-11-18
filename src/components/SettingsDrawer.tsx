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
} from "lucide-react";
import { format } from "date-fns";
import {
  getNotificationPermission,
  requestNotificationPermission,
  dispatchTestNotification,
  NotificationPermissionStatus,
} from "@/lib/notifications";

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
}: Props) {
  const [canvasUrlInput, setCanvasUrlInput] = useState(settings.canvas_ics_url || "");
  const [showCanvasHelp, setShowCanvasHelp] = useState(false);
  const [customReminderMins, setCustomReminderMins] = useState<string>("");
  const [isCustomReminder, setIsCustomReminder] = useState(false);
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
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Settings
            </h2>
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
                  !isCustomReminder &&
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
                onClick={() => setIsCustomReminder(true)}
                className={`py-1.5 px-2 text-xs rounded-lg border transition ${
                  isCustomReminder
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold border-transparent"
                    : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                Custom...
              </button>
            </div>

            {isCustomReminder && (
              <div className="flex items-center gap-2 pt-1">
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

            {/* Notification permission button / actions */}
            <div className="flex items-center gap-2 pt-0.5">
              {notificationPermission !== "granted" ? (
                <button
                  type="button"
                  onClick={handleEnableNotifications}
                  className="flex-1 py-1.5 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-sm"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>Enable Device Notifications</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleTestNotification}
                  className="flex-1 py-1.5 px-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition border border-zinc-200 dark:border-zinc-700"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Send Test Notification & Chime</span>
                </button>
              )}
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

          {/* SECTION 3: Google Calendar Integration */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 text-zinc-900 dark:text-zinc-100 font-medium">
              <Calendar className="w-3.5 h-3.5 opacity-60" />
              <span>Google Calendar Feed</span>
            </div>

            <p className="text-zinc-400 leading-relaxed">
              Subscribe to your Margin tasks directly in Google Calendar:
            </p>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={
                  typeof window !== "undefined"
                    ? `${window.location.origin}/api/calendar.ics`
                    : "/api/calendar.ics"
                }
                className="flex-1 px-2.5 py-1.5 text-xs font-mono bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-lg text-zinc-700 dark:text-zinc-300 select-all"
              />
              <button
                type="button"
                onClick={() => {
                  const url =
                    typeof window !== "undefined"
                      ? `${window.location.origin}/api/calendar.ics`
                      : "/api/calendar.ics";
                  navigator.clipboard.writeText(url);
                  alert("Feed URL copied to clipboard!");
                }}
                className="px-2.5 py-1.5 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-800 dark:text-zinc-100 font-medium rounded-lg transition"
              >
                Copy
              </button>
            </div>
            <p className="text-[11px] text-zinc-400">
              In Google Calendar: click <strong>+ next to "Other calendars"</strong> &gt; <strong>From URL</strong> &gt; paste this link.
            </p>
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
        <div className="p-4 border-t border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/50 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-1.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-xs font-semibold rounded-lg transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
