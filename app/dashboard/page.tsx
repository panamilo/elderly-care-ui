"use client";

import { useEffect, useState, useCallback } from "react";
import SensorCard from "@/components/SensorCard";
import AlertBanner from "@/components/AlertBanner";
import { getSocket } from "@/lib/socket";
import type { SensorReading, AuditorAlert } from "@/lib/connector";

const ROOMS = [
  { id: "kitchen",     label: "Kitchen" },
  { id: "living_room", label: "Living Room" },
  { id: "bedroom",     label: "Bedroom" },
  { id: "bathroom",    label: "Bathroom" },
  { id: "entrance",    label: "Entrance" },
];

function RefreshIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  );
}

function StatCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 px-4 py-3">
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-2xl font-bold leading-none" style={{ color: accent }}>{value}</p>
      {sub && <p className="text-[11px] text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function OverviewPage() {
  const [sensors, setSensors] = useState<SensorReading[]>([]);
  const [alerts, setAlerts] = useState<AuditorAlert[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      const res = await fetch("/api/data");
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? "Error fetching data");
      setSensors(body.sensors as SensorReading[]);
      setAlerts(body.alerts as AuditorAlert[]);
      setLastUpdate(new Date());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Dismiss an alarm via the connector, then drop it locally (optimistic).
  const handleDismiss = useCallback(async (alertId: string) => {
    const res = await fetch(`/api/alarms/${encodeURIComponent(alertId)}/dismiss`, {
      method: "POST",
    });
    if (!res.ok) {
      setError("Failed to dismiss alert");
      return;
    }
    setAlerts((prev) => prev.filter((a) => a.alertId !== alertId));
  }, []);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 30_000);

    // The connector pushes an "alarm" event whenever the hourly audit raises
    // one — refetch so new alarms appear without waiting for the next poll.
    const socket = getSocket();
    const onAlarm = () => fetchData();
    socket.on("alarm", onAlarm);

    return () => {
      clearInterval(id);
      socket.off("alarm", onAlarm);
    };
  }, [fetchData]);

  const activeAlerts = alerts.filter((a) => a.active);
  const activeSensors = sensors.filter((s) => {
    const v = Number(s.value);
    switch (s.sensor_type) {
      case "motion":     return v === 1;
      case "power":      return v > 10;
      case "contact":    return v === 1;
      case "water_flow": return v > 0;
      case "pressure":   return v === 1;
      default:           return false;
    }
  });

  const byRoom = (id: string) => sensors.filter((s) => s.location === id);

  return (
    <div className="p-5 lg:p-7 max-w-5xl mx-auto space-y-6">
      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 leading-tight">Overview</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {lastUpdate
              ? `Last updated: ${lastUpdate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`
              : loading ? "Loading data…" : "—"}
          </p>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing || loading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          <span className={refreshing ? "animate-spin" : ""}><RefreshIcon /></span>
          Refresh
        </button>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ── Summary stats ── */}
      {!loading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Sensors" value={sensors.length} sub="Total" accent="#2563EB" />
          <StatCard label="Active" value={activeSensors.length} sub="Activity detected" accent="#10B981" />
          <StatCard
            label="Alerts"
            value={activeAlerts.length}
            sub={activeAlerts.length === 0 ? "No issues" : "Attention required"}
            accent={activeAlerts.length > 0 ? "#EF4444" : "#10B981"}
          />
          <StatCard label="Safety Auditor" value="Automatic" sub="Every 60 minutes" accent="#8B5CF6" />
        </div>
      )}

      {/* ── Active alerts ── */}
      {activeAlerts.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
            Active alerts
          </h2>
          <AlertBanner alerts={alerts} onDismiss={handleDismiss} />
        </section>
      )}

      {/* ── Sensor grid by room ── */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {ROOMS.map((room) => {
            const roomSensors = byRoom(room.id);
            if (roomSensors.length === 0) return null;
            return (
              <section key={room.id}>
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-sm font-semibold text-slate-700">{room.label}</h2>
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-[11px] text-slate-400 font-mono">
                    {roomSensors.length} sensors
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {roomSensors.map((s) => (
                    <SensorCard key={s.sensorId} sensor={s} />
                  ))}
                </div>
              </section>
            );
          })}

          {/* Unlocated sensors (ThingsBoard fallback) */}
          {(() => {
            const rest = sensors.filter((s) => !s.location);
            if (!rest.length) return null;
            return (
              <section>
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-sm font-semibold text-slate-700">Other sensors</h2>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {rest.map((s) => (
                    <SensorCard key={s.sensorId} sensor={s} />
                  ))}
                </div>
              </section>
            );
          })()}
        </div>
      )}
    </div>
  );
}
