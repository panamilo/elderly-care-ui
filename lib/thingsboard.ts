const TB_URL = process.env.THINGSBOARD_URL!;
const TB_TOKEN = process.env.THINGSBOARD_TOKEN!;

function tbHeaders() {
  return {
    "X-Authorization": `Bearer ${TB_TOKEN}`,
    "Content-Type": "application/json",
  };
}

export interface SensorReading {
  sensorId: string;
  name: string;
  sensor_type?: string;
  location?: string;
  value: number | string;
  unit?: string;
  ts: number;
  battery_pct?: number | null;
}

export interface AuditorAlert {
  alertId: string;
  type: string;
  message: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  ts: number;
  active: boolean;
}

export async function fetchLatestSensors(deviceId: string): Promise<SensorReading[]> {
  const res = await fetch(
    `${TB_URL}/api/plugins/telemetry/DEVICE/${deviceId}/values/timeseries`,
    { headers: tbHeaders(), next: { revalidate: 0 } }
  );
  if (!res.ok) throw new Error(`ThingsBoard sensors error: ${res.status}`);

  const data: Record<string, { ts: number; value: string }[]> = await res.json();

  return Object.entries(data).map(([key, entries]) => ({
    sensorId: key,
    name: key,
    value: Number(entries[0].value) || entries[0].value,
    ts: entries[0].ts,
  }));
}

export async function fetchAuditorAlerts(deviceId: string): Promise<AuditorAlert[]> {
  const res = await fetch(
    `${TB_URL}/api/plugins/telemetry/DEVICE/${deviceId}/values/timeseries?keys=alert`,
    { headers: tbHeaders(), next: { revalidate: 0 } }
  );
  if (!res.ok) throw new Error(`ThingsBoard alerts error: ${res.status}`);

  const data: Record<string, { ts: number; value: string }[]> = await res.json();
  const alertEntries = data["alert"] ?? [];

  return alertEntries.map((entry, i) => {
    try {
      const parsed = JSON.parse(entry.value);
      return {
        alertId: `${entry.ts}-${i}`,
        type: parsed.type ?? "UNKNOWN",
        message: parsed.message ?? entry.value,
        severity: parsed.severity ?? "MEDIUM",
        ts: entry.ts,
        active: parsed.active ?? true,
      };
    } catch {
      return {
        alertId: `${entry.ts}-${i}`,
        type: "UNKNOWN",
        message: entry.value,
        severity: "MEDIUM" as const,
        ts: entry.ts,
        active: true,
      };
    }
  });
}

export async function fetch24hSensorHistory(
  deviceId: string,
  keys: string[]
): Promise<Record<string, { ts: number; value: string }[]>> {
  const endTs = Date.now();
  const startTs = endTs - 24 * 60 * 60 * 1000;
  const keysParam = keys.join(",");

  const res = await fetch(
    `${TB_URL}/api/plugins/telemetry/DEVICE/${deviceId}/values/timeseries?keys=${keysParam}&startTs=${startTs}&endTs=${endTs}&limit=1000`,
    { headers: tbHeaders(), next: { revalidate: 0 } }
  );
  if (!res.ok) throw new Error(`ThingsBoard history error: ${res.status}`);
  return res.json();
}
