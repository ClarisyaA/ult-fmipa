import type { DefaultSession } from "next-auth";
import type { AppRole } from "@/lib/roles";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: AppRole;
      positionCode?: string;
      accessCode?: string;
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
    positionCode?: string;
    accessCode?: string;
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
    positionCode?: string;
    accessCode?: string;
    npm?: string;
    nip?: string;
    pausId?: string;
    phone?: string;
    provider?: string;
  }
}
