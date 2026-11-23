/**
 * Aturan login mahasiswa via PAUS (mengikuti sistem ULT lama): setelah PAUS
 * mengembalikan NPM, NPM harus ada di tabel lokal `mahasiswa`. Jika tidak
 * ada, login ditolak dan tidak ada sesi yang dibuat.
 *
 * Modul murni (aman dipakai di client maupun server, tanpa akses DB).
 */
export const LOGIN_ERROR_NPM_NOT_REGISTERED = "NpmNotRegistered";
export const LOGIN_ERROR_REGISTRY_UNAVAILABLE = "RegistryUnavailable";
export const LOGIN_ERROR_ALUMNI_NOT_ALLOWED = "AlumniNotAllowed";
export const LOGIN_ERROR_ACCESS_DENIED = "AccessDenied";

const GENERIC_PAUS_ERROR_MESSAGE =
  "Login PAUS hanya tersedia untuk mahasiswa aktif dengan NPM yang valid.";

/**
 * Pesan aman untuk pengguna. Tidak pernah memuat NPM, email, atau detail
 * profil/token PAUS.
 */
export function getLoginErrorMessage(code: string | null | undefined): string {
  if (!code) return "";

  if (code === LOGIN_ERROR_NPM_NOT_REGISTERED) {
    return "NPM Anda belum terdaftar di data mahasiswa FMIPA. Silakan hubungi ULT FMIPA.";
  }

  if (code === LOGIN_ERROR_ALUMNI_NOT_ALLOWED) {
    return "Akun alumni tidak dapat memakai layanan ini. Silakan hubungi ULT FMIPA.";
  }

  if (code === LOGIN_ERROR_REGISTRY_UNAVAILABLE) {
    return "Data mahasiswa sedang tidak dapat diperiksa. Coba lagi beberapa saat lagi.";
  }

  return GENERIC_PAUS_ERROR_MESSAGE;
}

/**
 * Pemeriksaan NPM ke tabel `mahasiswa` aktif secara default. Dapat dimatikan
 * dengan PAUS_REQUIRE_REGISTERED_NPM=false, misalnya sementara data mahasiswa
 * baru belum diimpor.
 */
export function isRegisteredNpmRequired(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return env.PAUS_REQUIRE_REGISTERED_NPM?.trim().toLowerCase() !== "false";
}
