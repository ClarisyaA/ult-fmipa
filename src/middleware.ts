import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";

import { getDefaultRedirectByRole } from "@/lib/auth-redirect";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = await getToken({ req: request });
  const isApiRoute =
    pathname.startsWith("/api/admin") ||
    pathname.startsWith("/api/staff") ||
    pathname.startsWith("/api/student");
  const isSubmissionPage =
    pathname.startsWith("/layanan/") && pathname.endsWith("/ajukan");

  if (!token) {
    if (isApiRoute) {
      return jsonError("Unauthorized", 401);
    }

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.href);

    return NextResponse.redirect(loginUrl);
  }

  const role = token.role;
  const isAdminPath =
    pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  const isStaffPath =
    pathname.startsWith("/staff") || pathname.startsWith("/api/staff");
  const isStudentPath =
    pathname.startsWith("/mahasiswa") || pathname.startsWith("/api/student");

  if (isSubmissionPage && !["student", "admin", "staff"].includes(role)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAdminPath && role !== "admin") {
    return isApiRoute
      ? jsonError("Forbidden", 403)
      : NextResponse.redirect(
          new URL(getDefaultRedirectByRole(role), request.url)
        );
  }

  if (isStaffPath && role !== "staff") {
    return isApiRoute
      ? jsonError("Forbidden", 403)
      : NextResponse.redirect(
          new URL(getDefaultRedirectByRole(role), request.url)
        );
  }

  if (isStudentPath && role !== "student") {
    return isApiRoute
      ? jsonError("Forbidden", 403)
      : NextResponse.redirect(
          new URL(getDefaultRedirectByRole(role), request.url)
        );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/staff/:path*",
    "/api/admin/:path*",
    "/api/staff/:path*",
    "/api/student/:path*",
    "/mahasiswa/:path*",
    "/layanan/:path*/ajukan",
  ],
};
