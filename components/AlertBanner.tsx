"use client";

import type { AuditorAlert } from "@/lib/thingsboard";

const SEV_CFG = {
  LOW: {
    bar: "bg-amber-400",
    bg: "bg-amber-50 border-amber-200",
    badge: "bg-amber-100 text-amber-700 border-amber-200",
    text: "text-amber-900",
    muted: "text-amber-600",
  },
  MEDIUM: {
    bar: "bg-orange-400",
    bg: "bg-orange-50 border-orange-200",
    badge: "bg-orange-100 text-orange-700 border-orange-200",
    text: "text-orange-900",
    muted: "text-orange-600",
  },
  HIGH: {
    bar: "bg-red-500",
    bg: "bg-red-50 border-red-200",
    badge: "bg-red-100 text-red-700 border-red-200",
    text: "text-red-900",
    muted: "text-red-500",
  },
  CRITICAL: {
    bar: "bg-red-700",
    bg: "bg-red-100 border-red-300",
    badge: "bg-red-700 text-white border-red-700",
    text: "text-red-950",
    muted: "text-red-700",
  },
} as const;

const TYPE_LABEL: Record<string, string> = {
  ACUTE_HAZARD:   "Άμεσος κίνδυνος",
  SUBTLE_DECLINE: "Σταδιακή έκπτωση",
  UNKNOWN:        "Άγνωστος τύπος",
};

function AlertIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0 mt-px"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function relativeTime(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60)   return `${s}δ πριν`;
  if (s < 3600) return `${Math.floor(s / 60)}λ πριν`;
  return new Date(ts).toLocaleTimeString("el-GR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AlertBanner({ alerts }: { alerts: AuditorAlert[] }) {
  const active = alerts.filter((a) => a.active);
  if (active.length === 0) return null;

  return (
    <div className="space-y-2">
      {active.map((alert) => {
        const c = SEV_CFG[alert.severity] ?? SEV_CFG.MEDIUM;
        return (
          <div
            key={alert.alertId}
            className={`relative flex items-start gap-3 rounded-xl border px-4 py-3 overflow-hidden ${c.bg}`}
          >
            {/* Left severity bar */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${c.bar}`} />

            <div className={`mt-0.5 ${c.muted}`}>
              <AlertIcon />
            </div>

            <div className="flex-1 min-w-0 pl-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span
                  className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${c.badge}`}
                >
                  {alert.severity}
                </span>
                <span className={`text-sm font-semibold ${c.text}`}>
                  {TYPE_LABEL[alert.type] ?? alert.type}
                </span>
              </div>
              <p className={`text-sm leading-snug ${c.text}`}>{alert.message}</p>
              <p className={`text-[11px] mt-1.5 ${c.muted}`}>
                Safety Auditor · {relativeTime(alert.ts)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
