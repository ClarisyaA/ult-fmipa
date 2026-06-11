import { NextResponse } from "next/server";

import { requireRole } from "@/lib/auth";
import { getSurveySummary } from "@/lib/service-surveys";

export async function GET() {
  const user = await requireRole(["staff"]);

  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const summary = await getSurveySummary("staff");

  return NextResponse.json({
    data: summary,
  });
}
