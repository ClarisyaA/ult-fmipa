import Link from "next/link";
import { Mail, MapPin } from "lucide-react";

import { publicNavItems } from "@/constants/navigation";

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
        <div>
          <p className="text-base font-semibold">ULT SBAK FMIPA Unpad</p>
          <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
            Pusat informasi dan layanan administrasi akademik FMIPA Unpad untuk
            mahasiswa, alumni, dan sivitas akademika.
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold">Tautan Cepat</p>
          <nav className="mt-3 grid gap-2">
            {publicNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div>
          <p className="text-sm font-semibold">Kontak</p>
          <div className="mt-3 grid gap-3 text-sm text-muted-foreground">
            <a
              href="mailto:sbak@fmipa.unpad.ac.id"
              className="flex items-start gap-2 transition-colors hover:text-foreground"
            >
              <Mail className="mt-0.5 size-4" />
              sbak@fmipa.unpad.ac.id
            </a>
            <p className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-4" />
              Jatinangor, Sumedang, Jawa Barat
            </p>
          </div>
        </div>
      </div>
      <div className="border-t py-4 text-center text-xs text-muted-foreground">
        © 2026 ULT SBAK FMIPA Unpad. Semua hak dilindungi.
      </div>
    </footer>
  );
}
