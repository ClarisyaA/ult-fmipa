import { ProfileOrganizationManager } from "@/components/profile/profile-organization-manager";
import { AdminPageHeader, AdminPageShell } from "@/components/admin/admin-ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAdminProfileOrganizationState } from "@/lib/profile-cms";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminProfileStructurePage() {
  const { nodes, unavailable } = await getAdminProfileOrganizationState();

  return (
    <AdminPageShell wide>
      <AdminPageHeader
        title="Profil - Struktur Organisasi"
        description="Kelola node organisasi, foto, atasan, cabang, urutan, dan status aktif."
      />

      <Card className="min-w-0 overflow-hidden" data-tour="admin-profile-structure-tree">
        <CardHeader>
          <CardTitle>CMS Struktur Organisasi</CardTitle>
          <CardDescription>
            Parent root berarti node berada di level paling atas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileOrganizationManager
            rolePrefix="admin"
            initialNodes={nodes}
            unavailable={unavailable}
          />
        </CardContent>
      </Card>
    </AdminPageShell>
  );
}
