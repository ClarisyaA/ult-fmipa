import { ProfileOrganizationManager } from "@/components/profile/profile-organization-manager";
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
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">
          Profil - Struktur Organisasi
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Kelola node organisasi, foto, atasan, cabang, urutan, dan status aktif.
        </p>
      </div>

      <Card data-tour="admin-profile-structure-tree">
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
    </div>
  );
}
