import {
  AdminEmptyState,
  AdminPageHeader,
  AdminPageShell,
  AdminSectionCard,
  AdminStatusBadge,
  AdminTableScroll,
  AdminUnavailableState,
} from "@/components/admin/admin-ui";
import { StaffAccessToggle } from "@/components/admin/staff-access-toggle";
import { SystemUsersTabs } from "@/components/admin/system-users-tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TruncatedTableText } from "@/components/ui/truncated-table-text";
import { isDatabaseUnavailableError, logServerError } from "@/lib/error-utils";
import { STAFF_FEATURES, STAFF_FEATURE_KEYS } from "@/lib/feature-access-core";
import { getFeatureGrants } from "@/lib/feature-access";
import { prisma } from "@/lib/prisma";
import { resolveAppRole } from "@/lib/roles";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminSystemAccessPage() {
  let staff: {
    USER_NAME: string;
    FULL_NAME: string;
    EMAIL: string;
    CONFIRMED: string;
  }[] = [];
  let grants = new Map<string, string[]>();
  let unavailable = false;
  let tableMissing = false;

  try {
    const users = await prisma.data_users.findMany({
      select: {
        USER_NAME: true,
        FULL_NAME: true,
        EMAIL: true,
        CONFIRMED: true,
        APP_ROLE: true,
        ACCESS_CODE: true,
      },
      orderBy: { FULL_NAME: "asc" },
    });

    staff = users.filter(
      (user) =>
        resolveAppRole({
          appRole: user.APP_ROLE,
          positionCode: user.ACCESS_CODE,
        }) === "STAFF",
    );

    try {
      grants = await getFeatureGrants(staff.map((user) => user.USER_NAME));
    } catch (error) {
      // Tabel belum dibuat: migrasi 013 belum dijalankan.
      tableMissing = true;
      logServerError("admin:system:access:grants", error);
    }
  } catch (error) {
    if (!isDatabaseUnavailableError(error)) {
      throw error;
    }
    unavailable = true;
    logServerError("admin:system:access", error);
  }

  return (
    <AdminPageShell>
      <SystemUsersTabs active="access" />
      <AdminPageHeader
        title="Role & Akses"
        description="Beri akses fitur tambahan kepada akun Staff. Admin selalu memiliki semua akses."
      />

      <AdminSectionCard
        title="Akses fitur Staff"
        description="Centang untuk memberi akses, hapus centang untuk mencabutnya. Perubahan berlaku saat staff membuka halaman berikutnya."
      >
        {unavailable ? (
          <AdminUnavailableState />
        ) : tableMissing ? (
          <AdminEmptyState
            title="Tabel akses belum tersedia"
            description="Jalankan migrasi pendukung (pnpm db:support-migrate) agar tabel ult_staff_feature_access terbentuk."
          />
        ) : staff.length === 0 ? (
          <AdminEmptyState
            title="Belum ada akun Staff"
            description="Tambahkan akun dengan akses aplikasi Staff di tab Daftar User."
          />
        ) : (
          <AdminTableScroll>
            <Table className="min-w-[720px] table-fixed">
              <TableHeader className="bg-[#eef3ec]">
                <TableRow>
                  <TableHead>Staff</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  {STAFF_FEATURE_KEYS.map((feature) => (
                    <TableHead key={feature}>
                      {STAFF_FEATURES[feature].label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.map((user) => (
                  <TableRow key={user.USER_NAME}>
                    <TableCell className="min-w-0">
                      <p className="font-semibold">
                        <TruncatedTableText value={user.FULL_NAME} />
                      </p>
                      <p className="text-[11px] text-[#7a7166]">
                        {user.USER_NAME}
                      </p>
                    </TableCell>
                    <TableCell className="min-w-0">
                      <TruncatedTableText value={user.EMAIL} />
                    </TableCell>
                    <TableCell>
                      <AdminStatusBadge
                        tone={user.CONFIRMED === "1" ? "success" : "neutral"}
                      >
                        {user.CONFIRMED === "1" ? "Aktif" : "Belum konfirmasi"}
                      </AdminStatusBadge>
                    </TableCell>
                    {STAFF_FEATURE_KEYS.map((feature) => (
                      <TableCell key={feature}>
                        <StaffAccessToggle
                          userName={user.USER_NAME}
                          feature={feature}
                          label={STAFF_FEATURES[feature].label}
                          initialGranted={
                            grants.get(user.USER_NAME)?.includes(feature) ?? false
                          }
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </AdminTableScroll>
        )}
      </AdminSectionCard>

      <AdminSectionCard title="Keterangan fitur">
        <ul className="grid gap-2 text-xs text-[#5d665f]">
          {STAFF_FEATURE_KEYS.map((feature) => (
            <li key={feature}>
              <span className="font-semibold text-[#303b34]">
                {STAFF_FEATURES[feature].label}
              </span>{" "}
              - {STAFF_FEATURES[feature].description}
            </li>
          ))}
        </ul>
      </AdminSectionCard>
    </AdminPageShell>
  );
}
