"use client";

import React from "react";
import { X, Command } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsModal({ isOpen, onClose }: Props) {
  if (!isOpen) return null;

  const shortcuts = [
    { key: "N", desc: "Focus quick-add bar for a new task" },
    { key: "/", desc: "Search and filter tasks" },
    { key: "1", desc: "Set priority to High (P1) when adding" },
    { key: "2", desc: "Set priority to Medium (P2) when adding" },
    { key: "3", desc: "Set priority to Low (P3) when adding" },
    { key: "T", desc: "Set due date to Today" },
    { key: "M", desc: "Set due date to Tomorrow" },
    { key: "?", desc: "Toggle keyboard shortcuts help" },
    { key: "Esc", desc: "Close modals or blur inputs" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Command className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
              Keyboard Shortcuts
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 divide-y divide-zinc-100 dark:divide-zinc-800 max-h-[70vh] overflow-y-auto">
          {shortcuts.map((sc, i) => (
            <div key={i} className="flex items-center justify-between py-2.5">
              <span className="text-sm text-zinc-600 dark:text-zinc-300">
                {sc.desc}
              </span>
              <kbd className="px-2.5 py-1 text-xs font-mono font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 rounded-md shadow-sm">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="px-5 py-3 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-200 dark:border-zinc-800 text-center">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Press <kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-xs">Esc</kbd> anytime to dismiss
          </p>
        </div>
      </div>
    </div>
  );
}
