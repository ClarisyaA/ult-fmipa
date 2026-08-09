import { NextResponse } from "next/server";

import { jsonApiError } from "@/lib/error-utils";
import {
  DEFAULT_ACADEMIC_CALENDAR_URL,
  getAcademicCalendarLink,
} from "@/lib/home-links";

const CACHE_TTL_MS = 60_000;
let cachedPayload:
  | {
      expiresAt: number;
      data: {
        success: true;
        data: {
          academicCalendar: {
            label: string;
            url: string;
            isActive: boolean;
          };
        };
      };
    }
  | null = null;

function jsonResponse(data: NonNullable<typeof cachedPayload>["data"]) {
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
    },
  });
}

export async function GET() {
  try {
    const now = Date.now();

    if (cachedPayload && cachedPayload.expiresAt > now) {
      return jsonResponse(cachedPayload.data);
    }

    const link = await getAcademicCalendarLink();
    const data = {
      success: true,
      data: {
        academicCalendar: {
          label: link?.label ?? "Kalender Akademik",
          url:
            link && link.isActive && link.url
              ? link.url
              : DEFAULT_ACADEMIC_CALENDAR_URL,
          isActive: link?.isActive ?? true,
        },
      },
    } as const;

    cachedPayload = {
      expiresAt: now + CACHE_TTL_MS,
      data,
    };

    return jsonResponse(data);
  } catch (error) {
    return jsonApiError(
      error,
      "api:home:links:get",
      "Link beranda gagal dimuat."
    );
  }
}
