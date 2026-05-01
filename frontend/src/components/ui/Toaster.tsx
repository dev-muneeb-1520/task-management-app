"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { toast as toastLib } from "@/lib/toast";
import type { Toast } from "@/lib/toast";

/** How long the toast is fully visible before the exit animation starts (ms). */
const DISPLAY_DURATION = 3000;
/** Duration of the slide-out animation — must match .animate-toast-out in globals.css (ms). */
const EXIT_DURATION = 300;

const TYPE_CONFIG = {
  success: {
    Icon:          CheckCircle2,
    iconClass:     "text-emerald-500",
    borderClass:   "border-l-emerald-500",
    progressClass: "bg-emerald-500",
  },
  error: {
    Icon:          XCircle,
    iconClass:     "text-red-500",
    borderClass:   "border-l-red-500",
    progressClass: "bg-red-500",
  },
  info: {
    Icon:          Info,
    iconClass:     "text-blue-500",
    borderClass:   "border-l-blue-500",
    progressClass: "bg-blue-500",
  },
  warning: {
    Icon:          AlertTriangle,
    iconClass:     "text-yellow-500",
    borderClass:   "border-l-yellow-500",
    progressClass: "bg-yellow-500",
  },
} as const;

// ─── Single toast item ────────────────────────────────────────────────────────

function ToastItem({
  toast: t,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitingRef = useRef(false);

  const { Icon, iconClass, borderClass, progressClass } = TYPE_CONFIG[t.type];

  const startDismiss = () => {
    if (exitingRef.current) return;
    exitingRef.current = true;
    setExiting(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    setTimeout(() => onDismiss(t.id), EXIT_DURATION);
  };

  useEffect(() => {
    timerRef.current = setTimeout(startDismiss, DISPLAY_DURATION);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`
        relative flex items-start gap-3 w-80 max-w-[calc(100vw-2.5rem)]
        bg-white rounded-2xl shadow-xl
        border border-gray-100 border-l-4 ${borderClass}
        px-4 py-3.5 overflow-hidden
        ${exiting ? "animate-toast-out" : "animate-toast-in"}
      `}
    >
      {/* Icon */}
      <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${iconClass}`} />

      {/* Message */}
      <p className="flex-1 text-sm font-medium text-gray-800 leading-snug wrap-break-word">
        {t.message}
      </p>

      {/* Close button */}
      <button
        type="button"
        onClick={startDismiss}
        className="shrink-0 h-6 w-6 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      {/* 3-second shrinking progress bar */}
      <div
        className={`absolute bottom-0 left-0 h-0.5 ${progressClass} animate-toast-progress`}
      />
    </div>
  );
}

// ─── Toast container ──────────────────────────────────────────────────────────

export default function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    return toastLib.subscribe((incoming) => setToasts([...incoming]));
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-label="Notifications"
      className="fixed bottom-5 right-5 z-9999 flex flex-col gap-2.5 items-end pointer-events-none"
    >
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} onDismiss={(id) => toastLib.dismiss(id)} />
        </div>
      ))}
    </div>
  );
}
