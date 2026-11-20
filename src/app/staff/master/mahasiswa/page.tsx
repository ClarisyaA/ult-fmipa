import { redirect } from "next/navigation";

import {
  AdminPageHeader,
  AdminPageShell,
  AdminSectionCard,
} from "@/components/admin/admin-ui";
import { MahasiswaImportButton } from "@/components/admin/master-actions/mahasiswa-import-button";
import { getCurrentUser } from "@/lib/auth";
import { hasStaffFeatureAccess } from "@/lib/feature-access";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Halaman ini hanya untuk Staff yang sudah diberi akses "Import Data Mahasiswa"
// oleh Admin (Admin > System > User > tab Role & Akses).
export default async function StaffMahasiswaImportPage() {
  const user = await getCurrentUser();

  if (!(await hasStaffFeatureAccess(user, "mahasiswa.import"))) {
    redirect("/staff/dashboard");
  }

  return (
    <AdminPageShell>
      <AdminPageHeader
        title="Import Data Mahasiswa"
        description="Perbarui data mahasiswa dari file Excel. Gunakan template yang sama seperti sebelumnya."
        action={
          <MahasiswaImportButton endpoint="/api/staff/master/mahasiswa/import" />
        }
      />

      <AdminSectionCard title="Cara penggunaan">
        <ol className="grid list-decimal gap-1.5 pl-5 text-xs text-[#5d665f]">
          <li>Klik Import Excel lalu unduh template, atau pakai template yang sudah ada.</li>
          <li>Isi kolom NPM, Nama, Kode Prodi, Nama Prodi, Nama Jenjang, dan Angkatan.</li>
          <li>Pilih file, klik Periksa file, lalu cek jumlah data yang akan ditambah dan diperbarui.</li>
          <li>Klik Simpan perubahan. Data yang sudah ada tidak pernah dihapus.</li>
        </ol>
      </AdminSectionCard>
    </AdminPageShell>
  );
}
