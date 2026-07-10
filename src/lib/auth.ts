import { getServerSession, type NextAuthOptions } from "next-auth";
import type { OAuthConfig } from "next-auth/providers/oauth";
import CredentialsProvider from "next-auth/providers/credentials";

import {
  mapDevUserToSessionUser,
  type AppRole,
} from "@/lib/auth-user-mapper";
import { authorizeDbCredentialUser } from "@/lib/auth-db-users";
import {
  mapPausBridgePayloadToSessionUser,
  verifyPausBridgeToken,
} from "@/lib/paus-bridge-token";
import {
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

const pausAuthorizationUrl =
  process.env.PAUS_AUTHORIZATION_URL || "https://paus.unpad.ac.id/oauth";
const pausTokenUrl =
  process.env.PAUS_TOKEN_URL || "https://paus.unpad.ac.id/oauth/access-token";
const pausUserinfoUrl =
  process.env.PAUS_USERINFO_URL || "https://paus.unpad.ac.id/api/";
const pausSignOutUrl =
  process.env.PAUS_SIGN_OUT_URL || "https://paus.unpad.ac.id/oauth/sign-out";

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
  console.info("[auth:paus] authorization URL:", pausAuthorizationUrl);
  console.info("[auth:paus] token URL:", pausTokenUrl);
  console.info("[auth:paus] callback URL:", callbackUrl);
  console.info("[auth:paus] client id exists:", Boolean(process.env.PAUS_CLIENT_ID));
  console.info(
    "[auth:paus] client secret exists:",
    Boolean(process.env.PAUS_CLIENT_SECRET)
  );
  console.info("[auth:paus] sign-out URL configured:", Boolean(pausSignOutUrl));
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
      url: pausAuthorizationUrl,
      params: {
        response_type: "code",
        scope: "user.basic",
      },
    },
    client: {
      token_endpoint_auth_method: "client_secret_post",
    },
    token: {
      url: pausTokenUrl,
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

        const response = await fetch(pausTokenUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
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
      url: pausUserinfoUrl,
      async request({ tokens }) {
        const accessToken = tokens.access_token;

        if (!accessToken) {
          throw new Error("PAUS access token tidak tersedia.");
        }

        const url = new URL(pausUserinfoUrl);
        url.searchParams.set("access_token", accessToken);

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error("Gagal mengambil profil PAUS.");
        }

        return response.json();
      },
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
    CredentialsProvider({
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
    }),
    // TODO(PAUS): Use this as the production provider after OAuth credentials
    // are confirmed by Unpad. PAUS profile should provide or map name, email,
    // NPM/identifier, and role if available.
    // TODO(PAUS): PAUS_SIGN_OUT_URL is available for future global SSO logout.
    ...(hasPausOAuthConfig() ? [createPausProvider()] : []),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.role = user.role;
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
        session.user.role = token.role;
        session.user.npm = token.npm;
        session.user.nip = token.nip;
        session.user.pausId = token.pausId;
        session.user.phone = token.phone;
        session.user.provider = token.provider;
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
