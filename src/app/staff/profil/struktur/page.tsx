import { ProfileStructureManager } from "@/components/profile/profile-structure-manager";
import {
  AdminPageHeader,
  AdminPageShell,
  AdminSectionCard,
} from "@/components/admin/admin-ui";
import { getAdminProfileStructureState } from "@/lib/profile-structure-cms";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function StaffProfileStructurePage() {
  const { settings, nodes, unavailable } = await getAdminProfileStructureState();

  return (
    <AdminPageShell wide>
      <AdminPageHeader
        title="Profil - Struktur Organisasi"
        description="Kelola judul, subjudul, node, hierarki, dan isian pada bagian Struktur Organisasi ULT di halaman Profil."
      />

      <AdminSectionCard
        title="CMS Struktur Organisasi"
        description="Tambah, ubah, hapus, dan urutkan node beserta isinya. Tampilan halaman publik tetap mengikuti desain yang sama."
        className="min-w-0"
      >
        <ProfileStructureManager
          rolePrefix="staff"
          initialSettings={settings}
          initialNodes={nodes}
          unavailable={unavailable}
        />
      </AdminSectionCard>
    </AdminPageShell>
  );
}
