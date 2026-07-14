import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit-log";
import { hashLegacyPassword, mapAccessCodeToRole } from "@/lib/auth-db-users";
import {
  AdminActionError,
  cleanString,
  handleAdminApiError,
  parseJsonBody,
  requireAdminApi,
  successJson,
  validationError,
} from "@/lib/admin-master-api";

const DELETE_BLOCKED_MESSAGE =
  "Akun tidak dapat dihapus karena masih memiliki riwayat aktivitas. Nonaktifkan akun sebagai alternatif.";

function normalizeUsername(value: unknown) {
  const username = cleanString(value, 20);
  if (!username) {
    throw new AdminActionError("Username tidak valid.");
  }
  return username;
}

function getCurrentLegacyUsername(userId: string | undefined) {
  return userId?.startsWith("legacy-") ? userId.slice("legacy-".length) : null;
}

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(phone: string) {
  return !phone || /^[0-9+\-\s().]{5,50}$/.test(phone);
}

function parseOptionalPassword(body: Record<string, unknown>) {
  const password = typeof body.password === "string" ? body.password : "";
  const confirmPassword =
    typeof body.confirmPassword === "string" ? body.confirmPassword : "";

  if (!password && !confirmPassword) {
    return null;
  }
  if (password.length < 8) {
    throw new AdminActionError("Password baru minimal 8 karakter.");
  }
  if (password !== confirmPassword) {
    throw new AdminActionError("Konfirmasi password baru tidak cocok.");
  }

  return hashLegacyPassword(password);
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
    const accessCode = cleanString(body.accessCode, 25).toUpperCase();
    const unitId = Number(body.unitId);
    const confirmed = body.confirmed === true || body.confirmed === "1" ? "1" : "0";
    const passwordHash = parseOptionalPassword(body);
    const currentUsername = getCurrentLegacyUsername(auth.user.id);
    const isSelf = currentUsername === username || auth.user.email === email;

    if (!fullName) {
      throw new AdminActionError("Nama user wajib diisi.");
    }
    if (!email || !validateEmail(email)) {
      throw new AdminActionError("Email user tidak valid.");
    }
    if (!validatePhone(telephone ?? "")) {
      throw new AdminActionError("Nomor telepon tidak valid.");
    }
    if (!accessCode || !mapAccessCodeToRole(accessCode)) {
      throw new AdminActionError("Kode akses harus berupa role admin/staff yang valid.");
    }
    if (!Number.isInteger(unitId) || unitId <= 0) {
      throw new AdminActionError("Unit wajib dipilih.");
    }

    const [user, access, unit] = await Promise.all([
      prisma.data_users.findUnique({
        where: { USER_NAME: username },
        select: {
          USER_NAME: true,
          EMAIL: true,
          CONFIRMED: true,
          ACCESS_CODE: true,
          UNIT_ID: true,
        },
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
    if (isSelf && confirmed !== "1") {
      throw new AdminActionError("Akun yang sedang login tidak dapat dinonaktifkan.");
    }
    if (isSelf && mapAccessCodeToRole(accessCode) !== "admin") {
      throw new AdminActionError(
        "Akun yang sedang login tidak dapat diturunkan dari akses admin.",
      );
    }
    if (isSelf && unitId !== user.UNIT_ID) {
      throw new AdminActionError(
        "Unit akun yang sedang login tidak dapat diubah dari halaman ini.",
      );
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
        ...(passwordHash ? { PASSWORD: passwordHash } : {}),
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
    const activity = passwordHash
      ? `User: Reset password user: ${row.USER_NAME}`
      : confirmed !== user.CONFIRMED
        ? `User: ${confirmed === "1" ? "Mengaktifkan" : "Menonaktifkan"} user: ${row.USER_NAME}`
        : `User: Mengubah data user: ${row.USER_NAME}`;
    await writeAuditLog({
      actor: auth.user,
      request,
      action: activity,
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

async function countUserReferences(username: string, fullName: string) {
  const names = Array.from(new Set([username, fullName].filter(Boolean)));
  const [
    logs,
    beasiswa,
    bebasPinjaman,
    kks,
    kpa,
    permohonanMagang,
    suratIzinKegiatan,
  ] = await Promise.all([
    prisma.log_users.count({ where: { USER_NAME: username } }),
    prisma.beasiswa.count({
      where: { OR: [{ PROSES_STAF: { in: names } }, { SELESAI_STAF: { in: names } }] },
    }),
    prisma.bebas_pinjaman.count({
      where: { OR: [{ PROSES_STAF: { in: names } }, { SELESAI_STAF: { in: names } }] },
    }),
    prisma.kks.count({
      where: { OR: [{ PROSES_STAF: { in: names } }, { SELESAI_STAF: { in: names } }] },
    }),
    prisma.kpa.count({
      where: { OR: [{ PROSES_STAF: { in: names } }, { SELESAI_STAF: { in: names } }] },
    }),
    prisma.permohonan_magang.count({
      where: { OR: [{ PROSES_STAF: { in: names } }, { SELESAI_STAF: { in: names } }] },
    }),
    prisma.surat_izin_kegiatan.count({
      where: { OR: [{ PROSES_STAF: { in: names } }, { SELESAI_STAF: { in: names } }] },
    }),
  ]);

  return (
    logs +
    beasiswa +
    bebasPinjaman +
    kks +
    kpa +
    permohonanMagang +
    suratIzinKegiatan
  );
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  try {
    const { username: usernameParam } = await params;
    const username = normalizeUsername(decodeURIComponent(usernameParam));
    const currentUsername = getCurrentLegacyUsername(auth.user.id);

    if (currentUsername === username) {
      throw new AdminActionError("Akun yang sedang login tidak dapat dihapus.");
    }

    const user = await prisma.data_users.findUnique({
      where: { USER_NAME: username },
      select: {
        USER_NAME: true,
        FULL_NAME: true,
        EMAIL: true,
      },
    });

    if (!user) {
      return validationError("User tidak ditemukan.", 404);
    }
    if (auth.user.email === user.EMAIL) {
      throw new AdminActionError("Akun yang sedang login tidak dapat dihapus.");
    }

    const referenceCount = await countUserReferences(
      user.USER_NAME,
      user.FULL_NAME,
    );

    if (referenceCount > 0) {
      throw new AdminActionError(DELETE_BLOCKED_MESSAGE);
    }

    await prisma.data_users.delete({ where: { USER_NAME: username } });
    await writeAuditLog({
      actor: auth.user,
      request: _request,
      action: `User: Menghapus user: ${username}`,
    });

    return successJson({ username }, "User berhasil dihapus.");
  } catch (error) {
    return handleAdminApiError(
      error,
      "api:admin:system:users:delete",
      "User gagal dihapus.",
    );
  }
}
