"use client";

import React from "react";
import {
  CheckCircle2,
  Calendar,
  RefreshCw,
  Settings,
  Sun,
  Moon,
  Search,
  HelpCircle,
  BookOpen,
} from "lucide-react";
import { UserSettings } from "@/lib/types";

interface Props {
  activeCount: number;
  settings: UserSettings;
  isSyncingCanvas: boolean;
  onSyncCanvas: () => void;
  onOpenSettings: () => void;
  onOpenShortcuts: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  theme: "dark" | "light" | "system";
  onToggleTheme: () => void;
}

export function Header({
  activeCount,
  settings,
  isSyncingCanvas,
  onSyncCanvas,
  onOpenSettings,
  onOpenShortcuts,
  searchQuery,
  onSearchChange,
  theme,
  onToggleTheme,
}: Props) {
  const isGoogleConnected = Boolean(
    settings.google_access_token || settings.google_refresh_token
  );

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-850 safe-top transition-colors">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        {/* Brand & Active Count */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50 leading-none">
                FocusTask
              </h1>
              {activeCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                  {activeCount}
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
              Mobile PWA • Canvas & GCal
            </p>
          </div>
        </div>

        {/* Center / Search bar on desktop */}
        <div className="hidden sm:flex flex-1 max-w-xs mx-2">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search tasks or press /"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          {/* Quick Canvas Sync */}
          {settings.canvas_ics_url ? (
            <button
              onClick={onSyncCanvas}
              disabled={isSyncingCanvas}
              title="Sync Canvas Now"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 active:scale-95 transition"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isSyncingCanvas ? "animate-spin" : ""}`}
              />
              <span className="hidden md:inline">Sync Canvas</span>
            </button>
          ) : (
            <button
              onClick={onOpenSettings}
              title="Add Canvas Feed URL in Settings"
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition"
            >
              <BookOpen className="w-3.5 h-3.5 text-rose-500" />
              <span>Connect Canvas</span>
            </button>
          )}

          {/* Google Calendar status pill */}
          <button
            onClick={onOpenSettings}
            title={
              isGoogleConnected
                ? `Google Calendar Connected (${settings.google_user_email || "Active"})`
                : "Connect Google Calendar in Settings"
            }
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition ${
              isGoogleConnected
                ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40"
                : "bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-current"></span>
            <span className="hidden lg:inline">
              {isGoogleConnected ? "GCal Sync" : "Connect GCal"}
            </span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            aria-label="Toggle theme"
            className="p-2 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg transition"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-500" />
            )}
          </button>

          {/* Keyboard Shortcuts Help */}
          <button
            onClick={onOpenShortcuts}
            aria-label="Keyboard Shortcuts"
            className="hidden md:flex p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg transition"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            aria-label="Settings"
            className="p-2 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg transition relative"
          >
            <Settings className="w-4 h-4" />
            {(!settings.canvas_ics_url || !isGoogleConnected) && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-white dark:ring-zinc-950"></span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Search Input Bar */}
      <div className="sm:hidden px-4 pb-2.5">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>
      </div>
    </header>
  );
}
