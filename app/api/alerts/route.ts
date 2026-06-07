import { NextRequest, NextResponse } from "next/server";
import { fetchAuditorAlerts } from "@/lib/thingsboard";
import { DUMMY_ALERTS } from "@/lib/dummy";

const TB_READY =
  process.env.THINGSBOARD_URL &&
  process.env.THINGSBOARD_TOKEN &&
  process.env.THINGSBOARD_TOKEN !== "YOUR_TOKEN_HERE";

export async function GET(req: NextRequest) {
  const deviceId = req.nextUrl.searchParams.get("deviceId");

  if (!TB_READY || !deviceId || deviceId === "REPLACE_WITH_DEVICE_ID") {
    return NextResponse.json(DUMMY_ALERTS);
  }

  try {
    const alerts = await fetchAuditorAlerts(deviceId);
    return NextResponse.json(alerts);
  } catch {
    return NextResponse.json(DUMMY_ALERTS);
  }
}
