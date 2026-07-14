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
  ensureHomeActivitiesTableAvailable,
  getAdminHomeActivities,
} from "@/lib/home-activities";
import { saveHomeActivityImage } from "@/lib/home-activity-image-upload";

function getActorName(user: { name?: string | null; email?: string | null }) {
  return user.name ?? user.email ?? "Admin ULT";
}

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const activities = await getAdminHomeActivities();

    return NextResponse.json({ data: activities });
  } catch (error) {
    return jsonApiError(
      error,
      "api:admin:home-activities:get",
      "Kegiatan mahasiswa gagal dimuat."
    );
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { input, imageFile } = await parseHomeActivityRequest(request, getActorName(user));
    assertValidHomeActivityInput(input);
    await ensureHomeActivitiesTableAvailable();
    const image = imageFile ? await saveHomeActivityImage(imageFile) : null;
    const activity = await createHomeActivity(input, image);

    await writeAuditLog({
      actor: user,
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
      "api:admin:home-activities:post",
      "Kegiatan mahasiswa gagal dibuat."
    );
  }
}
