"use client";

import React, { useEffect } from "react";
import { CheckCircle2, AlertCircle, Info, X, Undo2 } from "lucide-react";

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info";
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastProps) {
  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 left-4 sm:left-auto sm:w-96 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    // Give more time if there is an action (e.g. Undo button)
    const duration = toast.action ? 5500 : 3500;
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, duration);
    return () => clearTimeout(timer);
  }, [toast.id, toast.action, onDismiss]);

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-400 shrink-0" />,
  };

  const bgStyles = {
    success: "bg-zinc-900/95 border-emerald-500/30 text-white dark:bg-zinc-900/95 dark:border-emerald-500/30",
    error: "bg-zinc-900/95 border-rose-500/30 text-white dark:bg-zinc-900/95 dark:border-rose-500/30",
    info: "bg-zinc-900/95 border-blue-500/30 text-white dark:bg-zinc-900/95 dark:border-blue-500/30",
  };

  return (
    <div
      className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-md transition-all animate-in slide-in-from-bottom-2 duration-200 ${bgStyles[toast.type]}`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {icons[toast.type]}
        <p className="text-sm font-medium leading-snug truncate">{toast.message}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {toast.action && (
          <button
            onClick={() => {
              toast.action?.onClick();
              onDismiss(toast.id);
            }}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-white/15 hover:bg-white/25 active:scale-95 text-white transition-all border border-white/20"
          >
            <Undo2 className="w-3.5 h-3.5" />
            {toast.action.label}
          </button>
        )}
        <button
          onClick={() => onDismiss(toast.id)}
          className="p-1 text-zinc-400 hover:text-white rounded-lg transition-colors"
          aria-label="Dismiss toast"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
