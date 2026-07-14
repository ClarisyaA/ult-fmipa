import { ProfileLocationManager } from "@/components/profile/profile-location-manager";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getProfileLocationState } from "@/lib/profile-cms";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminProfileLocationPage() {
  const { location, unavailable } = await getProfileLocationState();

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">
          Profil - Lokasi Kami
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Kelola teks lokasi, jam operasional, email, tombol arah, dan gambar.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>CMS Lokasi Kami</CardTitle>
          <CardDescription>
            Gunakan contain untuk denah/logo yang harus tampil utuh.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileLocationManager
            rolePrefix="admin"
            initialLocation={location}
            unavailable={unavailable}
          />
        </CardContent>
      </Card>
    </div>
  );
}
