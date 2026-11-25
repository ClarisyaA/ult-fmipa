import type { AppSessionUser } from "@/lib/auth-user-mapper";

/**
 * Profil dari endpoint userinfo PAuS.
 *
 * Bentuk datanya belum dikunci oleh DPSI ("struktur final ditentukan oleh
 * PAuS - tangani secara defensif"), jadi pembaca di bawah menerima beberapa
 * bentuk sekaligus:
 *  1. gaya lama     : { attributes: { npm: { attribute_value: "..." } } }
 *  2. bentuk datar  : { npm: "...", nama: "...", paus_id: "..." }
 *  3. akun aktif    : { accounts: [{ is_active: true, npm: "..." }] }
 * Urutan pencarian per field: attributes -> datar -> akun aktif pertama.
 */
export type PausProfile = Record<string, unknown>;

type PlainRecord = Record<string, unknown>;

function isRecord(value: unknown): value is PlainRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toText(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    for (const item of value) {
      const text = toText(item);
      if (text) return text;
    }
    return undefined;
  }

  if (typeof value === "string") {
    return value.trim() || undefined;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return undefined;
}

// Panduan PAuS: "gunakan akun pertama yang is_active = true".
function getFirstActiveAccount(profile: PlainRecord): PlainRecord | undefined {
  if (!Array.isArray(profile.accounts)) return undefined;

  return profile.accounts.find(
    (account): account is PlainRecord =>
      isRecord(account) && account.is_active === true,
  );
}

export function pickPausValue(
  profile: unknown,
  keys: string[],
): string | undefined {
  if (!isRecord(profile)) return undefined;

  const attributes = isRecord(profile.attributes) ? profile.attributes : undefined;
  const account = getFirstActiveAccount(profile);

  for (const key of keys) {
    const attribute = attributes?.[key];
    const fromAttributes = isRecord(attribute) ? attribute.attribute_value : undefined;
    const value =
      toText(fromAttributes) ?? toText(profile[key]) ?? toText(account?.[key]);

    if (value) return value;
  }

  return undefined;
}

// PAUS OAuth is student-only (business rule, final): a session can only be
// created for a profile that carries a non-empty NPM. NIP alone (dosen/
// staff attribute) must never grant a role - Staff/Admin authorization
// comes exclusively from data_users.APP_ROLE via the Credentials provider.
export type PausStudentProfile = {
  npm: string;
  name: string;
  email?: string;
  nip?: string;
  pausId?: string;
};

// Pure, directly testable: returns the eligible student profile, or null if
// the PAUS profile does not carry a usable NPM (missing, empty, whitespace-
// only, or an otherwise malformed profile). NIP presence never substitutes
// for a missing NPM.
export function normalizePausStudentProfile(
  profile: unknown,
): PausStudentProfile | null {
  if (!isRecord(profile)) {
    return null;
  }

  const npm = pickPausValue(profile, ["npm", "NPM"]);

  if (!npm) {
    return null;
  }

  return {
    npm,
    name: pickPausValue(profile, ["nama", "name"]) ?? "Mahasiswa PAUS",
    email: pickPausValue(profile, ["email"]),
    nip: pickPausValue(profile, ["nip"]),
    pausId: pickPausValue(profile, ["paus_id", "pausId"]),
  };
}

export function mapPausProfileToSessionUser(profile: unknown): AppSessionUser {
  const student = normalizePausStudentProfile(profile);

  if (!student) {
    // Caught by NextAuth as a provider sign-in failure - no session is
    // created, and no raw profile/NPM/email/token is included in this
    // message.
    throw new Error(
      "Login PAUS hanya tersedia untuk mahasiswa aktif dengan NPM yang valid."
    );
  }

  const raw = profile as PlainRecord;

  return {
    id:
      student.pausId ??
      toText(raw.sub) ??
      toText(raw.id) ??
      `paus-npm-${student.npm}`,
    name: student.name,
    email: student.email,
    role: "MAHASISWA",
    npm: student.npm,
    nip: student.nip,
    pausId: student.pausId,
  };
}

/**
 * Gambaran bentuk profil untuk log diagnosis: hanya NAMA field dan TIPE
 * nilainya, tidak pernah nilainya (nilai berisi data pribadi). Dipakai saat
 * AUTH_DEBUG=true untuk melihat bentuk respons userinfo PAuS yang asli.
 */
export function describePausProfileShape(value: unknown, depth = 0): string {
  if (Array.isArray(value)) {
    if (value.length === 0) return "array(0)";
    return depth >= 4
      ? `array(${value.length})`
      : `array(${value.length})[${describePausProfileShape(value[0], depth + 1)}]`;
  }

  if (isRecord(value)) {
    if (depth >= 4) return "object";
    const parts = Object.keys(value)
      .sort()
      .map((key) => `${key}:${describePausProfileShape(value[key], depth + 1)}`);
    return `{${parts.join(", ")}}`;
  }

  if (value === null) return "null";
  return typeof value;
}

type Env = Record<string, string | undefined>;

function splitList(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Penolakan alumni / bukan mahasiswa aktif memakai penanda dari PAuS.
 * Nonaktif sampai DPSI menyebut nama field-nya:
 *
 *   PAUS_ALUMNI_FIELD    nama field penanda, mis. "status" (kosong = nonaktif)
 *   PAUS_ALUMNI_VALUES   nilai yang berarti alumni (default "alumni,lulus")
 *   PAUS_ACTIVE_VALUES   opsional: bila diisi, hanya nilai-nilai ini yang boleh
 *                        masuk; nilai lain atau field kosong ditolak
 */
export function isPausAlumniProfile(
  profile: unknown,
  env: Env = process.env,
): boolean {
  const field = env.PAUS_ALUMNI_FIELD?.trim();

  if (!field || !isRecord(profile)) {
    return false;
  }

  const actual = pickPausValue(profile, [field])?.toLowerCase();
  const activeValues = splitList(env.PAUS_ACTIVE_VALUES);

  if (activeValues.length > 0) {
    return !actual || !activeValues.includes(actual);
  }

  const alumniValues = splitList(env.PAUS_ALUMNI_VALUES ?? "alumni,lulus");

  return Boolean(actual && alumniValues.includes(actual));
}
