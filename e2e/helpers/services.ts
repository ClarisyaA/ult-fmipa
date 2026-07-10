import { type Page } from "@playwright/test";

export const serviceSlugs = [
  "kartu-prestasi-akademik",
  "kartu-kemajuan-studi",
  "rekomendasi-beasiswa",
  "ket-tunjangan-orang-tua",
  "keterangan-masih-kuliah",
  "keterangan-kelakuan-baik",
  "surat-pengantar",
  "permohonan-magang-kerja-praktek-ta",
  "surat-izin-kegiatan",
  "keterangan-lulus",
  "penerbitan-transkrip",
  "penerbitan-ijazah",
  "legalisir-ijazah-transkrip",
  "bebas-peminjaman",
  "unggah-karya-ilmiah",
  "cek-plagiarisme",
  "referensi",
] as const;

export type ServiceSlug = (typeof serviceSlugs)[number];

export const serviceTitles: Record<ServiceSlug, string> = {
  "kartu-prestasi-akademik": "Kartu Prestasi Akademik",
  "kartu-kemajuan-studi": "Kartu Kemajuan Studi",
  "rekomendasi-beasiswa": "Rekomendasi Beasiswa",
  "ket-tunjangan-orang-tua": "Ket. Tunjangan Orang Tua",
  "keterangan-masih-kuliah": "Keterangan Masih Kuliah",
  "keterangan-kelakuan-baik": "Keterangan Kelakuan Baik",
  "surat-pengantar": "Surat Pengantar",
  "permohonan-magang-kerja-praktek-ta":
    "Permohonan Magang / Kerja Praktek / Tugas Akhir",
  "surat-izin-kegiatan": "Surat Izin Kegiatan",
  "keterangan-lulus": "Keterangan Lulus",
  "penerbitan-transkrip": "Penerbitan Transkrip",
  "penerbitan-ijazah": "Penerbitan Ijazah",
  "legalisir-ijazah-transkrip": "Legalisir Ijazah & Transkrip",
  "bebas-peminjaman": "Bebas Peminjaman",
  "unggah-karya-ilmiah": "Unggah Karya Ilmiah",
  "cek-plagiarisme": "Cek Plagiarisme",
  "referensi": "Referensi",
};

export function generateE2EMarker(slug: string): string {
  // Ensure total length is well within 100 characters for description
  return `E2E-${Date.now()}-${slug}`.substring(0, 95);
}

export async function fillCommonFields(page: Page, npm = "140810210001", email = "student@example.com", phone = "081234567890") {
  await page.locator("#npm").fill(npm);
  await page.locator("#email").fill(email);
  await page.locator("#phone").fill(phone);
}

export async function fillServiceForm(page: Page, slug: ServiceSlug, marker: string) {
  // Common fields first
  await fillCommonFields(page);

  // Conditional fields based on the service slug
  if (slug === "rekomendasi-beasiswa") {
    await page.locator("#scholarshipName").fill("Beasiswa E2E");
  }

  if (slug === "ket-tunjangan-orang-tua" || slug === "keterangan-masih-kuliah") {
    await page.getByTestId("request-semester").fill("6");
    await page.getByTestId("request-tahun-akademik").fill("2025/2026");
  }

  if (slug === "ket-tunjangan-orang-tua") {
    await page.locator("#namaOrangTua").fill("Orang Tua E2E");
    await page.locator("#nipNrp").fill("198001012005011001");
    await page.locator("#pangkatGolongan").fill("Pembina / IVa");
    await page.locator("#instansi").fill("Instansi E2E");
  }

  if (slug === "surat-pengantar") {
    await page.locator("#pengantar").fill(marker);
    await page.locator("#ditujukan").fill("Fakultas MIPA Unpad");
    await page.locator("#dasarSuratNo").fill("123/UN6.D/TU/2026");
    await page.locator("#dasarSuratPerihal").fill("Permohonan E2E");
    await page.locator("#dasarSuratTgl").fill("2026-06-15");
  }

  if (slug === "permohonan-magang-kerja-praktek-ta") {
    await page.locator("#jenisPermohonan").selectOption("Magang Kerja");
    await page.locator("#kontakPerson").fill("Kontak E2E");
    await page.locator("#tempatPelaksanaan").fill("Instansi E2E");
    await page.locator("#tujuanSurat").fill("Pimpinan Instansi E2E");
    await page.locator("#alamatSurat").fill("Jl. Pengujian No. 1");
    await page.locator("#kecamatanKabupaten").fill("Jatinangor, Sumedang");
    await page.locator("#kotaKabupaten").fill("Sumedang");
    await page.locator("#provinsi").fill("Jawa Barat");
    await page.locator("#tanggalMulai").fill("2026-07-01");
    await page.locator("#tanggalSelesai").fill("2026-08-01");
    await page.locator("#attachments").setInputFiles({
      name: "surat-permohonan-prodi.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4\n% E2E test PDF\n"),
    });
  }

  if (slug === "keterangan-lulus") {
    await page.locator("#tempatLahir").fill("Bandung");
    await page.locator("#tanggalLahir").fill("2004-01-01");
    await page.locator("#tanggalLulus").fill("2026-06-01");
    await page.locator("#ipk").fill("3.85");
    await page.locator("#yudisium").fill("Dengan Pujian");
  }

  if (slug === "penerbitan-transkrip" || slug === "penerbitan-ijazah") {
    await page.locator("#tanggalLulus").fill("2026-06-01");
  }

  if (slug === "legalisir-ijazah-transkrip") {
    await page.locator("#jumlahTranskrip").fill("5");
    await page.locator("#jumlahIjazah").fill("5");
    await page.locator("#jumlahTranslet").fill("2");
  }

  // Textarea description is present for all except surat-pengantar, keterangan-lulus, ijazah, transkrip
  const hasDescription = ![
    "surat-pengantar",
    "keterangan-lulus",
    "penerbitan-ijazah",
    "penerbitan-transkrip",
    "permohonan-magang-kerja-praktek-ta",
  ].includes(slug);
  if (hasDescription) {
    await page.getByTestId("request-description").fill(marker);
  }
}
