import { NextResponse } from "next/server";
import { dismissAlarm } from "@/lib/connector";

// Proxies the connector's POST /alarms/<id>/dismiss. In Next.js 16 dynamic
// route `params` is async and must be awaited.
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "alarm id required" }, { status: 400 });
  }

  try {
    await dismissAlarm(id);
    return NextResponse.json({ status: "dismissed", alarmId: id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Connector unavailable: ${message}` },
      { status: 502 }
    );
  }
}
