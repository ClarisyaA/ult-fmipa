import { getServerSession, type NextAuthOptions } from "next-auth";
import { cache } from "react";
import type { OAuthConfig } from "next-auth/providers/oauth";
import CredentialsProvider from "next-auth/providers/credentials";

import { writeAuditLog } from "@/lib/audit-log";
import {
  isEligiblePausStudentUser,
  mapDevUserToSessionUser,
  type AppRole,
} from "@/lib/auth-user-mapper";
import { authorizeDbCredentialUser } from "@/lib/auth-db-users";
import { checkPausStudentRegistered } from "@/lib/mahasiswa-registry";
import { getPausEndpoints, isPausBridgeEnabled } from "@/lib/paus-config";
import {
  mapPausBridgePayloadToSessionUser,
  verifyPausBridgeToken,
} from "@/lib/paus-bridge-token";
import {
  LOGIN_ERROR_ACCESS_DENIED,
  LOGIN_ERROR_ALUMNI_NOT_ALLOWED,
} from "@/lib/paus-login-policy";
import {
  isPausAlumniProfile,
  mapPausProfileToSessionUser,
  type PausProfile,
} from "@/lib/paus-profile";

export type { AppRole };

function hasPausOAuthConfig() {
  return Boolean(
    getPausMode() === "modern" &&
      process.env.PAUS_CLIENT_ID &&
      process.env.PAUS_CLIENT_SECRET
  );
}

function getPausMode() {
  return process.env.PAUS_MODE === "legacy" ? "legacy" : "modern";
}

// Endpoint, scope, dan cara kirim token mengikuti panduan resmi PAuS SSO v1.0
// dan bisa diganti lewat environment (lihat src/lib/paus-config.ts).
const pausEndpoints = getPausEndpoints();

function logPausProviderStatus() {
  if (
    process.env.NODE_ENV !== "development" ||
    process.env.AUTH_DEBUG !== "true"
  ) {
    return;
  }

  const callbackUrl = process.env.NEXTAUTH_URL
    ? `${process.env.NEXTAUTH_URL}/api/auth/callback/paus`
    : "/api/auth/callback/paus";

  console.info("[auth:paus] provider enabled:", hasPausOAuthConfig());
  console.info("[auth:paus] mode:", getPausMode());
  console.info("[auth:paus] authorization URL:", pausEndpoints.authorizationUrl);
  console.info("[auth:paus] token URL:", pausEndpoints.tokenUrl);
  console.info("[auth:paus] userinfo URL:", pausEndpoints.userinfoUrl);
  console.info("[auth:paus] userinfo auth:", pausEndpoints.userinfoAuth);
  console.info("[auth:paus] scope:", pausEndpoints.scope);
  console.info("[auth:paus] callback URL:", callbackUrl);
  console.info("[auth:paus] client id exists:", Boolean(process.env.PAUS_CLIENT_ID));
  console.info(
    "[auth:paus] client secret exists:",
    Boolean(process.env.PAUS_CLIENT_SECRET)
  );
  console.info(
    "[auth:paus] sign-out URL configured:",
    Boolean(pausEndpoints.signOutUrl),
  );
}

logPausProviderStatus();

function createPausProvider(): OAuthConfig<PausProfile> {
  return {
    id: "paus",
    name: "PAUS Unpad",
    type: "oauth",
    clientId: process.env.PAUS_CLIENT_ID,
    clientSecret: process.env.PAUS_CLIENT_SECRET,
    issuer: process.env.PAUS_ISSUER,
    authorization: {
      url: pausEndpoints.authorizationUrl,
      params: {
        response_type: "code",
        scope: pausEndpoints.scope,
      },
    },
    client: {
      token_endpoint_auth_method: "client_secret_post",
    },
    token: {
      url: pausEndpoints.tokenUrl,
      async request({ params, provider }) {
        const code =
          typeof params.code === "string" ? params.code : undefined;

        if (!code) {
          throw new Error("PAUS authorization code tidak tersedia.");
        }

        const body = new URLSearchParams({
          client_id: process.env.PAUS_CLIENT_ID ?? "",
          client_secret: process.env.PAUS_CLIENT_SECRET ?? "",
          grant_type: "authorization_code",
          redirect_uri: provider.callbackUrl,
          code,
        });

        const response = await fetch(pausEndpoints.tokenUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json",
          },
          body,
        });

        const tokens = await response.json().catch(() => null);

        if (!response.ok) {
          console.error("[auth:paus] token request failed", {
            status: response.status,
            error: tokens?.error,
            message: tokens?.message,
            hint:
              tokens?.error === "invalid_client"
                ? "invalid_client biasanya berarti credential salah/expired, metode auth tidak cocok, atau redirect URI belum terdaftar."
                : undefined,
          });

          throw new Error("PAUS token request gagal.");
        }

        return { tokens };
      },
    },
    userinfo: {
      url: pausEndpoints.userinfoUrl,
      async request({ tokens }) {
        const accessToken = tokens.access_token;

        if (!accessToken) {
          throw new Error("PAUS access token tidak tersedia.");
        }

        // Panduan resmi: header "Authorization: Bearer". Gaya lama (token di
        // query string) tetap tersedia lewat PAUS_USERINFO_AUTH=query.
        const url = new URL(pausEndpoints.userinfoUrl);
        const headers: Record<string, string> = { Accept: "application/json" };

        if (pausEndpoints.userinfoAuth === "query") {
          url.searchParams.set("access_token", accessToken);
        } else {
          headers.Authorization = `Bearer ${accessToken}`;
        }

        const response = await fetch(url, { headers });

        if (!response.ok) {
          console.error("[auth:paus] userinfo request failed", {
            status: response.status,
          });
          throw new Error("Gagal mengambil profil PAUS.");
        }

        return response.json();
      },
    },
    profile(profile) {
      // Profil tanpa NPM (mis. dosen/tendik) TIDAK boleh melempar error di sini:
      // NextAuth akan mencetak seluruh profil ke log dan mengembalikan pengguna
      // ke /login tanpa kode error. Sebagai gantinya dikembalikan pengguna
      // pengganti tanpa NPM; callback signIn di bawah menolaknya dengan
      // redirect /login?error=AccessDenied sehingga tidak ada sesi yang dibuat.
      try {
        return mapPausProfileToSessionUser(profile);
      } catch {
        return {
          id: "paus-ineligible",
          name: "Tidak memenuhi syarat",
          role: "MAHASISWA",
        };
      }
    },
  };
}

function createPausBridgeProvider() {
  return CredentialsProvider({
    id: "paus-bridge",
    name: "PAUS Bridge",
    credentials: {
      bridgeToken: { label: "Bridge Token", type: "text" },
    },
    async authorize(credentials) {
      const bridgeToken = credentials?.bridgeToken;

      if (!bridgeToken) {
        return null;
      }

      try {
        const payload = verifyPausBridgeToken(bridgeToken);

        return mapPausBridgePayloadToSessionUser(payload);
      } catch (error) {
        console.error("[auth:paus-bridge] login failed", {
          message:
            error instanceof Error
              ? error.message
              : "Token bridge PAUS tidak valid.",
        });

        return null;
      }
    },
  });
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
        email: { label: "Username atau email", type: "text" },
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
          return mapDevUserToSessionUser("ADMIN", email);
        }

        if (
          email &&
          password &&
          email === process.env.DEV_STAFF_EMAIL &&
          password === process.env.DEV_STAFF_PASSWORD
        ) {
          return mapDevUserToSessionUser("STAFF", email);
        }

        if (
          email &&
          password &&
          email === process.env.DEV_STUDENT_EMAIL &&
          password === process.env.DEV_STUDENT_PASSWORD
        ) {
          return mapDevUserToSessionUser("MAHASISWA", email);
        }

        if (email && password) {
          try {
            return await authorizeDbCredentialUser(email, password);
          } catch (error) {
            console.error("[auth:db-users] login failed", {
              message:
                error instanceof Error
                  ? error.message
                  : "Gagal memeriksa user database.",
            });
          }
        }

        return null;
      },
    }),
    // PAuS Bridge (alur PHP lama) mati secara default; nyalakan dengan
    // PAUS_BRIDGE_ENABLED=true hanya bila sistem lama masih dipakai.
    ...(isPausBridgeEnabled() ? [createPausBridgeProvider()] : []),
    // Production provider. PAUS is student-only (business rule, final) - see
    // mapPausProfileToSessionUser and the signIn callback below. Logout PAuS
    // ditangani oleh /api/paus/logout (src/lib/paus-config.ts).
    ...(hasPausOAuthConfig() ? [createPausProvider()] : []),
  ],
  callbacks: {
    // Defense in depth: PAUS OAuth and PAUS Bridge are student-only by
    // business rule. The mappers (mapPausProfileToSessionUser,
    // mapPausBridgePayloadToSessionUser) already reject any profile/payload
    // without a valid NPM by throwing, but this callback independently
    // re-checks the mapped user before a session is ever created, so a
    // future change to either mapper can't silently reintroduce a
    // STAFF/ADMIN role via PAUS. Credentials (DB-backed Admin/Staff/dev) is
    // untouched - APP_ROLE from data_users remains the sole source of
    // Staff/Admin authorization.
    async signIn({ user, account, profile }) {
      if (account?.provider === "paus" || account?.provider === "paus-bridge") {
        if (!isEligiblePausStudentUser(user)) {
          return account.provider === "paus"
            ? `/login?error=${LOGIN_ERROR_ACCESS_DENIED}`
            : false;
        }

        // Alumni / bukan mahasiswa aktif menurut penanda PAuS. Nonaktif sampai
        // PAUS_ALUMNI_FIELD diisi (lihat src/lib/paus-profile.ts).
        if (account.provider === "paus" && isPausAlumniProfile(profile)) {
          return `/login?error=${LOGIN_ERROR_ALUMNI_NOT_ALLOWED}`;
        }

        // Sama seperti sistem lama: NPM harus ada di tabel `mahasiswa`.
        return checkPausStudentRegistered(user.npm);
      }

      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.positionCode = user.positionCode;
        token.accessCode = user.accessCode;
        token.npm = user.npm;
        token.nip = user.nip;
        token.pausId = user.pausId;
        token.phone = user.phone;
      }

      if (account?.provider) {
        token.provider = account.provider;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id ?? "";
        session.user.role = token.role;
        session.user.positionCode = token.positionCode;
        session.user.accessCode = token.accessCode;
        session.user.npm = token.npm;
        session.user.nip = token.nip;
        session.user.pausId = token.pausId;
        session.user.phone = token.phone;
        session.user.provider = token.provider;
      }

      return session;
    },
  },
  events: {
    async signIn({ user }) {
      await writeAuditLog({
        actor: user,
        action: "Auth: Login",
      });
    },
    async signOut(message) {
      const token = "token" in message ? message.token : null;
      await writeAuditLog({
        actor: token
          ? {
              id: typeof token.id === "string" ? token.id : "",
              email: typeof token.email === "string" ? token.email : null,
              name: typeof token.name === "string" ? token.name : null,
            }
          : null,
        action: "Auth: Logout",
      });
    },
  },
};

export const getCurrentUser = cache(async () => {
  const session = await getServerSession(authOptions);

  return session?.user ?? null;
});

export async function requireRole(allowedRoles: AppRole[]) {
  const user = await getCurrentUser();

  if (!user || !allowedRoles.includes(user.role)) {
    return null;
  }

  return user;
}
