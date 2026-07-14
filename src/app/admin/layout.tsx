import Image from "next/image";

import {
  AdminMobileMenu,
  AdminSidebar,
} from "@/components/layout/admin-sidebar";
import { OpsRequestNotifier } from "@/components/requests/ops-request-notifier";
import { AdminTutorialButton } from "@/components/tutorial/admin-tutorial-button";
import { AdminTutorialOverlay } from "@/components/tutorial/admin-tutorial-overlay";
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
    <div className="fixed inset-0 overflow-hidden bg-[#f4f2fb]">
      <div className="flex h-full w-full overflow-hidden">
        <AdminSidebar
          groups={adminNavGroups}
          userName={userName}
          userRole={userRole}
        />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
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
          <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-5 lg:p-6">
            {children}
          </main>
          <OpsRequestNotifier role="admin" />
          <div className="fixed right-20 top-4 z-40 md:right-24 md:top-6">
            <AdminTutorialButton />
          </div>
          <AdminTutorialOverlay />
        </div>
      </div>
    </div>
  );
}
