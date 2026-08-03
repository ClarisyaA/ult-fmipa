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
