/**
 * The connector backend (connector/server.py) is the *only* backend this UI
 * talks to. It exposes:
 *
 *   GET  /data?mode=latest            -> { devices: [...], alarms: [...] }
 *   POST /alarms/<alarm_id>/dismiss   -> clears an alarm
 *   Socket.IO  "chat" / "alarm"       -> narrator chat + live alarm push
 *
 * `devices` and `alarms` come straight from ThingsBoard, so this module owns
 * the translation into the flat shapes the UI components render.
 */

// Server-side base URL (used by the Next.js route handlers that proxy the
// connector). The browser never calls the connector's HTTP API directly — it
// goes through /api/* — so this stays server-only. Socket.IO is the exception
// (see lib/socket.ts), which the browser connects to directly.
export const CONNECTOR_URL =
  process.env.CONNECTOR_URL ?? "http://127.0.0.1:8000";

/* ── Shapes the UI components consume ─────────────────────────────────────── */

export interface SensorReading {
  sensorId: string;
  name: string;
  sensor_type?: string;
  /** Normalised room id: kitchen | living_room | bedroom | bathroom | entrance */
  location?: string;
  value: number | string;
  unit?: string;
  ts: number;
  battery_pct?: number | null;
}

export type AlertSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface AuditorAlert {
  alertId: string;
  type: string;
  message: string;
  severity: AlertSeverity;
  ts: number;
  active: boolean;
}

/* ── Raw connector / ThingsBoard shapes ───────────────────────────────────── */

interface TbDatapoint {
  ts: number;
  value: string | number;
}

interface TbDevice {
  sensor_id?: string;
  sensor_type?: string;
  location?: string;
  placement?: string;
  unit?: string;
  telemetry?: Record<string, TbDatapoint[]>;
  [key: string]: unknown;
}

interface TbAlarm {
  id?: { id?: string } | string;
  type?: string;
  severity?: string; // CRITICAL | MAJOR | MINOR | WARNING | INDETERMINATE
  status?: string; // ACTIVE_UNACK | ACTIVE_ACK | CLEARED_* ...
  startTs?: number;
  createdTime?: number;
  details?: { summary?: string; description?: string; recommendation?: string };
}

export interface ConnectorData {
  devices?: TbDevice[];
  alarms?: TbAlarm[];
}

/* ── Mappers ──────────────────────────────────────────────────────────────── */

/** "Living Room" -> "living_room", so the dashboard can group by room id. */
function normalizeRoom(location?: string): string | undefined {
  if (!location) return undefined;
  return location.trim().toLowerCase().replace(/\s+/g, "_");
}

function firstPoint(series?: TbDatapoint[]): TbDatapoint | undefined {
  if (!series || series.length === 0) return undefined;
  // ThingsBoard returns latest-first, but be defensive and pick the newest ts.
  return series.reduce((a, b) => (b.ts > a.ts ? b : a));
}

function toNumber(value: string | number | undefined): number | string {
  if (value === undefined || value === null) return 0;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : value;
}

export function mapDevice(dev: TbDevice): SensorReading {
  const telemetry = dev.telemetry ?? {};
  const valuePoint = firstPoint(telemetry.value);
  const batteryPoint = firstPoint(telemetry.battery_pct);
  const sensorId = dev.sensor_id ?? dev.placement ?? "sensor";

  const battery =
    batteryPoint !== undefined ? Number(batteryPoint.value) : null;

  return {
    sensorId,
    name: dev.placement ?? sensorId,
    sensor_type: dev.sensor_type,
    location: normalizeRoom(dev.location),
    value: valuePoint !== undefined ? toNumber(valuePoint.value) : 0,
    unit: dev.unit,
    ts: valuePoint?.ts ?? batteryPoint?.ts ?? Date.now(),
    battery_pct: battery !== null && Number.isFinite(battery) ? battery : null,
  };
}

// The connector raises ThingsBoard alarms with these severities (see
// TB_SEVERITY in server.py); map them back to the UI's four levels.
const SEVERITY_MAP: Record<string, AlertSeverity> = {
  WARNING: "LOW",
  MINOR: "MEDIUM",
  MAJOR: "HIGH",
  CRITICAL: "CRITICAL",
  INDETERMINATE: "MEDIUM",
};

function alarmId(id: TbAlarm["id"]): string {
  if (typeof id === "string") return id;
  return id?.id ?? "";
}

export function mapAlarm(alarm: TbAlarm): AuditorAlert {
  const details = alarm.details ?? {};
  const message =
    [details.description, details.recommendation].filter(Boolean).join(" · ") ||
    details.summary ||
    alarm.type ||
    "Alert";

  return {
    alertId: alarmId(alarm.id),
    type: alarm.type ?? "UNKNOWN",
    message,
    severity: SEVERITY_MAP[(alarm.severity ?? "").toUpperCase()] ?? "MEDIUM",
    ts: alarm.startTs ?? alarm.createdTime ?? Date.now(),
    // /data only returns ACTIVE alarms, but derive defensively from status.
    active: !String(alarm.status ?? "").toUpperCase().startsWith("CLEARED"),
  };
}

export function mapConnectorData(data: ConnectorData): {
  sensors: SensorReading[];
  alerts: AuditorAlert[];
} {
  return {
    sensors: (data.devices ?? []).map(mapDevice),
    alerts: (data.alarms ?? []).map(mapAlarm),
  };
}

/* ── Server-side helpers (used by route handlers) ─────────────────────────── */

export async function fetchConnectorData(
  mode: "latest" | "last_hour" | "last_day" = "latest"
): Promise<{ sensors: SensorReading[]; alerts: AuditorAlert[] }> {
  const res = await fetch(`${CONNECTOR_URL}/data?mode=${mode}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`connector /data error: ${res.status}`);
  return mapConnectorData((await res.json()) as ConnectorData);
}

export async function dismissAlarm(alarmId: string): Promise<void> {
  const res = await fetch(
    `${CONNECTOR_URL}/alarms/${encodeURIComponent(alarmId)}/dismiss`,
    { method: "POST" }
  );
  if (!res.ok) throw new Error(`connector dismiss error: ${res.status}`);
}
