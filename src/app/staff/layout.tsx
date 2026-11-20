import Image from "next/image";

import {
  StaffMobileMenu,
  StaffSidebar,
} from "@/components/layout/staff-sidebar";
import { OpsRequestNotifier } from "@/components/requests/ops-request-notifier";
import { staffNavItems } from "@/constants/navigation";
import { getCurrentUser } from "@/lib/auth";
import { hasStaffFeatureAccess } from "@/lib/feature-access";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function StaffLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();
  const userName = user?.name ?? "Staff ULT";
  const userRole = user?.role ?? "staff";

  // Menu "Import Data Mahasiswa" hanya muncul untuk staff yang diberi akses
  // oleh Admin (tab Role & Akses). Menu ditaruh sebelum "Website Publik".
  const canImportMahasiswa = await hasStaffFeatureAccess(
    user,
    "mahasiswa.import",
  );
  const navItems = canImportMahasiswa
    ? [
        ...staffNavItems.slice(0, -1),
        { label: "Data Mahasiswa", href: "/staff/master/mahasiswa" },
        ...staffNavItems.slice(-1),
      ]
    : staffNavItems;

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#f4f2fb]">
      <div className="flex h-full w-full overflow-hidden">
        <StaffSidebar
          items={navItems}
          userName={userName}
          userRole={userRole}
        />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <header className="shrink-0 border-b border-[#d8d2e7] bg-[#003f2f] px-3 py-2.5 text-white sm:px-6 md:hidden">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <Image
                  src="/logo-unpad.svg"
                  alt="Logo Unpad"
                  width={32}
                  height={32}
                  className="size-8 shrink-0"
                />
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold leading-tight sm:text-sm">
                    ULT FMIPA UNPAD
                  </p>
                  <p className="truncate text-[10px] text-white/70 sm:text-xs">
                    {userName} - {userRole}
                  </p>
                </div>
              </div>
              <StaffMobileMenu
                items={navItems}
                userName={userName}
                userRole={userRole}
              />
            </div>
          </header>
          <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-3.5 sm:p-5 lg:p-6">
            {children}
          </main>
          <OpsRequestNotifier role="staff" />
        </div>
      </div>
    </div>
  );
}
