import Link from "next/link";

import { LogoutButton } from "@/components/layout/logout-button";
import { Badge } from "@/components/ui/badge";
import { adminNavItems } from "@/constants/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl">
        <aside className="hidden w-64 border-r bg-background px-5 py-6 md:block">
          <p className="text-lg font-semibold">Admin ULT</p>
          <Badge variant="secondary" className="mt-3">
            Mode pengembangan
          </Badge>
          <div className="mt-5 rounded-lg border bg-muted/30 p-3">
            <p className="text-sm font-medium">{user?.name ?? "Admin"}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Role: {user?.role ?? "admin"}
            </p>
            <div className="mt-3">
              <LogoutButton />
            </div>
          </div>
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
              <div>
                <p className="font-semibold">Admin ULT</p>
                <p className="text-xs text-muted-foreground">
                  {user?.name ?? "Admin"} · {user?.role ?? "admin"}
                </p>
              </div>
              <LogoutButton />
            </div>
          </header>
          <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
