import { NextResponse } from "next/server";

import { jsonApiError } from "@/lib/error-utils";
import { getStaffSurveySummaryApiData } from "@/lib/staff-api-data";

export async function GET() {
  try {
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
  } catch (error) {
    return jsonApiError(
      error,
      "api:staff:surveys:summary:get",
      "Ringkasan survei gagal dimuat."
    );
  }
}
