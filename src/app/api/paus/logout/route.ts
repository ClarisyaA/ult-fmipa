import { NextResponse } from "next/server";

import { resolvePausLogoutTarget } from "@/lib/paus-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Langkah kedua logout mahasiswa PAuS. Browser memanggil ini SETELAH sesi ULT
 * dihapus (lihat src/lib/client-logout.ts), lalu diarahkan ke sign-out PAuS
 * dengan tujuan kembali ke beranda. Tujuan dibangun dari environment (tidak
 * ada input pengguna), jadi tidak ada open redirect. Bila logout global
 * dimatikan atau PAUS_CLIENT_ID kosong, langsung ke beranda.
 */
export function GET(request: Request) {
  const origin = new URL(request.url).origin;

  return NextResponse.redirect(resolvePausLogoutTarget(process.env, origin));
}
