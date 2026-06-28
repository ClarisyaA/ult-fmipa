"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { getSession, signOut } from "next-auth/react";
import type { Session } from "next-auth";

import { Button } from "@/components/ui/button";

const roleLabels = {
  admin: "Admin",
  staff: "Staff",
  student: "Mahasiswa",
};

export function UserMenu() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    getSession().then(setSession);
  }, []);

  if (!session?.user) {
    return (
      <Button 
        asChild 
        variant="outline" 
        size="sm" 
        className="rounded-full border-[#ff2d28] text-[#ff2d28] bg-transparent hover:bg-[#ff2d28] hover:text-white transition-all duration-300 text-xs font-semibold px-4 h-8 shadow-sm hover:shadow-md hover:shadow-[#ff2d28]/20 hover:-translate-y-0.5"
      >
        <Link href="/login" data-testid="navbar-login">Masuk</Link>
      </Button>
    );
  }

  const roleLabel = roleLabels[session.user.role];
  const shortcut =
    session.user.role === "admin"
      ? { label: "Dashboard", href: "/admin/dashboard" }
      : session.user.role === "staff"
        ? { label: "Dashboard", href: "/staff/dashboard" }
        : { label: "Riwayat", href: "/mahasiswa/riwayat" };

  return (
    <div className="flex items-center gap-2">
      <div className="hidden text-right text-xs sm:block">
        <p className="font-medium text-sm">{session.user.name ?? session.user.email}</p>
        <p className="text-muted-foreground text-xs">Aktif sebagai {roleLabel}</p>
      </div>
      <Button 
        asChild 
        variant="ghost" 
        size="sm" 
        className="rounded-full hover:bg-[#ff2d28]/10 hover:text-[#ff2d28] transition-all duration-200 text-xs h-8"
      >
        <Link href={shortcut.href}>{shortcut.label}</Link>
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="rounded-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-all duration-200 text-xs h-8 px-3"
        onClick={() => signOut({ callbackUrl: "/" })}
      >
        <LogOut className="size-3.5" />
        Keluar
      </Button>
    </div>
  );
}
