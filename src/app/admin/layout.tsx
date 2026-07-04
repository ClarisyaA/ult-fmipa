import Image from "next/image";

import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { LogoutButton } from "@/components/layout/logout-button";
import { adminNavGroups } from "@/constants/navigation";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();
  const userName = user?.name ?? "Admin ULT";
  const userRole = user?.role ?? "admin";

  return (
    <div className="h-dvh overflow-hidden bg-[#f4f2fb]">
      <div className="flex h-full w-full">
        <AdminSidebar
          groups={adminNavGroups}
          userName={userName}
          userRole={userRole}
        />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <header className="border-b border-[#d8d2e7] bg-[#003f2f] px-4 py-4 text-white sm:px-6 md:hidden">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Image
                  src="/logo-unpad.svg"
                  alt="Logo Unpad"
                  width={36}
                  height={36}
                  className="size-9"
                />
                <div>
                  <p className="font-semibold">Admin ULT FMIPA</p>
                  <p className="text-xs text-white/70">
                    {userName} - {userRole}
                  </p>
                </div>
              </div>
              <LogoutButton />
            </div>
          </header>
          <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
