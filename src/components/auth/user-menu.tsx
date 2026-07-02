"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogOut, LayoutDashboard, History, ChevronDown } from "lucide-react";
import { getSession, signOut } from "next-auth/react";
import type { Session } from "next-auth";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const roleLabels = {
  admin: "Admin",
  staff: "Staff",
  student: "Mahasiswa",
} as const;

const roleBadgeStyles = {
  admin: "bg-[#ff2d28]/10 text-[#c71410]",
  staff: "bg-amber-50 text-amber-700",
  student: "bg-neutral-100 text-neutral-600",
} as const;

interface UserMenuProps {
  variant?: "desktop" | "mobile";
  onNavigate?: () => void;
}

function useUserSession() {
  const [session, setSession] = useState<Session | null>(null);
  useEffect(() => {
    getSession().then(setSession);
  }, []);
  return session;
}

function getShortcut(role: string) {
  if (role === "admin") return { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard };
  if (role === "staff") return { label: "Dashboard", href: "/staff/dashboard", icon: LayoutDashboard };
  return { label: "Riwayat", href: "/mahasiswa/riwayat", icon: History };
}

export function UserMenu({ variant = "desktop", onNavigate }: UserMenuProps) {
  const session = useUserSession();

  if (!session?.user) {
    return (
      <Button
        asChild
        variant="outline"
        size="sm"
        className={cn(
          "rounded-full border-[#ff2d28] text-[#ff2d28] bg-transparent hover:bg-[#ff2d28] hover:text-white transition-all duration-300 text-xs font-semibold px-4 h-8 shadow-sm hover:shadow-md hover:shadow-[#ff2d28]/20 hover:-translate-y-0.5",
          variant === "mobile" && "w-full h-10 justify-center"
        )}
      >
        <Link href="/login" data-testid="navbar-login" onClick={onNavigate}>
          Masuk
        </Link>
      </Button>
    );
  }

  const role = (session.user.role as keyof typeof roleLabels) ?? "student";
  const roleLabel = roleLabels[role] ?? "User";
  const badgeStyle = roleBadgeStyles[role] ?? roleBadgeStyles.student;
  const displayName = session.user.name ?? session.user.email ?? "User";
  const initial = displayName.charAt(0).toUpperCase();
  const shortcut = getShortcut(role);

  if (variant === "mobile") {
    return (
      <div className="rounded-xl border border-[#ff2d28] bg-gradient-to-br from-[#ff2d28]/[0.03] to-transparent overflow-hidden">
        <div className="flex items-center gap-3 px-3.5 py-3">
          <Avatar className="h-9 w-9 max-[350px]:h-7 max-[350px]:w-7 ring-2 ring-[#ff2d28]/10 shrink-0">
            <AvatarFallback className="bg-gradient-to-br from-[#ff2d28] to-[#c71410] text-white text-sm max-[350px]:text-xs font-bold">
              {initial}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-sm max-[350px]:text-xs font-semibold text-neutral-800 truncate">{displayName}</p>
            <span className="text-xs max-[350px]:text-[10px] text-muted-foreground mt-0.5 block">
              Aktif sebagai {roleLabel}
            </span>
          </div>
        </div>

        <div className="border-t border-neutral-100 grid gap-0 p-0">
          <Link
            href={shortcut.href}
            onClick={onNavigate}
            className="flex items-center gap-2.5 rounded-none px-3.5 py-2.5 max-[350px]:py-2 text-xs max-[350px]:text-[10px] font-medium text-neutral-700 hover:bg-neutral-100 hover:text-[#ff2d28] transition-colors duration-200 border-b border-neutral-100"
          >
            <shortcut.icon className="h-3.5 w-3.5 max-[350px]:h-3 max-[350px]:w-3" />
            {shortcut.label}
          </Link>
          <button
            type="button"
            onClick={() => {
              onNavigate?.();
              signOut({ callbackUrl: "/" });
            }}
            className="flex items-center gap-2.5 rounded-none px-3.5 py-2.5 max-[350px]:py-2 text-xs max-[350px]:text-[10px] font-medium text-red-600 hover:bg-neutral-100 hover:text-red-700 transition-colors duration-200 text-left"
          >
            <LogOut className="h-3.5 w-3.5 max-[350px]:h-3 max-[350px]:w-3" />
            Keluar
          </button>
        </div>
      </div>
    );
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-2 rounded-full pl-2.0 pr-3 h-8 border-[#ff2d28] bg-transparent hover:bg-[#ff2d28] hover:text-white transition-all duration-300 text-xs font-semibold shadow-sm hover:shadow-md hover:shadow-[#ff2d28]/20 hover:-translate-y-0.5 min-w-[150px] justify-between"
        >
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6 ring-2 ring-[#ff2d28]/10 shrink-0">
              <AvatarFallback className="bg-gradient-to-br from-[#ff2d28] to-[#c71410] text-white text-[10px] font-bold">
                {initial}
              </AvatarFallback>
            </Avatar>
            <span className="truncate text-neutral-700 group-hover:text-white max-w-[90px]">
              {displayName}
            </span>
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-neutral-400 group-hover:text-white shrink-0" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="w-60 rounded-2xl border border-neutral-200/60 bg-background/95 backdrop-blur-lg shadow-lg shadow-black/[0.04] p-0 overflow-hidden"
      >
        <DropdownMenuLabel className="flex items-center gap-3 px-4 py-3.5 bg-gradient-to-r from-[#ff2d28]/5 via-[#e01f1a]/5 to-transparent">
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarFallback className="bg-gradient-to-br from-[#ff2d28] to-[#c71410] text-white text-sm font-bold">
              {initial}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-neutral-800 truncate">{displayName}</p>
            <span className="inline-block mt-1 rounded-full px-2 py-0.5 text-[10px] font-medium bg-white text-neutral-600 border border-neutral-200/50">
              Aktif sebagai {roleLabel}
            </span>
          </div>
        </DropdownMenuLabel>

        <div className="p-1">
          <DropdownMenuItem asChild className="rounded-lg py-2.5 px-3 cursor-pointer text-sm hover:bg-neutral-100 hover:text-neutral-900 transition-colors duration-200">
            <Link href={shortcut.href} className="flex items-center gap-2.5 w-full text-neutral-700">
              <shortcut.icon className="h-3.5 w-3.5 text-neutral-500" />
              <span>{shortcut.label}</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => signOut({ callbackUrl: "/" })}
            className="rounded-lg py-2.5 px-3 cursor-pointer text-sm mt-0.5 w-full flex items-center gap-2.5 hover:bg-neutral-100 hover:text-neutral-900 transition-colors duration-200 text-red-600"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="font-medium">Keluar</span>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}