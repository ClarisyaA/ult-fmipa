import Image from "next/image";
import type { Metadata } from "next";

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
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

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

        <div className="flex min-h-0 min-w-0 w-0 flex-1 flex-col overflow-hidden">
          <header className="shrink-0 border-b border-[#d8d2e7] bg-[#003f2f] px-3 py-2.5 text-white sm:px-6 md:hidden">
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <AdminMobileMenu
                  groups={adminNavGroups}
                  userName={userName}
                  userRole={userRole}
                />
                <Image
                  src="/letters/logo-unpad.png"
                  alt="Logo Unpad"
                  width={32}
                  height={32}
                  className="size-7 shrink-0"
                />
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold leading-tight sm:text-sm">
                    Admin ULT FMIPA
                  </p>
                  <p className="truncate text-[10px] capitalize leading-tight text-white/70 sm:text-[11px]">
                    {userName} - {userRole}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <OpsRequestNotifier role="admin" inline />
                <AdminTutorialButton />
              </div>
            </div>
          </header>
          <main
            className="min-h-0 min-w-0 w-full max-w-full flex-1 overflow-y-auto overflow-x-hidden p-3.5 sm:p-5 lg:p-6"
            data-admin-scroll-container
          >
            {children}
          </main>
          <div className="hidden md:block">
            <OpsRequestNotifier role="admin" />
          </div>

          <AdminTutorialOverlay />
        </div>
      </div>
    </div>
  );
}
