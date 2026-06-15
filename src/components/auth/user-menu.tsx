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
      <Button asChild variant="outline" size="sm">
        <Link href="/login" data-testid="navbar-login">Masuk</Link>
      </Button>
    );
  }

  const roleLabel = roleLabels[session.user.role];
  const shortcut =
    session.user.role === "admin"
      ? { label: "Dashboard Admin", href: "/admin/dashboard" }
      : session.user.role === "staff"
        ? { label: "Dashboard Staff", href: "/staff/dashboard" }
        : { label: "Riwayat Saya", href: "/mahasiswa/riwayat" };

  return (
    <div className="flex items-center gap-3">
      <div className="hidden text-right text-xs sm:block">
        <p className="font-medium">{session.user.name ?? session.user.email}</p>
        <p className="text-muted-foreground">Aktif sebagai {roleLabel}</p>
      </div>
      <Button asChild variant="ghost" size="sm">
        <Link href={shortcut.href}>{shortcut.label}</Link>
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => signOut({ callbackUrl: "/login" })}
      >
        <LogOut className="size-4" />
        Keluar
      </Button>
    </div>
  );
}
