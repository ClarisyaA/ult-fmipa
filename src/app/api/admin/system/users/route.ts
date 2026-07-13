import { prisma } from "@/lib/prisma";
import { hashLegacyPassword, mapAccessCodeToRole } from "@/lib/auth-db-users";
import {
  AdminActionError,
  cleanString,
  handleAdminApiError,
  parseJsonBody,
  requireAdminApi,
  successJson,
} from "@/lib/admin-master-api";

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(phone: string) {
  return !phone || /^[0-9+\-\s().]{5,50}$/.test(phone);
}

function parsePassword(body: Record<string, unknown>, required: boolean) {
  const password = typeof body.password === "string" ? body.password : "";
  const confirmPassword =
    typeof body.confirmPassword === "string" ? body.confirmPassword : "";

  if (!required && !password && !confirmPassword) {
    return null;
  }
  if (password.length < 8) {
    throw new AdminActionError("Password minimal 8 karakter.");
  }
  if (password !== confirmPassword) {
    throw new AdminActionError("Konfirmasi password tidak cocok.");
  }

  return hashLegacyPassword(password);
}

export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  try {
    const body = await parseJsonBody(request);
    const username = cleanString(body.username, 20);
    const fullName = cleanString(body.fullName, 50);
    const email = cleanString(body.email, 50);
    const telephone = cleanString(body.telephone, 50);
    const accessCode = cleanString(body.accessCode, 25).toUpperCase();
    const unitId = Number(body.unitId);
    const confirmed = body.confirmed === true || body.confirmed === "1" ? "1" : "0";
    const passwordHash = parsePassword(body, true);

    if (!username) {
      throw new AdminActionError("Username wajib diisi.");
    }
    if (!fullName) {
      throw new AdminActionError("Nama user wajib diisi.");
    }
    if (!email || !validateEmail(email)) {
      throw new AdminActionError("Email user tidak valid.");
    }
    if (!validatePhone(telephone)) {
      throw new AdminActionError("Nomor telepon tidak valid.");
    }
    if (!accessCode || !mapAccessCodeToRole(accessCode)) {
      throw new AdminActionError("Kode akses harus berupa role admin/staff yang valid.");
    }
    if (!Number.isInteger(unitId) || unitId <= 0) {
      throw new AdminActionError("Unit wajib dipilih.");
    }
    if (!passwordHash) {
      throw new AdminActionError("Password wajib diisi.");
    }

    const [existing, access, unit] = await Promise.all([
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

    if (existing) {
      throw new AdminActionError("Username sudah digunakan.");
    }
    if (!access) {
      throw new AdminActionError("Kode akses tidak ditemukan.");
    }
    if (!unit) {
      throw new AdminActionError("Unit tidak ditemukan.");
    }

    const row = await prisma.data_users.create({
      data: {
        USER_NAME: username,
        FULL_NAME: fullName,
        EMAIL: email,
        TELEPHONE: telephone || null,
        CONFIRMED: confirmed,
        PASSWORD: passwordHash,
        UNIT_ID: unitId,
        ACCESS_CODE: accessCode,
        TIME_INSERT: new Date(),
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

    return successJson(row, "User berhasil ditambahkan.", 201);
  } catch (error) {
    return handleAdminApiError(
      error,
      "api:admin:system:users:create",
      "User gagal ditambahkan.",
    );
  }
}
