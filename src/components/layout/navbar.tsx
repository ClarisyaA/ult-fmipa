"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";

import { publicNavItems } from "@/constants/navigation";
import { UserMenu } from "@/components/auth/user-menu";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="fixed top-0 left-1/2 z-50 mt-4 w-full max-w-6xl -translate-x-1/2 p-2 px-4 sm:px-6 md:px-0 lg:px-8">
      <div className="relative border border-neutral-200/50 bg-background/85 backdrop-blur-lg shadow-lg rounded-full mx-auto flex h-14 w-full items-center justify-between px-4 transition-all duration-300 overflow-hidden">
        <div className="absolute -top-20 -left-20 h-40 w-40 rounded-full bg-gradient-to-r from-[#ff2d28]/5 to-transparent blur-2xl" />
        <div className="absolute -bottom-20 -right-20 h-40 w-40 rounded-full bg-gradient-to-l from-[#ff2d28]/5 to-transparent blur-2xl" />
        <div className="absolute top-0 left-1/4 h-px w-1/3 bg-gradient-to-r from-transparent via-[#ff2d28]/10 to-transparent" />
        <div className="absolute bottom-0 right-1/4 h-px w-1/3 bg-gradient-to-r from-transparent via-[#ff2d28]/10 to-transparent" />
        
        <Link href="/" className="flex items-center gap-2 relative z-10">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
            ULT
          </span>
          <span className="text-sm font-bold text-red-600 tracking-tight">
            ULT SBAK FMIPA UNPAD
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex relative z-10">
          {publicNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative text-sm font-medium transition-colors duration-200 
                  ${isActive 
                    ? "text-red-600 font-semibold" 
                    : "text-muted-foreground hover:text-red-600" 
                  }
                  before:absolute before:-bottom-1.5 before:left-0 before:h-0.5 before:bg-red-600 before:transition-all before:duration-300
                  ${isActive 
                    ? "before:w-full" 
                    : "before:w-0 hover:before:w-full" 
                  }
                `}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 md:flex relative z-10">
          <Button 
            asChild 
            className="rounded-full bg-gradient-to-r from-[#ff2d28] to-[#e01f1a] text-white hover:from-[#e01f1a] hover:to-[#c71410] transition-all duration-300 text-xs font-semibold px-4 h-8 shadow-md shadow-red-600/20 hover:shadow-red-600/30 hover:-translate-y-0.5"
          >
            <Link href="/layanan">Ajukan Layanan</Link>
          </Button>
          <UserMenu />
        </div>

        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="md:hidden rounded-full h-9 w-9 text-neutral-600 hover:bg-red-600/10 hover:text-red-600 transition-all duration-200 relative z-10"
              aria-label="Buka menu navigasi"
            >
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent 
            side="right" 
            className="w-full sm:w-80 p-0 border-l border-neutral-200 bg-background/95 backdrop-blur-md"
          >
            <SheetHeader className="p-5 border-b border-neutral-100 flex-row items-center justify-between">
              <Link href="/" className="flex items-center gap-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                  ULT
                </span>
                <SheetTitle className="text-sm font-bold text-red-600 tracking-tight text-left">
                  ULT FMIPA
                </SheetTitle>
              </Link>
              <SheetClose asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-full h-8 w-8 text-neutral-500 hover:bg-red-600/10 hover:text-red-600 transition-all duration-200"
                >
                  <X className="size-4" />
                </Button>
              </SheetClose>
            </SheetHeader>
            
            <nav className="p-4 grid gap-1">
              {publicNavItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200
                      ${isActive
                        ? "bg-red-600/10 text-red-600 font-semibold" 
                        : "text-muted-foreground hover:bg-neutral-100 hover:text-foreground" 
                      }
                    `}
                  >
                    {item.label}
                  </Link>
                );
              })}
              
              <div className="border-t border-neutral-100 mt-3 pt-4 grid gap-2 px-1">
                <Button 
                  asChild 
                  className="w-full rounded-lg bg-gradient-to-r from-[#ff2d28] to-[#e01f1a] text-white hover:from-[#e01f1a] hover:to-[#c71410] transition-all duration-300 text-sm font-semibold justify-center py-4 shadow-md shadow-red-600/20 hover:shadow-red-600/30"
                >
                  <Link href="/layanan" onClick={() => setIsOpen(false)}>Ajukan Layanan</Link>
                </Button>
                <div className="flex justify-center pt-1">
                  <UserMenu />
                </div>
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
