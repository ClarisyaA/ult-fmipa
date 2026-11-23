/**
 * Konfigurasi endpoint PAuS SSO (modul murni, tanpa akses DB/jaringan).
 *
 * Default mengikuti "Panduan Integrasi PAuS SSO Unpad untuk Aplikasi Pihak
 * Ketiga" v1.0 (18 Juni 2026). Semua nilai bisa diganti lewat environment,
 * misalnya untuk kembali ke endpoint lama bila DPSI meminta:
 *
 *   PAUS_AUTHORIZATION_URL  default https://paus.unpad.ac.id/oauth/authorize
 *   PAUS_TOKEN_URL          default https://paus.unpad.ac.id/oauth/token
 *   PAUS_USERINFO_URL       default https://paus.unpad.ac.id/api/user
 *   PAUS_SIGN_OUT_URL       default https://paus.unpad.ac.id/oauth/sign-out
 *   PAUS_SCOPE              default read-user-info
 *   PAUS_USERINFO_AUTH      "bearer" (default) atau "query" (gaya lama: ?access_token=)
 *   PAUS_SIGN_OUT_REDIRECT_PARAM  default redirect_uri
 *   PAUS_GLOBAL_LOGOUT      "false" untuk mematikan logout PAuS (default aktif)
 *   PAUS_BRIDGE_ENABLED     "true" untuk menyalakan PAuS Bridge lama (default mati)
 */
export const PAUS_DEFAULTS = {
  authorizationUrl: "https://paus.unpad.ac.id/oauth/authorize",
  tokenUrl: "https://paus.unpad.ac.id/oauth/token",
  userinfoUrl: "https://paus.unpad.ac.id/api/user",
  signOutUrl: "https://paus.unpad.ac.id/oauth/sign-out",
  scope: "read-user-info",
  signOutRedirectParam: "redirect_uri",
};

type Env = Record<string, string | undefined>;

export type PausUserinfoAuth = "bearer" | "query";

export type PausEndpoints = {
  authorizationUrl: string;
  tokenUrl: string;
  userinfoUrl: string;
  signOutUrl: string;
  scope: string;
  userinfoAuth: PausUserinfoAuth;
  signOutRedirectParam: string;
};

function read(env: Env, key: string, fallback: string) {
  const value = env[key]?.trim();
  return value ? value : fallback;
}

export function getPausEndpoints(env: Env = process.env): PausEndpoints {
  return {
    authorizationUrl: read(env, "PAUS_AUTHORIZATION_URL", PAUS_DEFAULTS.authorizationUrl),
    tokenUrl: read(env, "PAUS_TOKEN_URL", PAUS_DEFAULTS.tokenUrl),
    userinfoUrl: read(env, "PAUS_USERINFO_URL", PAUS_DEFAULTS.userinfoUrl),
    signOutUrl: read(env, "PAUS_SIGN_OUT_URL", PAUS_DEFAULTS.signOutUrl),
    scope: read(env, "PAUS_SCOPE", PAUS_DEFAULTS.scope),
    userinfoAuth:
      env.PAUS_USERINFO_AUTH?.trim().toLowerCase() === "query" ? "query" : "bearer",
    signOutRedirectParam: read(
      env,
      "PAUS_SIGN_OUT_REDIRECT_PARAM",
      PAUS_DEFAULTS.signOutRedirectParam,
    ),
  };
}

/** PAuS Bridge (alur PHP lama) mati kecuali dinyalakan eksplisit. */
export function isPausBridgeEnabled(env: Env = process.env): boolean {
  return env.PAUS_BRIDGE_ENABLED?.trim().toLowerCase() === "true";
}

/** Logout aplikasi ikut mengakhiri sesi PAuS, kecuali dimatikan eksplisit. */
export function isPausGlobalLogoutEnabled(env: Env = process.env): boolean {
  return env.PAUS_GLOBAL_LOGOUT?.trim().toLowerCase() !== "false";
}

export function buildPausSignOutUrl({
  signOutUrl,
  clientId,
  redirectUri,
  redirectParam = PAUS_DEFAULTS.signOutRedirectParam,
}: {
  signOutUrl: string;
  clientId: string;
  redirectUri: string;
  redirectParam?: string;
}): string {
  const url = new URL(signOutUrl);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set(redirectParam, redirectUri);

  return url.toString();
}

/** Beranda aplikasi (tujuan setelah logout), mis. https://ult.fmipa.unpad.ac.id/ */
export function getBerandaUrl(env: Env = process.env, fallbackOrigin?: string): string {
  const candidates = [env.NEXTAUTH_URL?.trim(), fallbackOrigin, "http://localhost:3000"];

  for (const candidate of candidates) {
    if (!candidate) continue;

    try {
      return new URL("/", candidate).toString();
    } catch {
      // coba kandidat berikutnya
    }
  }

  return "http://localhost:3000/";
}

/**
 * Ke mana browser diarahkan setelah sesi ULT dihapus.
 * - Mahasiswa PAuS: link sign-out PAuS (client_id + tujuan kembali = beranda).
 * - Bila logout global dimatikan atau PAUS_CLIENT_ID kosong: langsung beranda.
 */
export function resolvePausLogoutTarget(
  env: Env = process.env,
  fallbackOrigin?: string,
): string {
  const beranda = getBerandaUrl(env, fallbackOrigin);
  const clientId = env.PAUS_CLIENT_ID?.trim();

  if (!isPausGlobalLogoutEnabled(env) || !clientId) {
    return beranda;
  }

  const endpoints = getPausEndpoints(env);

  try {
    return buildPausSignOutUrl({
      signOutUrl: endpoints.signOutUrl,
      clientId,
      redirectUri: beranda,
      redirectParam: endpoints.signOutRedirectParam,
    });
  } catch {
    // PAUS_SIGN_OUT_URL tidak valid: jangan menahan pengguna, kembali ke beranda.
    return beranda;
  }
}
