import { NextRequest, NextResponse } from "next/server";
import { fetchLatestSensors } from "@/lib/thingsboard";
import { DUMMY_SENSORS } from "@/lib/dummy";

const TB_READY =
  process.env.THINGSBOARD_URL &&
  process.env.THINGSBOARD_TOKEN &&
  process.env.THINGSBOARD_TOKEN !== "YOUR_TOKEN_HERE";

export async function GET(req: NextRequest) {
  const deviceId = req.nextUrl.searchParams.get("deviceId");

  if (!TB_READY || !deviceId || deviceId === "REPLACE_WITH_DEVICE_ID") {
    return NextResponse.json(DUMMY_SENSORS);
  }

  try {
    const sensors = await fetchLatestSensors(deviceId);
    return NextResponse.json(sensors);
  } catch {
    return NextResponse.json(DUMMY_SENSORS);
  }
}
