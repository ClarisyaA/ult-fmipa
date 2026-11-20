import {
  LOGIN_ERROR_NPM_NOT_REGISTERED,
  LOGIN_ERROR_REGISTRY_UNAVAILABLE,
  isRegisteredNpmRequired,
} from "@/lib/paus-login-policy";
import { logServerError } from "@/lib/error-utils";
import { prisma } from "@/lib/prisma";

export async function isNpmRegistered(npm: string): Promise<boolean> {
  const row = await prisma.mahasiswa.findUnique({
    where: { NPM: npm.trim() },
    select: { NPM: true },
  });

  return Boolean(row);
}

/**
 * Untuk callback signIn NextAuth: `true` bila boleh lanjut, atau string URL
 * (halaman login dengan kode error) bila ditolak. Gagal tertutup: jika tabel
 * tidak bisa diperiksa, login mahasiswa ditolak.
 */
export async function checkPausStudentRegistered(
  npm: string | null | undefined,
): Promise<true | string> {
  if (!isRegisteredNpmRequired()) return true;

  if (!npm?.trim()) {
    return `/login?error=${LOGIN_ERROR_NPM_NOT_REGISTERED}`;
  }

  try {
    return (await isNpmRegistered(npm))
      ? true
      : `/login?error=${LOGIN_ERROR_NPM_NOT_REGISTERED}`;
  } catch (error) {
    logServerError("auth:paus:registry", error);
    return `/login?error=${LOGIN_ERROR_REGISTRY_UNAVAILABLE}`;
  }
}
