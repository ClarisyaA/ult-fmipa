import { NextResponse } from "next/server";

import { jsonApiError } from "@/lib/error-utils";
import { getPublicHomeActivities } from "@/lib/home-activities";

const CACHE_TTL_MS = 60_000;
let cachedPayload:
  | {
      expiresAt: number;
      data: Awaited<ReturnType<typeof getPublicHomeActivities>>;
    }
  | null = null;

function jsonResponse(data: Awaited<ReturnType<typeof getPublicHomeActivities>>) {
  return NextResponse.json(
    { data },
    {
      headers: {
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      },
    }
  );
}

export async function GET() {
  try {
    const now = Date.now();

    if (cachedPayload && cachedPayload.expiresAt > now) {
      return jsonResponse(cachedPayload.data);
    }

    const activities = await getPublicHomeActivities();
    cachedPayload = {
      expiresAt: now + CACHE_TTL_MS,
      data: activities,
    };

    return jsonResponse(activities);
  } catch (error) {
    return jsonApiError(
      error,
      "api:home:activities:get",
      "Kegiatan mahasiswa gagal dimuat."
    );
  }
}
