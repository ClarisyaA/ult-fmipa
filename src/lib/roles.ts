export const APP_ROLES = ["MAHASISWA", "STAFF", "ADMIN"] as const;

export type AppRole = (typeof APP_ROLES)[number];

export const ROLE_LABELS: Record<AppRole, string> = {
  MAHASISWA: "Mahasiswa",
  STAFF: "Staff",
  ADMIN: "Admin",
};

export const STAFF_APP_ROLES = ["STAFF", "ADMIN"] as const;

export type StaffAppRole = (typeof STAFF_APP_ROLES)[number];

export const STAFF_APP_ROLE_LABELS: Record<StaffAppRole, string> = {
  ADMIN: "Administrator",
  STAFF: "Staff",
};

export const USER_POSITION_CODES = [
  "ADMIN",
  "KRS",
  "OPERATOR",
  "PIMPINAN",
  "SUPER_USER",
] as const;

export type UserPositionCode = (typeof USER_POSITION_CODES)[number];

const APP_ROLE_ALIASES: Record<string, AppRole> = {
  ADMIN: "ADMIN",
  STAFF: "STAFF",
  MAHASISWA: "MAHASISWA",
  SISWA: "MAHASISWA",
  STUDENT: "MAHASISWA",
};

const DEFAULT_APP_ROLE_BY_POSITION: Record<string, AppRole> = {
  SUPER_USER: "ADMIN",
  PIMPINAN: "ADMIN",
  ADMIN: "ADMIN",
  OPERATOR: "STAFF",
  KRS: "STAFF",
  STAFF: "STAFF",
  MAHASISWA: "MAHASISWA",
};

export function normalizeAppRole(value: unknown): AppRole | null {
  if (typeof value !== "string") {
    return null;
  }

  return APP_ROLE_ALIASES[value.trim().toUpperCase()] ?? null;
}

export function isRole(value: unknown, role: AppRole) {
  return normalizeAppRole(value) === role;
}

export function isAnyRole(value: unknown, roles: readonly AppRole[]) {
  const role = normalizeAppRole(value);

  return Boolean(role && roles.includes(role));
}

export function getRoleLabel(value: unknown) {
  const role = normalizeAppRole(value);

  return role ? ROLE_LABELS[role] : "Mahasiswa";
}

export function normalizeStaffAppRole(value: unknown): StaffAppRole | null {
  if (typeof value !== "string") {
    return null;
  }

  const role = value.trim().toUpperCase();

  return STAFF_APP_ROLES.includes(role as StaffAppRole)
    ? (role as StaffAppRole)
    : null;
}

export function normalizeUserPosition(value: unknown): UserPositionCode | null {
  if (typeof value !== "string") {
    return null;
  }

  const code = value.trim().toUpperCase();

  return USER_POSITION_CODES.includes(code as UserPositionCode)
    ? (code as UserPositionCode)
    : null;
}

export function getDefaultAppRoleForPosition(positionCode: unknown) {
  if (typeof positionCode !== "string") {
    return null;
  }

  return DEFAULT_APP_ROLE_BY_POSITION[positionCode.trim().toUpperCase()] ?? null;
}

export function resolveAppRole({
  appRole,
  positionCode,
}: {
  appRole?: string | null;
  positionCode?: string | null;
}) {
  return normalizeAppRole(appRole) ?? getDefaultAppRoleForPosition(positionCode);
}

export { normalizeAppRole as normalizeRole };
