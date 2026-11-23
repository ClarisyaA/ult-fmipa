"use client";

import { LogOut } from "lucide-react";
import { logout } from "@/lib/client-logout";

import { Button } from "@/components/ui/button";

export function LogoutButton() {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => void logout()}
    >
      <LogOut className="size-4" />
      Keluar
    </Button>
  );
}
