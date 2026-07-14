import { NextResponse } from "next/server";

import { jsonApiError } from "@/lib/error-utils";
import { getPublicHomeActivities } from "@/lib/home-activities";

export async function GET() {
  try {
    const activities = await getPublicHomeActivities();

    return NextResponse.json({ data: activities });
  } catch (error) {
    return jsonApiError(
      error,
      "api:home:activities:get",
      "Kegiatan mahasiswa gagal dimuat."
    );
  }
}
