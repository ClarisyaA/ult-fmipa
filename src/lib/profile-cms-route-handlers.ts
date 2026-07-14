import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit-log";
import { jsonApiError } from "@/lib/error-utils";
import {
  createProfileLocationHour,
  createProfileOrganizationNode,
  deleteProfileLocationHour,
  deleteProfileOrganizationNode,
  getAdminProfileOrganizationNodes,
  getProfileLocationSettings,
  getProfileLocationState,
  getProfileOrganizationNodeById,
  updateProfileLocationHour,
  updateProfileLocationSettings,
  updateProfileOrganizationNode,
} from "@/lib/profile-cms";
import {
  getProfileCmsApiErrorStatus,
  parseProfileLocationHourRequest,
  parseProfileLocationRequest,
  parseProfileOrganizationRequest,
} from "@/lib/profile-cms-api";
import { saveProfileImage } from "@/lib/profile-image-upload";

type RolePrefix = "admin" | "staff";

function getActorName(user: { name?: string | null; email?: string | null }) {
  return user.name ?? user.email ?? "ULT";
}

async function requireRole(rolePrefix: RolePrefix) {
  const user = await getCurrentUser();

  if (!user) {
    return { user: null, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  if (user.role !== rolePrefix) {
    return { user: null, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { user, response: null };
}

function handledApiError(error: unknown) {
  const apiError = getProfileCmsApiErrorStatus(error);

  if (!apiError) {
    return null;
  }

  return NextResponse.json({ error: apiError.message }, { status: apiError.statusCode });
}

export async function handleProfileOrganizationListGet(rolePrefix: RolePrefix) {
  const auth = await requireRole(rolePrefix);
  if (auth.response) return auth.response;

  try {
    const nodes = await getAdminProfileOrganizationNodes();
    return NextResponse.json({ data: nodes });
  } catch (error) {
    return jsonApiError(
      error,
      `api:${rolePrefix}:profile:organization:get`,
      "Struktur organisasi gagal dimuat."
    );
  }
}

export async function handleProfileOrganizationCreate(
  request: Request,
  rolePrefix: RolePrefix
) {
  const auth = await requireRole(rolePrefix);
  if (auth.response) return auth.response;

  try {
    const { input, imageFile } = await parseProfileOrganizationRequest(
      request,
      getActorName(auth.user)
    );
    const image = imageFile ? await saveProfileImage(imageFile, "organization") : null;
    const node = await createProfileOrganizationNode(input, image);

    await writeAuditLog({
      actor: auth.user,
      request,
      action: `Profile Org: Create #${node?.id ?? "-"}`,
    });

    return NextResponse.json({
      data: node,
      message: "Node struktur berhasil dibuat.",
    });
  } catch (error) {
    return (
      handledApiError(error) ??
      jsonApiError(
        error,
        `api:${rolePrefix}:profile:organization:post`,
        "Node struktur gagal dibuat."
      )
    );
  }
}

export async function handleProfileOrganizationDetailGet(
  rolePrefix: RolePrefix,
  id: string
) {
  const auth = await requireRole(rolePrefix);
  if (auth.response) return auth.response;

  try {
    const node = await getProfileOrganizationNodeById(id);

    if (!node) {
      return NextResponse.json({ error: "Node struktur tidak ditemukan." }, { status: 404 });
    }

    return NextResponse.json({ data: node });
  } catch (error) {
    return (
      handledApiError(error) ??
      jsonApiError(
        error,
        `api:${rolePrefix}:profile:organization:id:get`,
        "Node struktur gagal dimuat."
      )
    );
  }
}

export async function handleProfileOrganizationUpdate(
  request: Request,
  rolePrefix: RolePrefix,
  id: string
) {
  const auth = await requireRole(rolePrefix);
  if (auth.response) return auth.response;

  try {
    const { input, imageFile } = await parseProfileOrganizationRequest(
      request,
      getActorName(auth.user)
    );
    const image = imageFile ? await saveProfileImage(imageFile, "organization") : null;
    const node = await updateProfileOrganizationNode(id, input, image);

    if (!node) {
      return NextResponse.json({ error: "Node struktur tidak ditemukan." }, { status: 404 });
    }

    await writeAuditLog({
      actor: auth.user,
      request,
      action: `Profile Org: Update #${id}`,
    });

    return NextResponse.json({
      data: node,
      message: "Node struktur berhasil diperbarui.",
    });
  } catch (error) {
    return (
      handledApiError(error) ??
      jsonApiError(
        error,
        `api:${rolePrefix}:profile:organization:id:patch`,
        "Node struktur gagal diperbarui."
      )
    );
  }
}

export async function handleProfileOrganizationDelete(
  request: Request,
  rolePrefix: RolePrefix,
  id: string
) {
  const auth = await requireRole(rolePrefix);
  if (auth.response) return auth.response;

  try {
    const deleted = await deleteProfileOrganizationNode(id);

    if (!deleted) {
      return NextResponse.json({ error: "Node struktur tidak ditemukan." }, { status: 404 });
    }

    await writeAuditLog({
      actor: auth.user,
      request,
      action: `Profile Org: Delete #${id}`,
    });

    return NextResponse.json({ message: "Node struktur berhasil dihapus." });
  } catch (error) {
    return (
      handledApiError(error) ??
      jsonApiError(
        error,
        `api:${rolePrefix}:profile:organization:id:delete`,
        "Node struktur gagal dihapus."
      )
    );
  }
}

export async function handleProfileLocationGet(rolePrefix: RolePrefix) {
  const auth = await requireRole(rolePrefix);
  if (auth.response) return auth.response;

  try {
    const { location, unavailable } = await getProfileLocationState();
    return NextResponse.json({ data: location, unavailable });
  } catch (error) {
    return jsonApiError(
      error,
      `api:${rolePrefix}:profile:location:get`,
      "Pengaturan lokasi gagal dimuat."
    );
  }
}

export async function handleProfileLocationUpdate(
  request: Request,
  rolePrefix: RolePrefix
) {
  const auth = await requireRole(rolePrefix);
  if (auth.response) return auth.response;

  try {
    const { input, imageFile } = await parseProfileLocationRequest(
      request,
      getActorName(auth.user)
    );
    const image = imageFile ? await saveProfileImage(imageFile, "location") : null;
    const location = await updateProfileLocationSettings(input, image);

    await writeAuditLog({
      actor: auth.user,
      request,
      action: "Profile Location: Update",
    });

    return NextResponse.json({
      data: location,
      message: "Pengaturan lokasi berhasil diperbarui.",
    });
  } catch (error) {
    return (
      handledApiError(error) ??
      jsonApiError(
        error,
        `api:${rolePrefix}:profile:location:patch`,
        "Pengaturan lokasi gagal diperbarui."
      )
    );
  }
}

export async function handleProfileLocationHourCreate(
  request: Request,
  rolePrefix: RolePrefix
) {
  const auth = await requireRole(rolePrefix);
  if (auth.response) return auth.response;

  try {
    const input = await parseProfileLocationHourRequest(request);
    const location = await createProfileLocationHour(input);

    await writeAuditLog({
      actor: auth.user,
      request,
      action: "Profile Location Hour: Create",
    });

    return NextResponse.json({
      data: location,
      message: "Jam layanan berhasil ditambahkan.",
    });
  } catch (error) {
    return (
      handledApiError(error) ??
      jsonApiError(
        error,
        `api:${rolePrefix}:profile:location:hours:post`,
        "Jam layanan gagal ditambahkan."
      )
    );
  }
}

export async function handleProfileLocationHourUpdate(
  request: Request,
  rolePrefix: RolePrefix,
  id: string
) {
  const auth = await requireRole(rolePrefix);
  if (auth.response) return auth.response;

  try {
    const input = await parseProfileLocationHourRequest(request);
    const location = await updateProfileLocationHour(id, input);

    await writeAuditLog({
      actor: auth.user,
      request,
      action: `Profile Location Hour: Update #${id}`,
    });

    return NextResponse.json({
      data: location,
      message: "Jam layanan berhasil diperbarui.",
    });
  } catch (error) {
    return (
      handledApiError(error) ??
      jsonApiError(
        error,
        `api:${rolePrefix}:profile:location:hours:id:patch`,
        "Jam layanan gagal diperbarui."
      )
    );
  }
}

export async function handleProfileLocationHourDelete(
  request: Request,
  rolePrefix: RolePrefix,
  id: string
) {
  const auth = await requireRole(rolePrefix);
  if (auth.response) return auth.response;

  try {
    const location = await deleteProfileLocationHour(id);

    await writeAuditLog({
      actor: auth.user,
      request,
      action: `Profile Location Hour: Delete #${id}`,
    });

    return NextResponse.json({
      data: location,
      message: "Jam layanan berhasil dihapus.",
    });
  } catch (error) {
    return (
      handledApiError(error) ??
      jsonApiError(
        error,
        `api:${rolePrefix}:profile:location:hours:id:delete`,
        "Jam layanan gagal dihapus."
      )
    );
  }
}

export async function handleProfileLocationPlainGet() {
  try {
    const location = await getProfileLocationSettings(false);
    return NextResponse.json({ data: location });
  } catch (error) {
    return jsonApiError(error, "api:profile:location:get", "Data lokasi gagal dimuat.");
  }
}
