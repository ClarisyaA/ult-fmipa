"use client";

import Link from "next/link";
import { Mail, MapPin, Globe } from "lucide-react";
import { publicNavItems } from "@/constants/navigation";

export function Footer() {
  return (
    <footer className="relative z-50 mt-auto overflow-hidden border-t border-neutral-200/60 bg-[linear-gradient(135deg,#ffebe9_0%,#fdfdfd_42%,#f5f7f6_100%)] text-neutral-600">
      <div className="pointer-events-none absolute -left-16 top-20 h-64 w-64 rounded-full bg-red-100/30 blur-3xl max-md:h-40 max-md:w-40 max-sm:h-28 max-sm:w-28" />
      <div className="pointer-events-none absolute -right-16 bottom-20 h-64 w-64 rounded-full bg-amber-100/25 blur-3xl max-md:h-40 max-md:w-40 max-sm:h-28 max-sm:w-28" />
      
      <div className="pointer-events-none absolute left-1/4 top-0 h-px w-1/2 bg-gradient-to-r from-transparent via-red-200/50 to-transparent max-md:hidden" />
      <div className="pointer-events-none absolute bottom-0 right-1/4 h-px w-1/3 bg-gradient-to-r from-transparent via-amber-200/40 to-transparent max-md:hidden" />
      
      <div className="pointer-events-none absolute left-1/3 top-8 h-12 w-12 rounded-full border border-red-200/30 max-md:h-6 max-md:w-6 max-sm:hidden" />
      <div className="pointer-events-none absolute right-1/4 bottom-12 h-8 w-8 rounded-full border border-amber-200/30 max-md:h-5 max-md:w-5 max-sm:hidden" />
      <div className="pointer-events-none absolute left-2/3 bottom-8 h-6 w-6 rounded-full bg-red-100/20 max-md:h-3 max-md:w-3 max-sm:hidden" />

      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-6 md:gap-6 md:px-6 md:py-8 lg:grid-cols-[1.5fr_0.8fr_1fr] lg:gap-8 lg:py-10">
        
        <div className="flex flex-col gap-3 lg:col-span-1">
          <Link href="/" className="flex items-center gap-3">
            <span className="text-lg font-black tracking-tight text-neutral-900 sm:text-xl md:text-2xl whitespace-nowrap">
              <span className="bg-gradient-to-r from-red-600 to-red-500 bg-clip-text font-black text-transparent">Unit Layanan Terpadu</span>
              <span> FMIPA Unpad</span>
            </span>
          </Link>
          <p className="text-sm leading-6 text-neutral-500 md:max-w-none">
            Pusat informasi dan layanan administrasi akademik FMIPA Unpad untuk mahasiswa, alumni, dan civitas akademika.
          </p>
          
          <div className="mt-1 flex items-center gap-2.5">
            <a
              href="https://fmipa.unpad.ac.id/"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-400 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-red-500 hover:bg-red-50 hover:text-red-600"
              aria-label="Website FMIPA Unpad"
            >
              <Globe className="h-3.5 w-3.5 md:h-4 md:w-4" />
            </a>
            
            <a
              href="https://www.instagram.com/fmipa.unpad/"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-400 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-red-500 hover:bg-red-50 hover:text-red-600"
              aria-label="Instagram FMIPA Unpad"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="h-3.5 w-3.5 md:h-4 md:w-4"
              >
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
              </svg>
            </a>

            <a
              href="https://www.youtube.com/@fmipa_unpad"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-400 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-red-500 hover:bg-red-50 hover:text-red-600"
              aria-label="Youtube FMIPA Unpad"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="h-3.5 w-3.5 md:h-4 md:w-4"
              >
                <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17z"/>
                <polygon points="10 15 15 12 10 9"/>
              </svg>
            </a>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 lg:col-span-2 lg:grid-cols-[0.8fr_1fr]">
          <div className="flex flex-col gap-3">
            <p className="text-xs font-black uppercase tracking-wider text-neutral-800">
              Tautan Cepat
            </p>
            <nav className="grid gap-2">
              {publicNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="w-fit text-sm text-neutral-500 transition-colors duration-200 hover:text-red-600"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-xs font-black uppercase tracking-wider text-neutral-800">
              Hubungi Kami
            </p>
            <div className="grid gap-3 text-sm text-neutral-500">
              <a
                href="mailto:ult.fmipa@unpad.ac.id"
                className="group flex items-start gap-3 transition-colors duration-200 hover:text-red-600"
              >
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-red-600/70 group-hover:text-red-600" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-wider text-neutral-900">Email</span>
                  <span className="mt-0.5 break-all text-sm">ult.fmipa@unpad.ac.id</span>
                </div>
              </a>
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-red-600/70" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-wider text-neutral-900">Alamat</span>
                  <span className="mt-0.5 text-sm leading-6">
                    Gedung Dekanat FMIPA Unpad, Kampus Jatinangor, Sumedang 45363
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-neutral-200/40 bg-white/40 py-3 text-center text-xs font-medium text-neutral-400">
        <div className="mx-auto max-w-6xl px-4">
          © {new Date().getFullYear()} Unit Layanan Terpadu FMIPA Unpad
        </div>
      </div>
    </footer>
  );
}