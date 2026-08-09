"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BookOpen, Map } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { adminTutorialSteps } from "@/lib/admin-tutorial-steps";

const activeKey = "ult-admin-tutorial-active";
const stepKey = "ult-admin-tutorial-step";
const modeKey = "ult-admin-tutorial-mode";

function buildAdminTourHref() {
  const route = adminTutorialSteps[0]?.route ?? "/admin/dashboard";
  const url = new URL(route, "http://local.tour");
  url.searchParams.set("tour", "admin");
  url.searchParams.set("step", "0");
  return `${url.pathname}?${url.searchParams.toString()}`;
}

function buildPageTourHref(pathname: string, searchParams: URLSearchParams) {
  const nextParams = new URLSearchParams(searchParams.toString());
  nextParams.set("tour", "page");
  nextParams.set("step", "0");
  return `${pathname}?${nextParams.toString()}`;
}

export function AdminTutorialButton() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isDashboard = pathname === "/admin/dashboard";

  function start(mode: "admin" | "page") {
    window.localStorage.setItem(activeKey, "true");
    window.localStorage.setItem(stepKey, "0");
    window.localStorage.setItem(modeKey, mode);

    const href =
      mode === "admin"
        ? buildAdminTourHref()
        : buildPageTourHref(pathname, new URLSearchParams(searchParams.toString()));

    router.push(href, { scroll: false });
  }

  if (!isDashboard) {
    return (
      <Button
        type="button"
        size="sm"
        className="h-9 rounded-md bg-[#0f5b45] px-3 text-[11px] font-semibold text-white shadow-lg hover:bg-[#0f3d2e]"
        data-tour="admin-tutorial-button"
        onClick={() => start("page")}
      >
        <BookOpen className="size-3.5" />
        Tutorial
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          size="sm"
          className="h-9 rounded-md bg-[#0f5b45] px-3 text-[11px] font-semibold text-white shadow-lg hover:bg-[#0f3d2e]"
          data-tour="admin-tutorial-button"
        >
          <BookOpen className="size-3.5" />
          Tutorial
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56 border-[#e8dfd0] bg-white text-[#1f261f]"
      >
        <DropdownMenuLabel className="text-xs text-[#6f746f]">
          Pilih tutorial
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => start("admin")}
        >
          <Map className="size-4" />
          Tutorial Lengkap Admin
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => start("page")}
        >
          <BookOpen className="size-4" />
          Tutorial Halaman Ini
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

