import type { DefaultSession } from "next-auth";

type AppRole = "admin" | "staff" | "student";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: AppRole;
      npm?: string;
      nip?: string;
      pausId?: string;
      phone?: string;
      provider?: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: AppRole;
    npm?: string;
    nip?: string;
    pausId?: string;
    phone?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role: AppRole;
    npm?: string;
    nip?: string;
    pausId?: string;
    phone?: string;
    provider?: string;
  }
}
