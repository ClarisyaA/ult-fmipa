import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit-log";
import { jsonApiError } from "@/lib/error-utils";
import {
  assertValidAcademicCalendarInput,
  ensureHomeLinksTableAvailable,
  updateAcademicCalendarLink,
} from "@/lib/home-links";
import {
  getHomeLinkApiErrorStatus,
  parseAcademicCalendarRequest,
} from "@/lib/home-links-api";

function getActorName(user: { name?: string | null; email?: string | null }) {
  return user.name ?? user.email ?? "Staff ULT";
}

async function requireStaffAccess() {
  const user = await getCurrentUser();

  if (!user) {
    return { user: null, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  if (!["ADMIN", "STAFF"].includes(user.role)) {
    return { user: null, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { user, response: null };
}

export async function PATCH(request: Request) {
  const auth = await requireStaffAccess();

  if (auth.response) {
    return auth.response;
  }

  try {
    const input = await parseAcademicCalendarRequest(request, getActorName(auth.user));
    assertValidAcademicCalendarInput(input);
    await ensureHomeLinksTableAvailable();
    const link = await updateAcademicCalendarLink(input);

    await writeAuditLog({
      actor: auth.user,
      request,
      action: "Memperbarui link Kalender Akademik",
    });

    return NextResponse.json({
      data: link,
      message: "Link Kalender Akademik berhasil diperbarui.",
    });
  } catch (error) {
    const apiError = getHomeLinkApiErrorStatus(error);

    if (apiError) {
      return NextResponse.json(
        { error: apiError.message },
        { status: apiError.statusCode }
      );
    }

    return jsonApiError(
      error,
      "api:staff:home-links:academic-calendar:patch",
      "Link Kalender Akademik gagal diperbarui."
    );
  }
}
