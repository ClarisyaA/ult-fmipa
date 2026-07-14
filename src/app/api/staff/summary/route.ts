import { NextResponse } from "next/server";

import { jsonApiError } from "@/lib/error-utils";
import { getDashboardSummary } from "@/lib/legacy-request-stats";

export async function GET() {
  try {
    const dashboardSummary = await getDashboardSummary();

    return NextResponse.json({
      data: dashboardSummary,
    });
  } catch (error) {
    return jsonApiError(error, "api:staff:summary", "Ringkasan gagal dimuat.");
  }
}
