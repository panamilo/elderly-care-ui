"use client";

import type { SensorReading } from "@/lib/connector";

/* ── Type metadata ─────────────────────────────────────── */

const TYPE_CFG: Record<string, { label: string; accent: string }> = {
  motion:     { label: "MOTION",     accent: "#3B82F6" },
  power:      { label: "POWER",      accent: "#F59E0B" },
  contact:    { label: "CONTACT",    accent: "#10B981" },
  water_flow: { label: "WATER FLOW", accent: "#06B6D4" },
  pressure:   { label: "PRESSURE",   accent: "#8B5CF6" },
  vibration:  { label: "VIBRATION",  accent: "#EC4899" },
};

const ROOM_LABELS: Record<string, string> = {
  kitchen:     "Kitchen",
  living_room: "Living Room",
  bedroom:     "Bedroom",
  bathroom:    "Bathroom",
  entrance:    "Entrance",
};

/* ── Status resolution ─────────────────────────────────── */

interface Status {
  text: string;
  dot: "green" | "amber" | "red" | "blue" | "violet" | "gray";
  live: boolean;
}

function resolveStatus(s: SensorReading): Status {
  const v = Number(s.value);
  switch (s.sensor_type) {
    case "motion":
      return v === 1
        ? { text: "Motion detected", dot: "green", live: true }
        : { text: "No motion", dot: "gray", live: false };
    case "power":
      return v > 10
        ? { text: `${v} W — Active`, dot: "amber", live: true }
        : { text: "Off", dot: "gray", live: false };
    case "contact":
      return v === 1
        ? { text: "Open", dot: "red", live: true }
        : { text: "Closed", dot: "green", live: false };
    case "water_flow":
      return v > 0
        ? { text: `${v} L/min — Flowing`, dot: "blue", live: true }
        : { text: "No flow", dot: "gray", live: false };
    case "pressure":
      return v === 1
        ? { text: "Occupied", dot: "violet", live: true }
        : { text: "Empty", dot: "gray", live: false };
    case "vibration":
      return { text: "Event detected", dot: "violet", live: false };
    default:
      return { text: String(s.value), dot: "gray", live: false };
  }
}

/* ── Helpers ───────────────────────────────────────────── */

const DOT_CLASSES: Record<Status["dot"], string> = {
  green:  "bg-emerald-500",
  amber:  "bg-amber-400",
  red:    "bg-red-500",
  blue:   "bg-cyan-500",
  violet: "bg-violet-500",
  gray:   "bg-slate-300",
};

const TEXT_CLASSES: Record<Status["dot"], string> = {
  green:  "text-emerald-700",
  amber:  "text-amber-700",
  red:    "text-red-700",
  blue:   "text-cyan-700",
  violet: "text-violet-700",
  gray:   "text-slate-500",
};

function relativeTime(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60)   return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  return `${Math.floor(s / 3600)}h`;
}

function batteryClass(pct: number): string {
  if (pct > 50) return "text-emerald-600";
  if (pct > 20) return "text-amber-500";
  return "text-red-500";
}

/* ── Component ─────────────────────────────────────────── */

export default function SensorCard({ sensor }: { sensor: SensorReading }) {
  const type  = sensor.sensor_type ?? "";
  const cfg   = TYPE_CFG[type] ?? { label: type.toUpperCase(), accent: "#94A3B8" };
  const status = resolveStatus(sensor);
  const room  = sensor.location ? (ROOM_LABELS[sensor.location] ?? sensor.location) : "";

  return (
    <div
      className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-sm transition-shadow"
      style={{ borderLeft: `3px solid ${cfg.accent}` }}
    >
      <div className="px-4 py-3 flex flex-col gap-2.5">
        {/* Top: type label + status dot */}
        <div className="flex items-center justify-between gap-2">
          <span
            className="text-[10px] font-bold tracking-widest"
            style={{ color: cfg.accent }}
          >
            {cfg.label}
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className={`h-1.5 w-1.5 rounded-full ${DOT_CLASSES[status.dot]} ${status.live ? "animate-pulse" : ""}`}
            />
            <span className={`text-[10px] font-semibold uppercase tracking-wide ${TEXT_CLASSES[status.dot]}`}>
              {status.live ? "LIVE" : "IDLE"}
            </span>
          </span>
        </div>

        {/* Status text (main value) */}
        <p className="text-sm font-semibold text-slate-800 leading-snug">
          {status.text}
        </p>

        {/* Sensor ID */}
        <p className="text-[11px] font-mono text-slate-400 leading-none">
          {sensor.sensorId}
        </p>

        {/* Footer: room · time · battery */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-100">
          <span className="text-[11px] text-slate-400">{room}</span>
          <span className="flex items-center gap-2 text-[11px] text-slate-400">
            <span>{relativeTime(sensor.ts)} ago</span>
            {sensor.battery_pct !== null && sensor.battery_pct !== undefined && (
              <span className={batteryClass(sensor.battery_pct)}>
                {sensor.battery_pct}%
              </span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
