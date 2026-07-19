import { ProfileOrganizationManager } from "@/components/profile/profile-organization-manager";
import {
  AdminPageHeader,
  AdminPageShell,
  AdminSectionCard,
} from "@/components/admin/admin-ui";
import { getAdminProfileOrganizationState } from "@/lib/profile-cms";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function StaffProfileStructurePage() {
  const { nodes, unavailable } = await getAdminProfileOrganizationState();

  return (
    <AdminPageShell wide>
      <AdminPageHeader
        title="Profil - Struktur Organisasi"
        description="Kelola node organisasi, foto, atasan, cabang, urutan, dan status aktif."
      />

      <AdminSectionCard
        title="CMS Struktur Organisasi"
        description="Parent root berarti node berada di level paling atas."
        className="min-w-0"
      >
        <ProfileOrganizationManager
          rolePrefix="staff"
          initialNodes={nodes}
          unavailable={unavailable}
        />
      </AdminSectionCard>
    </AdminPageShell>
  );
}
