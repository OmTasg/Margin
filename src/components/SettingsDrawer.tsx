"use client";

import React, { useState } from "react";
import { UserSettings, GoogleCalendarItem } from "@/lib/types";
import {
  X,
  Clock,
  BookOpen,
  Calendar,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Moon,
  Sun,
  ShieldCheck,
  Send,
} from "lucide-react";
import { format } from "date-fns";

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
  calendars,
  isLoadingCalendars,
  isSyncingCanvas,
  onClose,
  onUpdateSettings,
  onSyncCanvas,
  onDisconnectGoogle,
  onBatchPushGCal,
  theme,
  onSetTheme,
}: Props) {
  const [canvasUrlInput, setCanvasUrlInput] = useState(settings.canvas_ics_url || "");
  const [showCanvasHelp, setShowCanvasHelp] = useState(false);
  const [customReminderMins, setCustomReminderMins] = useState<string>("");
  const [isCustomReminder, setIsCustomReminder] = useState(false);
  const [isBatchPushing, setIsBatchPushing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  if (!isOpen) return null;

  const isGoogleConnected = Boolean(
    settings.google_access_token || settings.google_refresh_token
  );

  const reminderPresets = [
    { label: "At due date", value: 0 },
    { label: "15 mins before", value: 15 },
    { label: "1 hour before", value: 60 },
    { label: "3 hours before", value: 180 },
    { label: "1 day before", value: 1440 },
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
        message: `Synced! ${result.importedCount} new, ${result.updatedCount} updated (${result.totalFound} total).`,
      });
    } else {
      setSyncFeedback({
        type: "error",
        message: result.error || "Failed to sync Canvas feed.",
      });
    }
  };

  const handleConnectGoogle = () => {
    window.location.href = "/api/auth/google";
  };

  const handleBatchPushClick = async () => {
    setIsBatchPushing(true);
    try {
      const res = await onBatchPushGCal();
      alert(`Batch sync finished: ${res.pushed} tasks pushed to Google Calendar (${res.failed} skipped/failed).`);
    } finally {
      setIsBatchPushing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 w-full max-w-lg h-full flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
              Settings & Integrations
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Personalize reminders, Canvas LMS, and Google Calendar
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Drawer Content */}
        <div className="p-6 space-y-7 overflow-y-auto flex-1">
          {/* SECTION 1: Default Reminder Lead Time */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
              <Clock className="w-4 h-4 text-indigo-500" />
              <h3 className="text-sm font-bold uppercase tracking-wider">
                Default Reminder Lead Time
              </h3>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Every new manual or Canvas-scraped task inherits this reminder lead time
              by default, with per-task overrides available.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {reminderPresets.map((opt) => {
                const isSelected =
                  !isCustomReminder &&
                  settings.default_reminder_lead_time_minutes === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleReminderChange(opt.value)}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition ${
                      isSelected
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setIsCustomReminder(true)}
                className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition ${
                  isCustomReminder ||
                  !reminderPresets.some(
                    (p) => p.value === settings.default_reminder_lead_time_minutes
                  )
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                    : "border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                Custom Mins...
              </button>
            </div>

            {isCustomReminder && (
              <div className="flex items-center gap-2 pt-1 animate-in fade-in">
                <input
                  type="number"
                  min="0"
                  max="10080"
                  placeholder="Minutes before due (e.g. 45)"
                  value={customReminderMins}
                  onChange={(e) => setCustomReminderMins(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100"
                />
                <button
                  type="button"
                  onClick={handleCustomReminderSubmit}
                  className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-xl"
                >
                  Set
                </button>
              </div>
            )}
          </div>

          <hr className="border-zinc-200 dark:border-zinc-800" />

          {/* SECTION 2: Canvas LMS Integration */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                <BookOpen className="w-4 h-4 text-rose-500" />
                <h3 className="text-sm font-bold uppercase tracking-wider">
                  Canvas LMS Calendar Feed
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setShowCanvasHelp(!showCanvasHelp)}
                className="text-xs text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 font-medium"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>How to find URL</span>
              </button>
            </div>

            {showCanvasHelp && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-900 dark:text-rose-200 space-y-1.5 animate-in fade-in">
                <p className="font-semibold">How to get your Canvas Calendar feed:</p>
                <ol className="list-decimal list-inside space-y-1 opacity-90">
                  <li>Log in to your school's Canvas account.</li>
                  <li>Click <strong>Calendar</strong> in the left global navigation bar.</li>
                  <li>Scroll to the bottom right and click <strong>Calendar Feed</strong>.</li>
                  <li>Copy the provided URL ending with <code className="font-mono">.ics</code> and paste it below.</li>
                </ol>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">
                Canvas iCal (.ics) Feed URL
              </label>
              <input
                type="url"
                value={canvasUrlInput}
                onChange={(e) => {
                  setCanvasUrlInput(e.target.value);
                  onUpdateSettings({ canvas_ics_url: e.target.value });
                }}
                placeholder="https://canvas.school.edu/feeds/calendars/user_...ics"
                className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 text-xs focus:ring-2 focus:ring-rose-500 font-mono"
              />
            </div>

            {settings.canvas_last_synced_at && (
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Last synced:{" "}
                <strong>
                  {format(new Date(settings.canvas_last_synced_at), "MMM d, yyyy @ h:mm a")}
                </strong>
              </p>
            )}

            {syncFeedback && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  syncFeedback.type === "success"
                    ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 text-emerald-800 dark:text-emerald-300"
                    : "bg-rose-50 dark:bg-rose-950/30 border-rose-300 text-rose-800 dark:text-rose-300"
                }`}
              >
                {syncFeedback.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{syncFeedback.message}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleCanvasSyncClick}
              disabled={isSyncingCanvas}
              className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition active:scale-95"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isSyncingCanvas ? "animate-spin" : ""}`}
              />
              <span>{isSyncingCanvas ? "Fetching & Parsing Feed..." : "Sync Canvas Now"}</span>
            </button>
          </div>

          <hr className="border-zinc-200 dark:border-zinc-800" />

          {/* SECTION 3: Google Calendar Integration */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                <Calendar className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm font-bold uppercase tracking-wider">
                  Google Calendar Two-Way / Push
                </h3>
              </div>

              {isGoogleConnected && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Connected
                </span>
              )}
            </div>

            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Connect Google Calendar to push tasks directly to your personal or school calendar
              with automatic popup reminder overrides.
            </p>

            {isGoogleConnected ? (
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 space-y-3.5">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="text-zinc-500 dark:text-zinc-400">Account: </span>
                    <strong className="text-zinc-900 dark:text-zinc-100">
                      {settings.google_user_email || "Google Account Connected"}
                    </strong>
                  </div>
                  <button
                    type="button"
                    onClick={onDisconnectGoogle}
                    className="text-rose-600 dark:text-rose-400 hover:underline text-xs font-semibold"
                  >
                    Disconnect
                  </button>
                </div>

                {/* Target Calendar Selector */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Target Google Calendar:
                  </label>
                  {isLoadingCalendars ? (
                    <div className="text-xs text-zinc-400 py-1">Loading your calendars...</div>
                  ) : (
                    <select
                      value={settings.google_selected_calendar_id || "primary"}
                      onChange={(e) =>
                        onUpdateSettings({ google_selected_calendar_id: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 font-medium focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="primary">Primary Calendar (Default)</option>
                      {calendars
                        .filter((c) => c.id !== "primary")
                        .map((cal) => (
                          <option key={cal.id} value={cal.id}>
                            {cal.summary} {cal.primary ? "(Primary)" : ""}
                          </option>
                        ))}
                    </select>
                  )}
                </div>

                {/* Auto Push Toggle */}
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                      Auto-Push New Tasks
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Automatically push new manual & Canvas tasks to Google Calendar
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.google_auto_push_enabled}
                    onChange={(e) =>
                      onUpdateSettings({ google_auto_push_enabled: e.target.checked })
                    }
                    className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-zinc-300"
                  />
                </div>

                {/* Batch push button */}
                <button
                  type="button"
                  onClick={handleBatchPushClick}
                  disabled={isBatchPushing}
                  className="w-full py-2 px-3 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-800 dark:text-zinc-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition"
                >
                  <Send className={`w-3.5 h-3.5 ${isBatchPushing ? "animate-pulse" : ""}`} />
                  <span>{isBatchPushing ? "Pushing all..." : "Push All Unsynced Tasks Now"}</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleConnectGoogle}
                className="w-full py-3 px-4 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-750 text-zinc-900 dark:text-zinc-100 text-xs font-bold rounded-xl border border-zinc-300 dark:border-zinc-700 flex items-center justify-center gap-2.5 shadow-sm transition active:scale-95"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Connect Google Calendar via OAuth</span>
              </button>
            )}
          </div>

          <hr className="border-zinc-200 dark:border-zinc-800" />

          {/* SECTION 4: Theme & Appearance */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
              Appearance
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => onSetTheme("dark")}
                className={`py-2 px-3 text-xs font-semibold rounded-xl border flex items-center justify-center gap-1.5 transition ${
                  theme === "dark"
                    ? "bg-zinc-900 text-white border-zinc-700 shadow-sm"
                    : "border-zinc-300 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400"
                }`}
              >
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                <span>Dark</span>
              </button>
              <button
                type="button"
                onClick={() => onSetTheme("light")}
                className={`py-2 px-3 text-xs font-semibold rounded-xl border flex items-center justify-center gap-1.5 transition ${
                  theme === "light"
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                    : "border-zinc-300 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400"
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>Light</span>
              </button>
              <button
                type="button"
                onClick={() => onSetTheme("system")}
                className={`py-2 px-3 text-xs font-semibold rounded-xl border flex items-center justify-center gap-1.5 transition ${
                  theme === "system"
                    ? "bg-zinc-700 text-white border-zinc-600 shadow-sm"
                    : "border-zinc-300 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400"
                }`}
              >
                <span>System</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
