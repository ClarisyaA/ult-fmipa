import { ProfileStructureManager } from "@/components/profile/profile-structure-manager";
import { AdminPageHeader, AdminPageShell } from "@/components/admin/admin-ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAdminProfileStructureState } from "@/lib/profile-structure-cms";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminProfileStructurePage() {
  const { settings, nodes, unavailable } = await getAdminProfileStructureState();

  return (
    <AdminPageShell wide>
      <AdminPageHeader
        title="Profil - Struktur Organisasi"
        description="Kelola judul, subjudul, node, hierarki, dan isian pada bagian Struktur Organisasi ULT di halaman Profil."
      />

      <Card className="min-w-0 overflow-hidden" data-tour="admin-profile-structure-tree">
        <CardHeader>
          <CardTitle>CMS Struktur Organisasi</CardTitle>
          <CardDescription>
            Tambah, ubah, hapus, dan urutkan node beserta isinya. Tampilan halaman publik tetap mengikuti desain yang sama.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileStructureManager
            rolePrefix="admin"
            initialSettings={settings}
            initialNodes={nodes}
            unavailable={unavailable}
          />
        </CardContent>
      </Card>
    </AdminPageShell>
  );
}
