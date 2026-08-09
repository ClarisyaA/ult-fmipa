import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit-log";
import { jsonApiError } from "@/lib/error-utils";
import { isRole } from "@/lib/roles";
import {
  createProfileStructureItem,
  createProfileStructureNode,
  deleteProfileStructureItem,
  deleteProfileStructureNode,
  getAdminProfileStructureState,
  getProfileStructureApiErrorStatus,
  updateProfileStructureItem,
  updateProfileStructureNode,
  updateProfileStructureSettings,
} from "@/lib/profile-structure-cms";

type RolePrefix = "admin" | "staff";

function getActorName(user: { name?: string | null; email?: string | null }) {
  return user.name ?? user.email ?? "ULT";
}

async function requireRole(rolePrefix: RolePrefix) {
  const user = await getCurrentUser();

  if (!user) {
    return { user: null, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  if (!isRole(user.role, rolePrefix === "admin" ? "ADMIN" : "STAFF")) {
    return { user: null, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { user, response: null };
}

function handledApiError(error: unknown) {
  const apiError = getProfileStructureApiErrorStatus(error);

  if (!apiError) {
    return null;
  }

  return NextResponse.json({ error: apiError.message }, { status: apiError.statusCode });
}

export async function handleProfileStructureStateGet(rolePrefix: RolePrefix) {
  const auth = await requireRole(rolePrefix);
  if (auth.response) return auth.response;

  try {
    const state = await getAdminProfileStructureState();
    return NextResponse.json({ data: state });
  } catch (error) {
    return jsonApiError(
      error,
      `api:${rolePrefix}:profile:structure:get`,
      "Struktur profil gagal dimuat."
    );
  }
}

export async function handleProfileStructureSettingsUpdate(request: Request, rolePrefix: RolePrefix) {
  const auth = await requireRole(rolePrefix);
  if (auth.response) return auth.response;

  try {
    const body = (await request.json().catch(() => null)) as {
      title?: string;
      subtitle?: string | null;
    } | null;

    const settings = await updateProfileStructureSettings({
      title: body?.title ?? "",
      subtitle: body?.subtitle,
      actor: getActorName(auth.user),
    });

    await writeAuditLog({
      actor: auth.user,
      request,
      action: "Profile Structure: Update Settings",
    });

    return NextResponse.json({ data: settings, message: "Pengaturan section berhasil disimpan." });
  } catch (error) {
    return (
      handledApiError(error) ??
      jsonApiError(
        error,
        `api:${rolePrefix}:profile:structure:settings:patch`,
        "Pengaturan section gagal disimpan."
      )
    );
  }
}

export async function handleProfileStructureNodeCreate(request: Request, rolePrefix: RolePrefix) {
  const auth = await requireRole(rolePrefix);
  if (auth.response) return auth.response;

  try {
    const body = (await request.json().catch(() => null)) as {
      parentId?: string | null;
      label?: string;
      nodeType?: string | null;
      sortOrder?: number | string | null;
      isActive?: boolean | string | null;
    } | null;

    const node = await createProfileStructureNode({
      parentId: body?.parentId,
      label: body?.label ?? "",
      nodeType: body?.nodeType,
      sortOrder: body?.sortOrder,
      isActive: body?.isActive,
      actor: getActorName(auth.user),
    });

    await writeAuditLog({
      actor: auth.user,
      request,
      action: `Profile Structure: Create Node #${node?.id ?? "-"}`,
    });

    return NextResponse.json({ data: node, message: "Node struktur berhasil dibuat." });
  } catch (error) {
    return (
      handledApiError(error) ??
      jsonApiError(
        error,
        `api:${rolePrefix}:profile:structure:nodes:post`,
        "Node struktur gagal dibuat."
      )
    );
  }
}

export async function handleProfileStructureNodeUpdate(
  request: Request,
  rolePrefix: RolePrefix,
  id: string
) {
  const auth = await requireRole(rolePrefix);
  if (auth.response) return auth.response;

  try {
    const body = (await request.json().catch(() => null)) as {
      parentId?: string | null;
      label?: string;
      nodeType?: string | null;
      sortOrder?: number | string | null;
      isActive?: boolean | string | null;
    } | null;

    const node = await updateProfileStructureNode(id, {
      parentId: body?.parentId,
      label: body?.label ?? "",
      nodeType: body?.nodeType,
      sortOrder: body?.sortOrder,
      isActive: body?.isActive,
      actor: getActorName(auth.user),
    });

    if (!node) {
      return NextResponse.json({ error: "Node struktur tidak ditemukan." }, { status: 404 });
    }

    await writeAuditLog({
      actor: auth.user,
      request,
      action: `Profile Structure: Update Node #${id}`,
    });

    return NextResponse.json({ data: node, message: "Node struktur berhasil diperbarui." });
  } catch (error) {
    return (
      handledApiError(error) ??
      jsonApiError(
        error,
        `api:${rolePrefix}:profile:structure:nodes:id:patch`,
        "Node struktur gagal diperbarui."
      )
    );
  }
}

export async function handleProfileStructureNodeDelete(
  request: Request,
  rolePrefix: RolePrefix,
  id: string
) {
  const auth = await requireRole(rolePrefix);
  if (auth.response) return auth.response;

  try {
    const url = new URL(request.url);
    const cascade = url.searchParams.get("cascade") === "true";
    const deleted = await deleteProfileStructureNode(id, { cascade });

    if (!deleted) {
      return NextResponse.json({ error: "Node struktur tidak ditemukan." }, { status: 404 });
    }

    await writeAuditLog({
      actor: auth.user,
      request,
      action: `Profile Structure: Delete Node #${id}${cascade ? " (cascade)" : ""}`,
    });

    return NextResponse.json({ message: "Node struktur berhasil dihapus." });
  } catch (error) {
    return (
      handledApiError(error) ??
      jsonApiError(
        error,
        `api:${rolePrefix}:profile:structure:nodes:id:delete`,
        "Node struktur gagal dihapus."
      )
    );
  }
}

export async function handleProfileStructureItemCreate(request: Request, rolePrefix: RolePrefix) {
  const auth = await requireRole(rolePrefix);
  if (auth.response) return auth.response;

  try {
    const body = (await request.json().catch(() => null)) as {
      nodeId?: string;
      content?: string;
      sortOrder?: number | string | null;
    } | null;

    const node = await createProfileStructureItem({
      nodeId: body?.nodeId ?? "",
      content: body?.content ?? "",
      sortOrder: body?.sortOrder,
      actor: getActorName(auth.user),
    });

    if (!node) {
      return NextResponse.json({ error: "Node struktur tidak ditemukan." }, { status: 404 });
    }

    await writeAuditLog({
      actor: auth.user,
      request,
      action: `Profile Structure: Create Item (node #${body?.nodeId ?? "-"})`,
    });

    return NextResponse.json({ data: node, message: "Isian berhasil ditambahkan." });
  } catch (error) {
    return (
      handledApiError(error) ??
      jsonApiError(
        error,
        `api:${rolePrefix}:profile:structure:items:post`,
        "Isian gagal ditambahkan."
      )
    );
  }
}

export async function handleProfileStructureItemUpdate(
  request: Request,
  rolePrefix: RolePrefix,
  id: string
) {
  const auth = await requireRole(rolePrefix);
  if (auth.response) return auth.response;

  try {
    const body = (await request.json().catch(() => null)) as {
      content?: string;
      sortOrder?: number | string | null;
      isActive?: boolean | string | null;
    } | null;

    const node = await updateProfileStructureItem(id, {
      content: body?.content ?? "",
      sortOrder: body?.sortOrder,
      isActive: body?.isActive,
      actor: getActorName(auth.user),
    });

    if (!node) {
      return NextResponse.json({ error: "Isian tidak ditemukan." }, { status: 404 });
    }

    await writeAuditLog({
      actor: auth.user,
      request,
      action: `Profile Structure: Update Item #${id}`,
    });

    return NextResponse.json({ data: node, message: "Isian berhasil diperbarui." });
  } catch (error) {
    return (
      handledApiError(error) ??
      jsonApiError(
        error,
        `api:${rolePrefix}:profile:structure:items:id:patch`,
        "Isian gagal diperbarui."
      )
    );
  }
}

export async function handleProfileStructureItemDelete(
  request: Request,
  rolePrefix: RolePrefix,
  id: string
) {
  const auth = await requireRole(rolePrefix);
  if (auth.response) return auth.response;

  try {
    const deleted = await deleteProfileStructureItem(id);

    if (!deleted) {
      return NextResponse.json({ error: "Isian tidak ditemukan." }, { status: 404 });
    }

    await writeAuditLog({
      actor: auth.user,
      request,
      action: `Profile Structure: Delete Item #${id}`,
    });

    return NextResponse.json({ message: "Isian berhasil dihapus." });
  } catch (error) {
    return (
      handledApiError(error) ??
      jsonApiError(
        error,
        `api:${rolePrefix}:profile:structure:items:id:delete`,
        "Isian gagal dihapus."
      )
    );
  }
}
