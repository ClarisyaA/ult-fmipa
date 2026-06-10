import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { adminNavItems } from "@/constants/navigation";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl">
        <aside className="hidden w-64 border-r bg-background px-5 py-6 md:block">
          <p className="text-lg font-semibold">Admin ULT</p>
          <Badge variant="secondary" className="mt-3">
            Mode pengembangan
          </Badge>
          <nav className="mt-8 grid gap-2">
            {adminNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="border-b bg-background px-4 py-4 sm:px-6 md:hidden">
            <div className="flex items-center justify-between gap-4">
              <p className="font-semibold">Admin ULT</p>
              <Badge variant="secondary">Mode pengembangan</Badge>
            </div>
          </header>
          <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
