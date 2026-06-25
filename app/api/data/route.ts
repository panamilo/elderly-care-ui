import { NextResponse } from "next/server";
import { fetchConnectorData } from "@/lib/connector";

// Proxies the connector's GET /data and returns the UI-shaped
// { sensors, alerts }. Server-side, so the browser never hits the connector's
// HTTP API directly (avoids CORS) and the connector URL stays off the client.
export async function GET() {
  try {
    const data = await fetchConnectorData("latest");
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Connector unavailable: ${message}` },
      { status: 502 }
    );
  }
}
