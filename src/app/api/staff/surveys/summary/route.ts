import { NextResponse } from "next/server";

import { getStaffSurveySummaryApiData } from "@/lib/staff-api-data";

export async function GET() {
  const result = await getStaffSurveySummaryApiData();

  if (result.error) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status }
    );
  }

  return NextResponse.json({
    data: result.data,
  });
}
