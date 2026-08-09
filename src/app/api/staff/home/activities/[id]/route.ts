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
  deleteHomeActivity,
  ensureHomeActivitiesTableAvailable,
  getHomeActivityById,
  updateHomeActivity,
} from "@/lib/home-activities";
import { saveHomeActivityImage } from "@/lib/home-activity-image-upload";
import { getHomeActivityImages } from "@/lib/home-activity-images";

type HomeActivityRouteProps = {
  params: Promise<{ id: string }>;
};

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

export async function GET(_request: Request, { params }: HomeActivityRouteProps) {
  const auth = await requireStaffAccess();

  if (auth.response) {
    return auth.response;
  }

  try {
    const { id } = await params;
    const activity = await getHomeActivityById(id);

    if (!activity) {
      return NextResponse.json(
        { error: "Kegiatan mahasiswa tidak ditemukan." },
        { status: 404 }
      );
    }

    const images = await getHomeActivityImages(id);

    return NextResponse.json({ data: { ...activity, images } });
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
      "api:staff:home-activities:id:get",
      "Kegiatan mahasiswa gagal dimuat."
    );
  }
}

export async function PATCH(request: Request, { params }: HomeActivityRouteProps) {
  const auth = await requireStaffAccess();

  if (auth.response) {
    return auth.response;
  }

  try {
    const { id } = await params;
    const { input, imageFile } = await parseHomeActivityRequest(
      request,
      getActorName(auth.user)
    );
    assertValidHomeActivityInput(input);
    await ensureHomeActivitiesTableAvailable();
    const existing = await getHomeActivityById(id);

    if (!existing) {
      return NextResponse.json(
        { error: "Kegiatan mahasiswa tidak ditemukan." },
        { status: 404 }
      );
    }

    const image = imageFile ? await saveHomeActivityImage(imageFile) : null;
    const activity = await updateHomeActivity(id, input, image);

    if (!activity) {
      return NextResponse.json(
        { error: "Kegiatan mahasiswa tidak ditemukan." },
        { status: 404 }
      );
    }

    await writeAuditLog({
      actor: auth.user,
      request,
      action: `Home Activity: Update #${id}`,
    });

    return NextResponse.json({
      data: activity,
      message: "Kegiatan mahasiswa berhasil diperbarui.",
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
      "api:staff:home-activities:id:patch",
      "Kegiatan mahasiswa gagal diperbarui."
    );
  }
}

export async function DELETE(request: Request, { params }: HomeActivityRouteProps) {
  const auth = await requireStaffAccess();

  if (auth.response) {
    return auth.response;
  }

  try {
    const { id } = await params;
    const deleted = await deleteHomeActivity(id);

    if (!deleted) {
      return NextResponse.json(
        { error: "Kegiatan mahasiswa tidak ditemukan." },
        { status: 404 }
      );
    }

    await writeAuditLog({
      actor: auth.user,
      request,
      action: `Home Activity: Delete #${id}`,
    });

    return NextResponse.json({
      message: "Kegiatan mahasiswa berhasil dihapus.",
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
      "api:staff:home-activities:id:delete",
      "Kegiatan mahasiswa gagal dihapus."
    );
  }
}
