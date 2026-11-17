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
                  Google Calendar (Zero-Setup)
                </h3>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Ready
              </span>
            </div>

            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              No Google Cloud Console or OAuth keys required! You have two instant ways to view your tasks in Google Calendar:
            </p>

            <div className="space-y-3">
              {/* Method A: 1-Click +GCal Button */}
              <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px]">1</span>
                  <span>1-Click Add Button on Tasks</span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed pl-7">
                  Every task card has a green <strong>"+ GCal"</strong> pill. Tap it anytime to immediately open Google Calendar with title, due time, notes, and Canvas links pre-filled.
                </p>
              </div>

              {/* Method B: Live Calendar Subscription Link */}
              <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[10px]">2</span>
                  <span>Subscribe via iCal Feed URL</span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed pl-7">
                  Subscribe to your tasks in Google Calendar so all your due dates show up automatically:
                </p>
                <div className="pl-7 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={typeof window !== "undefined" ? `${window.location.origin}/api/calendar.ics` : "/api/calendar.ics"}
                      className="flex-1 px-2.5 py-1.5 text-[11px] font-mono bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-700 dark:text-zinc-300 select-all"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const url = typeof window !== "undefined" ? `${window.location.origin}/api/calendar.ics` : "/api/calendar.ics";
                        navigator.clipboard.writeText(url);
                        alert("Calendar feed URL copied to clipboard!");
                      }}
                      className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold rounded-lg transition"
                    >
                      Copy
                    </button>
                  </div>
                  <p className="text-[10px] text-zinc-400">
                    In Google Calendar, click <strong>+ next to "Other calendars"</strong> &gt; <strong>From URL</strong> &gt; paste this link!
                  </p>
                </div>
              </div>
            </div>
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
