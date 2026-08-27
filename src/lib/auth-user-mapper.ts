import type { AppRole } from "@/lib/roles";

export type { AppRole };

export type AppSessionUser = {
  id: string;
  name: string;
  email?: string | null;
  role: AppRole;
  positionCode?: string;
  accessCode?: string;
  npm?: string;
  nip?: string;
  pausId?: string;
  phone?: string;
};

// PAUS (OAuth and Bridge) is student-only, final business rule: a session
// is only eligible if the mapped user is MAHASISWA with a non-empty NPM.
// Used as a defense-in-depth re-check in the NextAuth signIn callback,
// independent of the PAUS profile/payload mappers that already enforce
// this.
export function isEligiblePausStudentUser(user: {
  role?: AppRole;
  npm?: string | null;
}) {
  return user.role === "MAHASISWA" && Boolean(user.npm?.trim());
}

export function mapDevUserToSessionUser(
  role: AppRole,
  email: string
): AppSessionUser {
  if (role === "ADMIN") {
    return {
      id: "dev-admin",
      name: "Admin ULT",
      email,
      role,
    };
  }

  if (role === "STAFF") {
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
    role: "MAHASISWA",
    npm: process.env.DEV_STUDENT_NPM,
    phone: process.env.DEV_STUDENT_PHONE,
  };
}
