"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import {
  BarChart3,
  ChevronDown,
  FileText,
  Globe,
  Home,
  Images,
  LogOut,
  MapPin,
  Menu,
  Network,
  Newspaper,
  PanelLeftClose,
  PanelLeftOpen,
  X,
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
  "Kegiatan Mahasiswa": Images,
  "Profil - Struktur": Network,
  "Profil - Lokasi": MapPin,
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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const initials = getInitials(userName) || "SU";

  return (
    <aside
      className={`relative hidden h-full min-h-0 shrink-0 overflow-hidden bg-[#003f2f] text-white transition-[width] duration-300 ease-out md:flex md:flex-col ${
        isCollapsed ? "w-[78px]" : "w-[220px] lg:w-[232px]"
      }`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(55,139,104,0.38),transparent_36%),linear-gradient(180deg,#003b2d_0%,#004633_50%,#003827_100%)]" />
      <Image
        src="/rektorat.svg"
        alt=""
        width={760}
        height={660}
        className="pointer-events-none absolute -bottom-14 -left-44 w-[280%] opacity-28 mix-blend-screen"
      />
      <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-[#003827] via-[#003827]/82 to-transparent" />
      <div
        className={`relative z-10 flex h-full min-h-0 flex-col py-5 ${
          isCollapsed ? "px-3" : "px-4 lg:px-5"
        }`}
      >
        <div
          className={`flex items-center gap-3 ${
            isCollapsed ? "justify-center" : ""
          }`}
        >
          <Image
            src="/logo-unpad.svg"
            alt="Logo Unpad"
            width={42}
            height={42}
            className="size-10 shrink-0"
            priority
          />
          <div className={`leading-tight ${isCollapsed ? "hidden" : ""}`}>
            <p className="text-lg font-bold tracking-wide">ULT</p>
            <p className="text-sm font-semibold tracking-wide text-white/90">
              FMIPA UNPAD
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={`mt-4 h-8 rounded-lg text-xs text-white/76 hover:bg-white/10 hover:text-white ${
            isCollapsed ? "w-full px-0" : "justify-start px-3"
          }`}
          aria-label={isCollapsed ? "Buka sidebar staff" : "Tutup sidebar staff"}
          aria-expanded={!isCollapsed}
          onClick={() => setIsCollapsed((current) => !current)}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="size-4" />
          ) : (
            <>
              <PanelLeftClose className="size-4" />
              <span>Ciutkan</span>
            </>
          )}
        </Button>

        <nav
          className={`mt-5 grid min-h-0 gap-2 overflow-y-auto ${
            isCollapsed ? "pr-0" : "pr-1"
          }`}
        >
          {items.map((item) => {
            const Icon =
              navIcons[item.label as keyof typeof navIcons] ?? FileText;
            const isActive = isActivePath(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                title={isCollapsed ? item.label : undefined}
                className={`group flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-all duration-200 ${
                  isCollapsed ? "justify-center" : ""
                } ${
                  isActive
                    ? "bg-[#ecfff4] text-[#27614d] shadow-[0_12px_24px_rgba(0,0,0,0.16)]"
                    : "text-white/68 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon
                  className={`size-4 shrink-0 transition-colors ${
                    isActive
                      ? "text-[#3d8067]"
                      : "text-white/58 group-hover:text-white"
                  }`}
                />
                {isCollapsed ? null : <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div
          className={`mt-auto mb-1 rounded-xl border border-white/12 bg-white/8 shadow-[0_16px_36px_rgba(0,0,0,0.16)] backdrop-blur ${
            isCollapsed ? "p-2" : "p-3"
          }`}
        >
          <div
            className={`flex items-center gap-2.5 ${
              isCollapsed ? "justify-center" : ""
            }`}
          >
            <div className="grid size-10 shrink-0 place-items-center rounded-full bg-[#dff7bd] text-xs font-bold text-[#27513f]">
              {initials}
            </div>
            <div className={`min-w-0 flex-1 ${isCollapsed ? "hidden" : ""}`}>
              <p className="truncate text-xs font-bold text-white">
                {userName}
              </p>
              <p className="text-xs text-white/68">{userRole}</p>
            </div>
            {isCollapsed ? null : (
              <ChevronDown className="size-3.5 text-white/62" />
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={`mt-2 h-7 w-full rounded-lg text-xs text-white/76 hover:bg-white/10 hover:text-white ${
              isCollapsed ? "justify-center px-0" : "justify-start"
            }`}
            onClick={() => signOut({ callbackUrl: "/" })}
            title="Keluar"
          >
            <LogOut className="size-3.5" />
            {isCollapsed ? null : "Keluar"}
          </Button>
        </div>
      </div>
    </aside>
  );
}

export function StaffMobileMenu({
  items,
  userName,
  userRole,
}: StaffSidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const initials = getInitials(userName) || "SU";

  return (
    <div className="relative md:hidden">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-10 rounded-lg bg-white/10 px-3 text-xs font-semibold text-white shadow-none hover:bg-white/15 hover:text-white"
        aria-label={isOpen ? "Tutup menu staff" : "Buka menu staff"}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        {isOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        Menu
      </Button>

      <div
        className={`fixed inset-0 z-50 transition-opacity duration-300 ease-out md:hidden ${
          isOpen
            ? "pointer-events-auto bg-[#10251d]/38 opacity-100"
            : "pointer-events-none bg-[#10251d]/0 opacity-0"
        }`}
        aria-hidden={!isOpen}
        onClick={() => setIsOpen(false)}
      >
        <div
          className={`ml-auto flex h-dvh w-[min(86vw,340px)] min-h-0 flex-col overflow-hidden bg-white text-[#1f2922] shadow-[-18px_0_44px_rgba(15,61,46,0.22)] transition-transform duration-300 ease-out ${
            isOpen ? "translate-x-0" : "translate-x-full"
          }`}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="relative overflow-hidden bg-[#003f2f] px-4 pb-5 pt-4 text-white">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(55,139,104,0.34),transparent_42%),linear-gradient(180deg,#003b2d_0%,#004633_100%)]" />
            <div className="relative z-10 flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <Image
                  src="/logo-unpad.svg"
                  alt="Logo Unpad"
                  width={38}
                  height={38}
                  className="size-9 shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-sm font-bold leading-tight">
                    ULT FMIPA UNPAD
                  </p>
                  <p className="mt-1 truncate text-xs text-white/72">
                    {userName} - {userRole}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-9 shrink-0 rounded-full bg-white/12 text-white hover:bg-white/20 hover:text-white"
                aria-label="Tutup menu staff"
                onClick={() => setIsOpen(false)}
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
            <div className="mb-4 rounded-lg border border-[#edf0e9] bg-[#f8fbf6] p-3">
              <div className="flex items-center gap-2.5">
                <div className="grid size-9 shrink-0 place-items-center rounded-full bg-[#dff7bd] text-xs font-bold text-[#27513f]">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-[#173d2d]">
                    {userName}
                  </p>
                  <p className="text-[11px] text-[#68736c]">{userRole}</p>
                </div>
              </div>
            </div>

            <nav className="grid gap-1.5">
              {items.map((item) => {
                const Icon =
                  navIcons[item.label as keyof typeof navIcons] ?? FileText;
                const isActive = isActivePath(pathname, item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition-colors ${
                      isActive
                        ? "bg-[#eaf7ef] text-[#0f5b45]"
                        : "text-[#536058] hover:bg-[#f6f1e8] hover:text-[#0f3d2e]"
                    }`}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="border-t border-[#edf0e9] bg-[#fffdf9] px-3 pb-6 pt-3">
            <Button
              type="button"
              className="h-10 w-full rounded-lg bg-[#0f5b45] text-xs font-semibold text-white shadow-[0_8px_18px_rgba(15,91,69,0.22)] hover:bg-[#0f3d2e]"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              <LogOut className="size-4" />
              Keluar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
