export type AppRole = "admin" | "staff" | "student";

export type AppSessionUser = {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  npm?: string;
  phone?: string;
};

type PausProfile = {
  sub?: string;
  id?: string;
  name?: string;
  email?: string;
  npm?: string;
  phone?: string;
  role?: AppRole;
};

export function mapDevUserToSessionUser(
  role: AppRole,
  email: string
): AppSessionUser {
  if (role === "admin") {
    return {
      id: "dev-admin",
      name: "Admin ULT",
      email,
      role,
    };
  }

  if (role === "staff") {
    return {
      id: "dev-staff",
      name: "Staff ULT",
      email,
      role,
    };
  }

  return {
    id: "dev-student",
    name: process.env.DEV_STUDENT_NAME || "Mahasiswa ULT",
    email,
    role,
    npm: process.env.DEV_STUDENT_NPM,
    phone: process.env.DEV_STUDENT_PHONE,
  };
}

export function mapPausProfileToSessionUser(
  profile: PausProfile
): AppSessionUser {
  // TODO(PAUS): Confirm exact profile fields with Unpad.
  // Expected data: name, email, NPM or stable identifier, and role if available.
  return {
    id: profile.sub ?? profile.id ?? profile.email ?? "paus-user",
    name: profile.name ?? "Pengguna PAUS",
    email: profile.email ?? "",
    role: profile.role ?? "student",
    npm: profile.npm,
    phone: profile.phone,
  };
}
