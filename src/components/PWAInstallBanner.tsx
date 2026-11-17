"use client";

import React, { useState, useEffect } from "react";
import { Download, Share, X, PlusSquare } from "lucide-react";

export function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showIosPrompt, setShowIosPrompt] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) return;

    // Check if dismissed in this session
    if (sessionStorage.getItem("pwa_banner_dismissed")) {
      setIsDismissed(true);
      return;
    }

    // Android / Chrome beforeinstallprompt handler
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // iOS Safari detection
    const isIos =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    if (isIos && !isStandalone) {
      setShowIosPrompt(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem("pwa_banner_dismissed", "true");
  };

  if (isDismissed) return null;

  if (deferredPrompt) {
    return (
      <div className="bg-blue-600 text-white px-4 py-2.5 rounded-2xl shadow-lg mb-4 flex items-center justify-between gap-3 text-xs animate-in slide-in-from-top duration-200">
        <div className="flex items-center gap-2.5">
          <Download className="w-4 h-4 shrink-0" />
          <p className="font-semibold">
            Install FocusTask for full-screen offline access
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleInstallClick}
            className="px-3 py-1 bg-white text-blue-700 font-bold rounded-lg shadow-sm hover:bg-blue-50 transition active:scale-95"
          >
            Install
          </button>
          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-blue-700 rounded-lg transition"
            aria-label="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  if (showIosPrompt) {
    return (
      <div className="bg-zinc-800 text-zinc-100 border border-zinc-700 px-4 py-2.5 rounded-2xl shadow-lg mb-4 flex items-center justify-between gap-3 text-xs animate-in slide-in-from-top duration-200">
        <div className="flex items-center gap-2.5">
          <PlusSquare className="w-4 h-4 text-blue-400 shrink-0" />
          <p>
            To install on iOS: Tap <Share className="w-3.5 h-3.5 inline mx-1 text-blue-400" /> then{" "}
            <strong>"Add to Home Screen"</strong>
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="p-1 text-zinc-400 hover:text-white rounded-lg transition"
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return null;
}
