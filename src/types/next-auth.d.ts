import type { DefaultSession } from "next-auth";

type AppRole = "admin" | "staff";

declare module "next-auth" {
  interface Session {
    user: {
      role: AppRole;
    } & DefaultSession["user"];
  }

  interface User {
    role: AppRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: AppRole;
  }
}
