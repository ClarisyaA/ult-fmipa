import { getServerSession, type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export type AppRole = "admin" | "staff";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
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
          return {
            id: "dev-admin",
            name: "Admin ULT",
            email,
            role: "admin",
          };
        }

        if (
          email &&
          password &&
          email === process.env.DEV_STAFF_EMAIL &&
          password === process.env.DEV_STAFF_PASSWORD
        ) {
          return {
            id: "dev-staff",
            name: "Staff ULT",
            email,
            role: "staff",
          };
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role;
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
