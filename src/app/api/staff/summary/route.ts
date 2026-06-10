import { NextResponse } from "next/server";

import { getDashboardSummary } from "@/lib/legacy-request-stats";

export async function GET() {
  const dashboardSummary = await getDashboardSummary();

  return NextResponse.json({
    data: dashboardSummary,
  });
}
