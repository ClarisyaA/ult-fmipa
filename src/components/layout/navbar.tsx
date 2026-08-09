"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
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
  const [touchStartX, setTouchStartX] = useState(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (sheetRef.current && sheetRef.current.contains(e.target as Node)) {
        setTouchStartX(e.touches[0].clientX);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStartX > 0) {
        const deltaX = touchStartX - e.touches[0].clientX;
        if (deltaX > 50 && isOpen) {
          setIsOpen(false);
          setTouchStartX(0);
        }
      }
    };

    const handleTouchEnd = () => {
      setTouchStartX(0);
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [touchStartX, isOpen]);

  return (
    <header className="fixed top-0 left-1/2 z-50 mt-4 w-full max-w-6xl -translate-x-1/2 p-2 px-4 sm:px-6 md:px-8 lg:px-8">
      <div className="relative border border-neutral-200/50 bg-background/85 backdrop-blur-lg shadow-lg rounded-full mx-auto flex h-14 w-full items-center justify-between px-4 transition-all duration-300 overflow-hidden">
        <div className="absolute -top-20 -left-20 h-40 w-40 rounded-full bg-gradient-to-r from-[#ff2d28]/5 to-transparent blur-2xl" />
        <div className="absolute -bottom-20 -right-20 h-40 w-40 rounded-full bg-gradient-to-l from-[#ff2d28]/5 to-transparent blur-2xl" />
        <div className="absolute top-0 left-1/4 h-px w-1/3 bg-gradient-to-r from-transparent via-[#ff2d28]/10 to-transparent" />
        <div className="absolute bottom-0 right-1/4 h-px w-1/3 bg-gradient-to-r from-transparent via-[#ff2d28]/10 to-transparent" />

        <Link href="/" className="relative z-10 shrink-0">
          <span className="bg-gradient-to-r from-[#ff2d28] via-[#e01f1a] to-[#c71410] bg-clip-text text-sm max-[350px]:text-[14px] font-bold tracking-tight text-transparent max-[350px]:hidden">
            UNIT LAYANAN TERPADU FMIPA UNPAD
          </span>
          <span className="bg-gradient-to-r from-[#ff2d28] via-[#e01f1a] to-[#c71410] bg-clip-text text-sm max-[350px]:text-[14px] font-bold tracking-tight text-transparent hidden max-[350px]:inline">
            UNIT LAYANAN TERPADU FMIPA
          </span>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex relative z-10">
          {publicNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative text-sm max-[350px]:text-xs font-medium transition-colors duration-200 
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

        {/* Desktop */}
        <div className="hidden items-center gap-2 lg:flex relative z-10">
          <Button 
            asChild 
            className="rounded-full bg-gradient-to-r from-[#ff2d28] to-[#e01f1a] text-white hover:from-[#e01f1a] hover:to-[#c71410] transition-all duration-300 text-xs max-[350px]:text-[10px] font-semibold px-4 h-8 shadow-md shadow-red-600/20 hover:shadow-red-600/30 hover:-translate-y-0.5"
          >
            <Link href="/layanan">Ajukan Layanan</Link>
          </Button>
          <UserMenu />
        </div>

        {/* Mobile / Tablet */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="lg:hidden rounded-full h-9 w-9 text-neutral-600 hover:bg-red-600/10 hover:text-red-600 transition-all duration-200 relative z-10"
              aria-label="Buka menu navigasi"
            >
              <Menu className="size-5 max-[350px]:size-4" />
            </Button>
          </SheetTrigger>

          <SheetContent 
            side="right" 
            aria-describedby={undefined}
            showCloseButton={false}
            className="w-full sm:w-80 p-0 border-l border-neutral-200 bg-background/95 backdrop-blur-md"
            ref={sheetRef}
          >
            <SheetHeader className="p-3.5 max-[350px]:p-2.5 border-b border-neutral-100 flex-row items-center justify-between gap-6 bg-gradient-to-r from-[#ff2d28]/5 via-[#e01f1a]/5 to-[#c71410]/5">
              <Link href="/" className="flex-1 min-w-0">
                <SheetTitle className="text-sm max-[350px]:text-[11px] font-bold text-red-600 tracking-tight text-left">
                  UNIT LAYANAN TERPADU FMIPA UNPAD
                </SheetTitle>
              </Link>
              <SheetClose asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-full h-8 w-8 max-[350px]:h-6 max-[350px]:w-6 bg-red-600 text-white hover:bg-red-700 hover:text-white transition-all duration-200 shrink-0 shadow-md shadow-red-600/30 hover:shadow-red-600/40 hover:scale-105"
                >
                  <X className="size-4 max-[350px]:size-3" />
                </Button>
              </SheetClose>
            </SheetHeader>
            
            <nav className="p-3 max-[350px]:p-2 grid gap-1">
              {publicNavItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center rounded-lg px-3 max-[350px]:px-2 py-2 max-[350px]:py-1.5 text-sm max-[350px]:text-xs font-medium transition-all duration-200
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
              
              <div className="border-t border-neutral-100 pt-3 max-[350px]:pt-2 grid gap-5 max-[350px]:gap-2">
                <Button 
                  asChild 
                  className="w-full rounded-full bg-gradient-to-r from-[#ff2d28] to-[#e01f1a] text-white hover:from-[#e01f1a] hover:to-[#c71410] transition-all duration-300 text-sm max-[350px]:text-xs font-semibold justify-center py-3.5 max-[350px]:py-3 shadow-md shadow-red-600/20 hover:shadow-red-600/30"
                >
                  <Link href="/layanan" onClick={() => setIsOpen(false)}>
                    Ajukan Layanan
                  </Link>
                </Button>
                <UserMenu variant="mobile" onNavigate={() => setIsOpen(false)} />
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
