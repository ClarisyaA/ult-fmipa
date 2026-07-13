import Image from "next/image";

import {
  AdminMobileMenu,
  AdminSidebar,
} from "@/components/layout/admin-sidebar";
import { OpsRequestNotifier } from "@/components/requests/ops-request-notifier";
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
          <header className="shrink-0 border-b border-[#d8d2e7] bg-[#003f2f] px-4 py-4 text-white sm:px-6 md:hidden">
            <div className="flex items-center gap-3">
              <AdminMobileMenu
                groups={adminNavGroups}
                userName={userName}
                userRole={userRole}
              />
              <div className="flex min-w-0 items-center gap-3">
                <Image
                  src="/logo-unpad.svg"
                  alt="Logo Unpad"
                  width={36}
                  height={36}
                  className="size-9"
                />
                <div>
                  <p className="font-semibold">Admin ULT FMIPA</p>
                  <p className="text-xs capitalize text-white/70">
                    {userName} - {userRole}
                  </p>
                </div>
              </div>
            </div>
          </header>
          <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6">
            {children}
          </main>
          <OpsRequestNotifier role="admin" />
        </div>
      </div>
    </div>
  );
}
