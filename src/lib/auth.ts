import { getServerSession, type NextAuthOptions } from "next-auth";
import type { OAuthConfig } from "next-auth/providers/oauth";
import CredentialsProvider from "next-auth/providers/credentials";

import {
  mapDevUserToSessionUser,
  mapPausProfileToSessionUser,
  type AppRole,
} from "@/lib/auth-user-mapper";

export type { AppRole };

function hasPausOAuthConfig() {
  return Boolean(
    process.env.PAUS_CLIENT_ID &&
      process.env.PAUS_CLIENT_SECRET &&
      process.env.PAUS_ISSUER &&
      process.env.PAUS_AUTHORIZATION_URL &&
      process.env.PAUS_TOKEN_URL &&
      process.env.PAUS_USERINFO_URL
  );
}

function createPausProvider(): OAuthConfig<Record<string, unknown>> {
  return {
    id: "paus",
    name: "PAUS Unpad",
    type: "oauth",
    clientId: process.env.PAUS_CLIENT_ID,
    clientSecret: process.env.PAUS_CLIENT_SECRET,
    issuer: process.env.PAUS_ISSUER,
    authorization: {
      url: process.env.PAUS_AUTHORIZATION_URL,
    },
    token: {
      url: process.env.PAUS_TOKEN_URL,
    },
    userinfo: {
      url: process.env.PAUS_USERINFO_URL,
    },
    profile(profile) {
      return mapPausProfileToSessionUser(profile);
    },
  };
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    // Development only. Keep this provider for local admin/staff/student testing.
    CredentialsProvider({
      name: "Development Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email;
        const password = credentials?.password;

        if (
          email &&
          password &&
          email === process.env.DEV_ADMIN_EMAIL &&
          password === process.env.DEV_ADMIN_PASSWORD
        ) {
          return mapDevUserToSessionUser("admin", email);
        }

        if (
          email &&
          password &&
          email === process.env.DEV_STAFF_EMAIL &&
          password === process.env.DEV_STAFF_PASSWORD
        ) {
          return mapDevUserToSessionUser("staff", email);
        }

        if (
          email &&
          password &&
          email === process.env.DEV_STUDENT_EMAIL &&
          password === process.env.DEV_STUDENT_PASSWORD
        ) {
          return mapDevUserToSessionUser("student", email);
        }

        return null;
      },
    }),
    // TODO(PAUS): Use this as the production provider after OAuth credentials
    // and profile fields are confirmed by Unpad. PAUS should provide or map
    // name, email, NPM/identifier, and role if available.
    ...(hasPausOAuthConfig() ? [createPausProvider()] : []),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.npm = user.npm;
        token.phone = user.phone;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role;
        session.user.npm = token.npm;
        session.user.phone = token.phone;
      }

      return session;
    },
  },
};

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);

  return session?.user ?? null;
}

export async function requireRole(allowedRoles: AppRole[]) {
  const user = await getCurrentUser();

  if (!user || !allowedRoles.includes(user.role)) {
    return null;
  }

  return user;
}
