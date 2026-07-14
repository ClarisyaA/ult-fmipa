"use client";

import Link from "next/link";
import { Globe } from "lucide-react";

import { Button } from "@/components/ui/button";

export function AdminDashboardTutorialButton() {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Button
        asChild
        variant="outline"
        size="sm"
        className="h-8 rounded-md border-[#e1d8ca] bg-white px-3 text-[11px] font-semibold text-[#39433c] hover:bg-[#f6f1e8]"
      >
        <Link href="/">
          <Globe className="size-3.5" />
          Website Publik
        </Link>
      </Button>
    </div>
  );
}
