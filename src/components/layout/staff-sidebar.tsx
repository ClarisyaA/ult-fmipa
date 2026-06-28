"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  BarChart3,
  ChevronDown,
  FileText,
  Globe,
  Home,
  LogOut,
  Newspaper,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import type { NavItem } from "@/constants/navigation";

type StaffSidebarProps = {
  items: NavItem[];
  userName: string;
  userRole: string;
};

const navIcons = {
  Dashboard: Home,
  Pengajuan: FileText,
  Informasi: Newspaper,
  Survei: BarChart3,
  "Website Publik": Globe,
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function StaffSidebar({ items, userName, userRole }: StaffSidebarProps) {
  const pathname = usePathname();
  const initials = getInitials(userName) || "SU";

  return (
    <aside className="relative hidden h-full min-h-0 w-[232px] shrink-0 overflow-hidden bg-[#003f2f] text-white md:flex md:flex-col">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(55,139,104,0.38),transparent_36%),linear-gradient(180deg,#003b2d_0%,#004633_50%,#003827_100%)]" />
      <Image
        src="/rektorat.svg"
        alt=""
        width={760}
        height={660}
        className="pointer-events-none absolute -bottom-14 -left-44 w-[280%] opacity-28 mix-blend-screen"
      />
      <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-[#003827] via-[#003827]/82 to-transparent" />
      <div className="relative z-10 flex h-full min-h-0 flex-col px-5 py-5">
        <div className="flex items-center gap-3">
          <Image
            src="/logo-unpad.svg"
            alt="Logo Unpad"
            width={42}
            height={42}
            className="size-10 shrink-0"
            priority
          />
          <div className="leading-tight">
            <p className="text-lg font-bold tracking-wide">ULT</p>
            <p className="text-sm font-semibold tracking-wide text-white/90">
              FMIPA UNPAD
            </p>
          </div>
        </div>

        <nav className="mt-12 grid gap-2">
          {items.map((item) => {
            const Icon = navIcons[item.label as keyof typeof navIcons] ?? FileText;
            const isActive = isActivePath(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-[#ecfff4] text-[#27614d] shadow-[0_12px_24px_rgba(0,0,0,0.16)]"
                    : "text-white/68 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon
                  className={`size-4 shrink-0 transition-colors ${
                    isActive ? "text-[#3d8067]" : "text-white/58 group-hover:text-white"
                  }`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto mb-1 rounded-xl border border-white/12 bg-white/8 p-3 shadow-[0_16px_36px_rgba(0,0,0,0.16)] backdrop-blur">
          <div className="flex items-center gap-2.5">
            <div className="grid size-10 shrink-0 place-items-center rounded-full bg-[#dff7bd] text-xs font-bold text-[#27513f]">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-white">{userName}</p>
              <p className="text-xs text-white/68">{userRole}</p>
            </div>
            <ChevronDown className="size-3.5 text-white/62" />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-2 h-7 w-full justify-start rounded-lg text-xs text-white/76 hover:bg-white/10 hover:text-white"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            <LogOut className="size-3.5" />
            Keluar
          </Button>
        </div>
      </div>
    </aside>
  );
}
