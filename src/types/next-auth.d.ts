import type { DefaultSession } from "next-auth";

type AppRole = "admin" | "staff" | "student";

declare module "next-auth" {
  interface Session {
    user: {
      role: AppRole;
      npm?: string;
      phone?: string;
    } & DefaultSession["user"];
  }

  interface User {
    role: AppRole;
    npm?: string;
    phone?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: AppRole;
    npm?: string;
    phone?: string;
  }
}
