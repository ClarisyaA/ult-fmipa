import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit-log";
import { hashLegacyPassword } from "@/lib/auth-db-users";
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

function parsePassword(body: Record<string, unknown>) {
  const password = typeof body.password === "string" ? body.password : "";
  const confirmPassword =
    typeof body.confirmPassword === "string" ? body.confirmPassword : "";

  if (password.length < 6) {
    throw new AdminActionError("Password baru minimal 6 karakter.");
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
    const passwordHash = parsePassword(body);

    const user = await prisma.data_users.findUnique({
      where: { USER_NAME: username },
      select: { USER_NAME: true },
    });

    if (!user) {
      return validationError("User tidak ditemukan.", 404);
    }

    await prisma.data_users.update({
      where: { USER_NAME: username },
      data: {
        PASSWORD: passwordHash,
        TIME_UPDATE: new Date(),
      },
      select: { USER_NAME: true },
    });

    await writeAuditLog({
      actor: auth.user,
      request,
      action: `User: Reset password user: ${username}`,
    });

    return successJson({ username }, "Password user berhasil diperbarui.");
  } catch (error) {
    return handleAdminApiError(
      error,
      "api:admin:system:users:reset-password",
      "Password user gagal diperbarui.",
    );
  }
}
