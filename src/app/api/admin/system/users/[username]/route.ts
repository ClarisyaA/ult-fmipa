import { prisma } from "@/lib/prisma";
import {
  AdminActionError,
  cleanString,
  handleAdminApiError,
  parseJsonBody,
  requireAdminApi,
  successJson,
  validationError,
} from "@/lib/admin-master-api";

function normalizeUsername(value: unknown) {
  const username = cleanString(value, 20);
  if (!username) {
    throw new AdminActionError("Username tidak valid.");
  }
  return username;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  try {
    const { username: usernameParam } = await params;
    const username = normalizeUsername(decodeURIComponent(usernameParam));
    const body = await parseJsonBody(request);
    const fullName = cleanString(body.fullName, 50);
    const email = cleanString(body.email, 50);
    const telephone = cleanString(body.telephone, 50) || null;
    const accessCode = cleanString(body.accessCode, 25);
    const unitId = Number(body.unitId);
    const confirmed = body.confirmed === true || body.confirmed === "1" ? "1" : "0";

    if (!fullName) {
      throw new AdminActionError("Nama user wajib diisi.");
    }
    if (!email) {
      throw new AdminActionError("Email user wajib diisi.");
    }
    if (!accessCode) {
      throw new AdminActionError("Kode akses wajib diisi.");
    }
    if (!Number.isInteger(unitId) || unitId <= 0) {
      throw new AdminActionError("Unit wajib dipilih.");
    }

    const [user, access, unit] = await Promise.all([
      prisma.data_users.findUnique({
        where: { USER_NAME: username },
        select: { USER_NAME: true },
      }),
      prisma.data_access.findUnique({
        where: { ACCESS_CODE: accessCode },
        select: { ACCESS_CODE: true },
      }),
      prisma.data_unit.findUnique({
        where: { UNIT_ID: BigInt(unitId) },
        select: { UNIT_ID: true },
      }),
    ]);

    if (!user) {
      return validationError("User tidak ditemukan.", 404);
    }
    if (!access) {
      throw new AdminActionError("Kode akses tidak ditemukan.");
    }
    if (!unit) {
      throw new AdminActionError("Unit tidak ditemukan.");
    }

    const row = await prisma.data_users.update({
      where: { USER_NAME: username },
      data: {
        FULL_NAME: fullName,
        EMAIL: email,
        TELEPHONE: telephone,
        ACCESS_CODE: accessCode,
        UNIT_ID: unitId,
        CONFIRMED: confirmed,
        TIME_UPDATE: new Date(),
      },
      select: {
        USER_NAME: true,
        FULL_NAME: true,
        EMAIL: true,
        TELEPHONE: true,
        CONFIRMED: true,
        ACCESS_CODE: true,
        UNIT_ID: true,
      },
    });

    return successJson(row, "Data user berhasil diperbarui.");
  } catch (error) {
    return handleAdminApiError(
      error,
      "api:admin:system:users:update",
      "Data user gagal diperbarui.",
    );
  }
}
