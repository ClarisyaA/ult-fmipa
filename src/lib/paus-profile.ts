import type { AppSessionUser } from "@/lib/auth-user-mapper";

type PausAttributeValue = string | string[] | null | undefined;

export type PausProfile = {
  sub?: string;
  id?: string;
  name?: string;
  email?: string | null;
  attributes?: Record<
    string,
    {
      attribute_value?: PausAttributeValue;
    }
  >;
};

export function getPausAttribute(
  profile: PausProfile,
  key: string
): PausAttributeValue {
  return profile.attributes?.[key]?.attribute_value;
}

export function normalizePausNpm(value: PausAttributeValue) {
  return normalizePausAttributeValue(value);
}

export function normalizePausAttributeValue(value: PausAttributeValue) {
  if (Array.isArray(value)) {
    return value.find((item) => item.trim())?.trim();
  }

  if (typeof value === "string") {
    return value.trim() || undefined;
  }

  return undefined;
}

function normalizePausText(value: PausAttributeValue) {
  return normalizePausAttributeValue(value);
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

function normalizePausEmail(value: string | null | undefined) {
  if (typeof value !== "string") {
    return undefined;
  }

  return value.trim() || undefined;
}

// Pure, directly testable: returns the eligible student profile, or null if
// the PAUS profile does not carry a usable NPM (missing, empty, whitespace-
// only, or an otherwise malformed profile). NIP presence never substitutes
// for a missing NPM.
export function normalizePausStudentProfile(
  profile: PausProfile | null | undefined
): PausStudentProfile | null {
  if (!profile) {
    return null;
  }

  const npm = normalizePausNpm(getPausAttribute(profile, "npm"));

  if (!npm) {
    return null;
  }

  const name = normalizePausText(getPausAttribute(profile, "nama"));
  const nip = normalizePausText(getPausAttribute(profile, "nip"));
  const pausId = normalizePausText(getPausAttribute(profile, "paus_id"));
  const email = normalizePausEmail(profile.email);

  return {
    npm,
    name: name ?? "Mahasiswa PAUS",
    email,
    nip,
    pausId,
  };
}

export function mapPausProfileToSessionUser(
  profile: PausProfile
): AppSessionUser {
  const student = normalizePausStudentProfile(profile);

  if (!student) {
    // Caught by NextAuth as a provider sign-in failure - no session is
    // created, and no raw profile/NPM/email/token is included in this
    // message.
    throw new Error(
      "Login PAUS hanya tersedia untuk mahasiswa aktif dengan NPM yang valid."
    );
  }

  return {
    id: student.pausId ?? profile.sub ?? profile.id ?? `paus-npm-${student.npm}`,
    name: student.name,
    email: student.email,
    role: "MAHASISWA",
    npm: student.npm,
    nip: student.nip,
    pausId: student.pausId,
  };
}
