import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit-log";
import { jsonApiError } from "@/lib/error-utils";
import {
  getHomeActivityApiErrorStatus,
  parseHomeActivityRequest,
} from "@/lib/home-activities-api";
import {
  assertValidHomeActivityInput,
  createHomeActivity,
  getAdminHomeActivities,
} from "@/lib/home-activities";
import { saveHomeActivityImage } from "@/lib/home-activity-image-upload";

function getActorName(user: { name?: string | null; email?: string | null }) {
  return user.name ?? user.email ?? "Staff ULT";
}

async function requireStaffAccess() {
  const user = await getCurrentUser();

  if (!user) {
    return { user: null, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  if (!["admin", "staff"].includes(user.role)) {
    return { user: null, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { user, response: null };
}

export async function GET() {
  const auth = await requireStaffAccess();

  if (auth.response) {
    return auth.response;
  }

  try {
    const activities = await getAdminHomeActivities();

    return NextResponse.json({ data: activities });
  } catch (error) {
    return jsonApiError(
      error,
      "api:staff:home-activities:get",
      "Kegiatan mahasiswa gagal dimuat."
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireStaffAccess();

  if (auth.response) {
    return auth.response;
  }

  try {
    const { input, imageFile } = await parseHomeActivityRequest(
      request,
      getActorName(auth.user)
    );
    assertValidHomeActivityInput(input);
    const image = imageFile ? await saveHomeActivityImage(imageFile) : null;
    const activity = await createHomeActivity(input, image);

    await writeAuditLog({
      actor: auth.user,
      request,
      action: `Home Activity: Create #${activity?.id ?? "-"}`,
    });

    return NextResponse.json({
      data: activity,
      message: "Kegiatan mahasiswa berhasil dibuat.",
    });
  } catch (error) {
    const apiError = getHomeActivityApiErrorStatus(error);

    if (apiError) {
      return NextResponse.json(
        { error: apiError.message },
        { status: apiError.statusCode }
      );
    }

    return jsonApiError(
      error,
      "api:staff:home-activities:post",
      "Kegiatan mahasiswa gagal dibuat."
    );
  }
}
