import { NextRequest, NextResponse } from "next/server";
import { askNarrator } from "@/lib/llm";
import { fetch24hSensorHistory, fetchAuditorAlerts } from "@/lib/thingsboard";

export async function POST(req: NextRequest) {
  const { question, deviceId, sensorKeys } = await req.json();

  if (!question || !deviceId) {
    return NextResponse.json({ error: "question and deviceId required" }, { status: 400 });
  }

  try {
    const [history, alerts] = await Promise.all([
      fetch24hSensorHistory(deviceId, sensorKeys ?? []),
      fetchAuditorAlerts(deviceId),
    ]);

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
    const stream = await askNarrator(question, context);

    return new NextResponse(stream, {
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
