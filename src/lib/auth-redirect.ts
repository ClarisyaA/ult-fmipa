import type { AppRole } from "@/lib/auth";
import { isRole } from "@/lib/roles";

const publicRoutePrefixes = [
  "/",
  "/profil",
  "/layanan",
  "/informasi",
  "/survei",
  "/mahasiswa",
];

export function getDefaultRedirectByRole(role: AppRole) {
  if (isRole(role, "ADMIN")) {
    return "/admin/dashboard";
  }

  if (isRole(role, "STAFF")) {
    return "/staff/dashboard";
  }

  return "/layanan";
}

function getInternalPath(callbackUrl?: string | null, origin?: string) {
  if (!callbackUrl || callbackUrl.startsWith("//")) {
    return null;
  }

  if (callbackUrl.startsWith("/")) {
    return callbackUrl;
  }

  if (!origin) {
    return null;
  }

  try {
    const url = new URL(callbackUrl);

    if (url.origin !== origin) {
      return null;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

export function isCallbackAllowedForRole(
  callbackUrl: string | null | undefined,
  role: AppRole,
  origin?: string
) {
  const path = getInternalPath(callbackUrl, origin);

  if (!path) {
    return false;
  }

  const pathname = path.split(/[?#]/)[0] ?? path;

  if (isRole(role, "ADMIN")) {
    return pathname === "/admin" || pathname.startsWith("/admin/");
  }

  if (isRole(role, "STAFF")) {
    return pathname === "/staff" || pathname.startsWith("/staff/");
  }

  if (pathname.startsWith("/admin") || pathname.startsWith("/staff")) {
    return false;
  }

  return publicRoutePrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function getSafeRedirectUrl(
  callbackUrl: string | null | undefined,
  role: AppRole,
  origin?: string
) {
  if (isCallbackAllowedForRole(callbackUrl, role, origin)) {
    return getInternalPath(callbackUrl, origin) ?? getDefaultRedirectByRole(role);
  }

  return getDefaultRedirectByRole(role);
}
