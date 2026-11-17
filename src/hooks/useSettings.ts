"use client";

import { useState, useEffect, useCallback } from "react";
import { UserSettings, GoogleCalendarItem, CanvasSyncResult, Task } from "@/lib/types";
import { DEFAULT_SETTINGS, getLocalSettings, saveLocalSettings } from "@/lib/storage/localStore";

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSyncingCanvas, setIsSyncingCanvas] = useState(false);
  const [calendars, setCalendars] = useState<GoogleCalendarItem[]>([]);
  const [isLoadingCalendars, setIsLoadingCalendars] = useState(false);

  // Load settings on mount
  useEffect(() => {
    const loaded = getLocalSettings();
    setSettings(loaded);
    setIsLoaded(true);

    // If Google is connected, fetch calendars
    if (loaded.google_access_token || loaded.google_refresh_token) {
      loadCalendars(loaded);
    }
  }, []);

  const updateSettings = useCallback((updates: Partial<UserSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...updates };
      saveLocalSettings(next);
      return next;
    });
  }, []);

  const loadCalendars = async (currentSettings?: UserSettings) => {
    const s = currentSettings || settings;
    if (!s.google_access_token && !s.google_refresh_token) return;

    setIsLoadingCalendars(true);
    try {
      const res = await fetch("/api/google/calendars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken: s.google_access_token,
          refreshToken: s.google_refresh_token,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.calendars) {
          setCalendars(data.calendars);
        }
      }
    } catch (err) {
      console.error("Failed to load Google calendars:", err);
    } finally {
      setIsLoadingCalendars(false);
    }
  };

  const syncCanvasFeed = async (
    urlToSync: string,
    existingTasks: Task[]
  ): Promise<CanvasSyncResult> => {
    setIsSyncingCanvas(true);
    try {
      const res = await fetch("/api/canvas/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          icsUrl: urlToSync,
          existingTasks,
          defaultReminderMinutes: settings.default_reminder_lead_time_minutes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          importedCount: 0,
          updatedCount: 0,
          totalFound: 0,
          syncedAt: new Date().toISOString(),
          error: data.error || "Failed to sync Canvas feed",
        };
      }

      // Update settings with last synced timestamp and URL
      updateSettings({
        canvas_ics_url: urlToSync,
        canvas_last_synced_at: data.syncedAt,
      });

      return {
        success: true,
        importedCount: data.importedCount,
        updatedCount: data.updatedCount,
        totalFound: data.totalFound,
        syncedAt: data.syncedAt,
        tasks: data.tasks,
      };
    } catch (err: any) {
      return {
        success: false,
        importedCount: 0,
        updatedCount: 0,
        totalFound: 0,
        syncedAt: new Date().toISOString(),
        error: err?.message || "Network error syncing Canvas",
      };
    } finally {
      setIsSyncingCanvas(false);
    }
  };

  const disconnectGoogle = async () => {
    try {
      await fetch("/api/google/disconnect", { method: "POST" });
    } catch (e) {
      // Ignore disconnect network errors
    }

    updateSettings({
      google_access_token: null,
      google_refresh_token: null,
      google_token_expiry: null,
      google_user_email: null,
      google_auto_push_enabled: false,
    });
    setCalendars([]);
  };

  return {
    settings,
    isLoaded,
    isSyncingCanvas,
    calendars,
    isLoadingCalendars,
    updateSettings,
    syncCanvasFeed,
    loadCalendars,
    disconnectGoogle,
  };
}
