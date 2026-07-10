import { NextResponse } from "next/server";

import { requireRole } from "@/lib/auth";
import { getRequestNotificationSnapshot } from "@/lib/legacy-request-stats";

export async function GET() {
  const user = await requireRole(["admin"]);

  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const data = await getRequestNotificationSnapshot();

  return NextResponse.json({ data });
}
