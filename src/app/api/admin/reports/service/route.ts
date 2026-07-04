import { NextResponse } from "next/server";

import { requireRole } from "@/lib/auth";
import { getServiceReport } from "@/lib/admin-reports";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await requireRole(["admin"]);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const dateFrom = searchParams.get("dateFrom") ?? undefined;
  const dateTo = searchParams.get("dateTo") ?? undefined;
  const serviceSlug = searchParams.get("service") ?? undefined;

  const report = await getServiceReport({ dateFrom, dateTo, serviceSlug });

  return NextResponse.json(report);
}
