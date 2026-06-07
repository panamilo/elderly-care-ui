"use client";

import { useEffect, useState, useCallback } from "react";
import SensorCard from "@/components/SensorCard";
import AlertBanner from "@/components/AlertBanner";
import type { SensorReading, AuditorAlert } from "@/lib/thingsboard";

const DEVICE_ID = process.env.NEXT_PUBLIC_DEVICE_ID ?? "DEMO";

const ROOMS = [
  { id: "kitchen",     label: "Κουζίνα" },
  { id: "living_room", label: "Σαλόνι" },
  { id: "bedroom",     label: "Υπνοδωμάτιο" },
  { id: "bathroom",    label: "Μπάνιο" },
  { id: "entrance",    label: "Είσοδος" },
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
      const [sRes, aRes] = await Promise.all([
        fetch(`/api/sensors?deviceId=${DEVICE_ID}`),
        fetch(`/api/alerts?deviceId=${DEVICE_ID}`),
      ]);
      if (!sRes.ok || !aRes.ok) throw new Error("Σφάλμα ανάκτησης δεδομένων");
      setSensors(await sRes.json());
      setAlerts(await aRes.json());
      setLastUpdate(new Date());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Άγνωστο σφάλμα");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 30_000);
    return () => clearInterval(id);
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
          <h1 className="text-lg font-bold text-slate-900 leading-tight">Επισκόπηση</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {lastUpdate
              ? `Τελευταία ενημέρωση: ${lastUpdate.toLocaleTimeString("el-GR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`
              : loading ? "Φόρτωση δεδομένων…" : "—"}
          </p>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing || loading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          <span className={refreshing ? "animate-spin" : ""}><RefreshIcon /></span>
          Ανανέωση
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
          <StatCard label="Αισθητήρες" value={sensors.length} sub="Σύνολο" accent="#2563EB" />
          <StatCard label="Ενεργοί" value={activeSensors.length} sub="Εντοπίστηκε δραστηριότητα" accent="#10B981" />
          <StatCard
            label="Ειδοποιήσεις"
            value={activeAlerts.length}
            sub={activeAlerts.length === 0 ? "Κανένα πρόβλημα" : "Απαιτείται προσοχή"}
            accent={activeAlerts.length > 0 ? "#EF4444" : "#10B981"}
          />
          <StatCard label="Safety Auditor" value="Αυτόματος" sub="Κάθε 60 λεπτά" accent="#8B5CF6" />
        </div>
      )}

      {/* ── Demo notice ── */}
      {!process.env.NEXT_PUBLIC_DEVICE_ID && !loading && (
        <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-2.5">
          <div className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse shrink-0" />
          <p className="text-xs text-blue-700 font-medium">
            Λειτουργία προσομοίωσης — ThingsBoard δεν έχει συνδεθεί. Εμφανίζονται δεδομένα demo.
          </p>
        </div>
      )}

      {/* ── Active alerts ── */}
      {activeAlerts.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
            Ενεργές ειδοποιήσεις
          </h2>
          <AlertBanner alerts={alerts} />
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
                    {roomSensors.length} αισθ.
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
                  <h2 className="text-sm font-semibold text-slate-700">Άλλοι αισθητήρες</h2>
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
