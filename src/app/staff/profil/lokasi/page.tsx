import { ProfileLocationManager } from "@/components/profile/profile-location-manager";
import {
  AdminPageHeader,
  AdminPageShell,
  AdminSectionCard,
} from "@/components/admin/admin-ui";
import { getProfileLocationState } from "@/lib/profile-cms";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function StaffProfileLocationPage() {
  const { location, unavailable } = await getProfileLocationState();

  return (
    <AdminPageShell>
      <AdminPageHeader
        title="Profil - Lokasi Kami"
        description="Kelola teks lokasi, jam operasional, email, tombol petunjuk arah, dan gambar yang tampil pada halaman profil."
      />

      <AdminSectionCard
        title="Pengaturan Lokasi"
        description="Lengkapi informasi publik dan gunakan mode tampil utuh untuk denah atau logo yang tidak boleh terpotong."
      >
          <ProfileLocationManager
            rolePrefix="staff"
            initialLocation={location}
            unavailable={unavailable}
          />
      </AdminSectionCard>
    </AdminPageShell>
  );
}
