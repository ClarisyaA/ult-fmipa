import { NextResponse } from "next/server";

import { jsonApiError } from "@/lib/error-utils";
import { getPublicHomeActivities } from "@/lib/home-activities";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const activities = await getPublicHomeActivities();

    return NextResponse.json(
      { data: activities },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    return jsonApiError(
      error,
      "api:home:activities:get",
      "Kegiatan mahasiswa gagal dimuat."
    );
  }
}
