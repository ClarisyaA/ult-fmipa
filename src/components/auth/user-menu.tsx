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
    return null;
  }

  const roleLabel = roleLabels[session.user.role];

  return (
    <div className="flex items-center gap-3">
      <div className="hidden text-right text-xs sm:block">
        <p className="font-medium">{session.user.name ?? session.user.email}</p>
        <p className="text-muted-foreground">Aktif sebagai {roleLabel}</p>
      </div>
      {session.user.role === "student" ? (
        <Button asChild variant="ghost" size="sm">
          <Link href="/mahasiswa/riwayat">Riwayat Pengajuan</Link>
        </Button>
      ) : null}
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
