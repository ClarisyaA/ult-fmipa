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

export function mapPausProfileToSessionUser(
  profile: PausProfile
): AppSessionUser {
  const name = normalizePausText(getPausAttribute(profile, "nama"));
  const npm = normalizePausNpm(getPausAttribute(profile, "npm"));
  const nip = normalizePausText(getPausAttribute(profile, "nip"));
  const pausId = normalizePausText(getPausAttribute(profile, "paus_id"));

  return {
    id: pausId ?? profile.sub ?? profile.id ?? profile.email ?? "paus-user",
    name: name ?? "Pengguna PAUS",
    email: profile.email,
    role: npm ? "MAHASISWA" : nip ? "STAFF" : "MAHASISWA",
    npm,
    nip,
    pausId,
  };
}
