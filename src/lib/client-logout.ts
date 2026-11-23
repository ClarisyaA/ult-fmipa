"use client";

import { getSession, signOut } from "next-auth/react";

/**
 * Logout bersama untuk semua tombol "Keluar". Tujuan akhir selalu beranda.
 *
 * - Admin/Staff (login internal): hapus sesi ULT lalu ke beranda.
 * - Mahasiswa PAuS: hapus sesi ULT, lalu lewat sign-out PAuS (diatur server di
 *   /api/paus/logout) supaya sesi PAuS ikut berakhir, lalu kembali ke beranda.
 */
export async function logout() {
  const session = await getSession().catch(() => null);

  if (session?.user?.provider !== "paus") {
    await signOut({ callbackUrl: "/" });
    return;
  }

  await signOut({ redirect: false });
  window.location.assign("/api/paus/logout");
}
