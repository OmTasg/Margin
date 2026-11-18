"use client";

import React from "react";
import {
  Calendar,
  RefreshCw,
  Settings,
  Sun,
  Moon,
  Search,
  HelpCircle,
  BookOpen,
  Bell,
} from "lucide-react";
import { UserSettings } from "@/lib/types";
import { NotificationPermissionStatus } from "@/lib/notifications";

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
  notificationPermission?: NotificationPermissionStatus;
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
  notificationPermission,
}: Props) {
  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-zinc-200/60 dark:border-zinc-800/60 safe-top transition-colors">
      <div className="max-w-5xl lg:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-3">
        {/* Brand: Margin (Refined geometric identity) */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center shadow-sm shrink-0">
              <svg className="w-3.5 h-3.5" viewBox="0 0 32 32" fill="none">
                <rect x="5.5" y="7" width="2.5" height="18" rx="1.25" fill="#3b82f6"/>
                <path d="M12 24V8L17.5 16L23 8V24" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" className="text-white dark:text-zinc-900"/>
              </svg>
            </div>
            <div className="flex items-baseline gap-1.5">
              <h1 className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-100 leading-none">
                Margin
              </h1>
              <span className="text-[10px] font-medium tracking-wide text-zinc-400 dark:text-zinc-500 uppercase hidden xs:inline">
                Student
              </span>
            </div>
            {activeCount > 0 && (
              <span className="text-[11px] font-mono px-1.5 py-0.2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                {activeCount}
              </span>
            )}
          </div>
        </div>

        {/* Center: Search input */}
        <div className="hidden sm:flex flex-1 max-w-xs mx-4">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search (or press /)"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-8 pr-3 py-1 text-xs bg-zinc-100/70 dark:bg-zinc-800/40 border border-transparent focus:border-zinc-300 dark:focus:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none transition"
            />
          </div>
        </div>

        {/* Action Buttons: Minimal, clean, quiet */}
        <div className="flex items-center gap-1">
          {/* Quick Canvas Sync */}
          {settings.canvas_ics_url && (
            <button
              onClick={onSyncCanvas}
              disabled={isSyncingCanvas}
              title="Sync Canvas Now"
              className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isSyncingCanvas ? "animate-spin text-blue-500" : ""}`}
              />
              <span className="hidden md:inline">Sync Canvas</span>
            </button>
          )}

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            aria-label="Toggle theme"
            className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 rounded-lg transition"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-zinc-400 hover:text-amber-400 transition-colors" />
            ) : (
              <Moon className="w-4 h-4 text-zinc-600 hover:text-indigo-500 transition-colors" />
            )}
          </button>

          {/* Keyboard Shortcuts Help */}
          <button
            onClick={onOpenShortcuts}
            aria-label="Keyboard Shortcuts"
            className="hidden md:flex p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 rounded-lg transition"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Notifications Bell */}
          <button
            onClick={onOpenSettings}
            aria-label="Notification & Reminder Settings"
            title={
              notificationPermission === "granted"
                ? "Notifications active (click for settings)"
                : "Enable Notifications & Reminders"
            }
            className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 rounded-lg transition relative"
          >
            <Bell
              className={`w-4 h-4 ${
                notificationPermission === "granted"
                  ? "text-blue-500 dark:text-blue-400"
                  : "text-zinc-400"
              }`}
            />
            {notificationPermission !== "granted" && (
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-500" />
            )}
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            aria-label="Settings"
            className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 rounded-lg transition relative"
          >
            <Settings className="w-4 h-4" />
            {!settings.canvas_ics_url && (
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Search Input Bar */}
      <div className="sm:hidden px-4 pb-2.5">
        <div className="relative w-full">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-8 pr-3 py-1 text-xs bg-zinc-100/70 dark:bg-zinc-800/40 border border-transparent focus:border-zinc-300 dark:focus:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none transition"
          />
        </div>
      </div>
    </header>
  );
}
