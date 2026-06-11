export type AppRole = "admin" | "staff" | "student";

export type AppSessionUser = {
  id: string;
  name: string;
  email?: string | null;
  role: AppRole;
  npm?: string;
  nip?: string;
  pausId?: string;
  phone?: string;
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
