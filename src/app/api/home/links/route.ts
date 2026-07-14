import { NextResponse } from "next/server";

import { jsonApiError } from "@/lib/error-utils";
import {
  DEFAULT_ACADEMIC_CALENDAR_URL,
  getAcademicCalendarLink,
} from "@/lib/home-links";

export async function GET() {
  try {
    const link = await getAcademicCalendarLink();

    return NextResponse.json({
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
    });
  } catch (error) {
    return jsonApiError(
      error,
      "api:home:links:get",
      "Link beranda gagal dimuat."
    );
  }
}
