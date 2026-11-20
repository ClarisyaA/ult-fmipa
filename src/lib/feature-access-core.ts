/**
 * Daftar fitur yang bisa diberikan (grant) ke akun Staff oleh Admin.
 * Admin selalu punya akses ke semua fitur. Fitur baru cukup ditambahkan di sini.
 *
 * Modul murni (tanpa akses DB) agar mudah diuji.
 */
export const STAFF_FEATURES = {
  "mahasiswa.import": {
    label: "Import Data Mahasiswa",
    description:
      "Mengunggah file Excel/CSV untuk menambah dan memperbarui data mahasiswa.",
  },
} as const;

export type StaffFeatureKey = keyof typeof STAFF_FEATURES;

export const STAFF_FEATURE_KEYS = Object.keys(STAFF_FEATURES) as StaffFeatureKey[];

export function isStaffFeatureKey(value: unknown): value is StaffFeatureKey {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(STAFF_FEATURES, value)
  );
}

/** Akun Staff/Admin dari database punya id sesi `legacy-<USER_NAME>`. */
export function dbUserNameFromSessionUserId(
  id: string | null | undefined,
): string | null {
  if (typeof id !== "string" || !id.startsWith("legacy-")) {
    return null;
  }

  const userName = id.slice("legacy-".length).trim();

  return userName ? userName : null;
}
