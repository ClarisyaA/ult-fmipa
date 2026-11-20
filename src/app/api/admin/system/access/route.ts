import { writeAuditLog } from "@/lib/audit-log";
import {
  AdminActionError,
  cleanString,
  handleAdminApiError,
  parseJsonBody,
  requireAdminApi,
  successJson,
} from "@/lib/admin-master-api";
import { isStaffFeatureKey, STAFF_FEATURES } from "@/lib/feature-access-core";
import { setFeatureGrant } from "@/lib/feature-access";
import { prisma } from "@/lib/prisma";
import { resolveAppRole } from "@/lib/roles";

/**
 * Admin memberi atau mencabut akses fitur untuk satu akun Staff.
 * Body: { userName: string, feature: "mahasiswa.import", granted: boolean }
 */
export async function PUT(request: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  try {
    const body = await parseJsonBody(request);
    const userName = cleanString(body.userName, 20);

    if (!userName) {
      throw new AdminActionError("Username wajib diisi.");
    }

    const feature: unknown = body.feature;

    if (!isStaffFeatureKey(feature)) {
      throw new AdminActionError("Fitur tidak dikenal.");
    }

    if (typeof body.granted !== "boolean") {
      throw new AdminActionError("Nilai granted harus true atau false.");
    }

    const target = await prisma.data_users.findUnique({
      where: { USER_NAME: userName },
      select: { USER_NAME: true, APP_ROLE: true, ACCESS_CODE: true },
    });

    if (!target) {
      throw new AdminActionError("Akun tidak ditemukan.", 404);
    }

    // Akses fitur hanya relevan untuk Staff. Admin sudah punya semua akses.
    const role = resolveAppRole({
      appRole: target.APP_ROLE,
      positionCode: target.ACCESS_CODE,
    });

    if (role !== "STAFF") {
      throw new AdminActionError(
        "Akses fitur hanya dapat diatur untuk akun Staff.",
      );
    }

    const granted: boolean = body.granted;

    await setFeatureGrant({
      userName: target.USER_NAME,
      feature,
      granted,
      grantedBy: auth.user.email ?? auth.user.name ?? auth.user.id ?? "admin",
    });

    await writeAuditLog({
      actor: auth.user,
      request,
      action: `Akses: ${granted ? "Memberi" : "Mencabut"} ${feature} untuk ${target.USER_NAME}`,
    });

    return successJson(
      { userName: target.USER_NAME, feature, granted },
      granted
        ? `Akses ${STAFF_FEATURES[feature].label} diberikan.`
        : `Akses ${STAFF_FEATURES[feature].label} dicabut.`,
    );
  } catch (error) {
    return handleAdminApiError(
      error,
      "api:admin:system:access:update",
      "Akses gagal diperbarui.",
    );
  }
}
