/**
 * app/api/chat/route.ts
 *
 * Keeps the original ThingsBoard data-fetching logic intact.
 * Replaces askNarrator() with a call to the Python/Ollama backend.
 */

import { NextRequest, NextResponse } from "next/server";
import { fetch24hSensorHistory, fetchAuditorAlerts } from "@/lib/thingsboard";

const PYTHON_BACKEND = process.env.PYTHON_BACKEND_URL ?? "http://localhost:8000";

export async function POST(req: NextRequest) {
  const { question, deviceId, sensorKeys } = await req.json();

  if (!question || !deviceId) {
    return NextResponse.json(
      { error: "question and deviceId required" },
      { status: 400 }
    );
  }

  try {
    const [history, alerts] = await Promise.all([
      fetch24hSensorHistory(deviceId, sensorKeys ?? []),
      fetchAuditorAlerts(deviceId),
    ]);

    // Build context string — same logic as the original route
    const contextLines: string[] = [];
    for (const [key, readings] of Object.entries(history)) {
      const summary = readings
        .slice(0, 20)
        .map((r) => `  ${new Date(r.ts).toISOString()}: ${r.value}`)
        .join("\n");
      contextLines.push(`${key}:\n${summary}`);
    }
    if (alerts.length > 0) {
      contextLines.push(
        `\nActive alerts:\n${alerts
          .filter((a) => a.active)
          .map((a) => `  [${a.severity}] ${a.message}`)
          .join("\n")}`
      );
    }

    const context = contextLines.join("\n\n");

    // Forward to Python/Ollama backend instead of askNarrator()
    const upstream = await fetch(`${PYTHON_BACKEND}/api/narrator`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, context }),
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Backend error: ${upstream.status}` },
        { status: 502 }
      );
    }

    // Stream the plain-text response straight back to the UI
    return new NextResponse(upstream.body, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}