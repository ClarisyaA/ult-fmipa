import type { PublicService } from "@/types/service";

export const publicServices = [
  {
    title: "Kartu Prestasi Akademik",
    slug: "kartu-prestasi-akademik",
    category: "Layanan Mahasiswa",
    description:
      "Layanan penerbitan Kartu Prestasi Akademik untuk kebutuhan administrasi mahasiswa.",
    requirements: ["NPM", "Program studi", "Keperluan layanan"],
    processingTime: "2-4 hari kerja",
    sourceTable: "kpa",
  },
  {
    title: "Kartu Kemajuan Studi",
    slug: "kartu-kemajuan-studi",
    category: "Layanan Mahasiswa",
    description:
      "Layanan administrasi Kartu Kemajuan Studi untuk pemantauan dan kebutuhan akademik.",
    requirements: ["NPM", "Program studi", "Keperluan layanan"],
    processingTime: "2-5 hari kerja",
    sourceTable: "kks",
  },
  {
    title: "Rekomendasi Beasiswa",
    slug: "rekomendasi-beasiswa",
    category: "Layanan Mahasiswa",
    description:
      "Pengajuan rekomendasi atau administrasi pendukung untuk kebutuhan beasiswa.",
    requirements: ["NPM", "Nama beasiswa", "Keterangan pengajuan"],
    processingTime: "2-5 hari kerja",
    sourceTable: "beasiswa",
  },
  {
    title: "Ket. Tunjangan Orang Tua",
    slug: "ket-tunjangan-orang-tua",
    category: "Layanan Mahasiswa",
    description:
      "Permohonan keterangan untuk kebutuhan tunjangan orang tua atau administrasi keluarga.",
    requirements: ["NPM", "Semester", "Tahun akademik"],
    processingTime: "1-3 hari kerja",
    sourceTable: "masih_kuliah",
  },
  {
    title: "Keterangan Masih Kuliah",
    slug: "keterangan-masih-kuliah",
    category: "Layanan Mahasiswa",
    description:
      "Permohonan surat keterangan masih kuliah aktif untuk kebutuhan administrasi.",
    requirements: ["NPM", "Semester", "Keperluan surat"],
    processingTime: "1-3 hari kerja",
    sourceTable: "masih_kuliah_aktif",
  },
  {
    title: "Keterangan Kelakuan Baik",
    slug: "keterangan-kelakuan-baik",
    category: "Layanan Mahasiswa",
    description:
      "Permohonan surat keterangan kelakuan baik untuk kebutuhan administrasi mahasiswa.",
    requirements: ["NPM", "Keperluan surat", "Identitas pemohon"],
    processingTime: "2-4 hari kerja",
    sourceTable: "kelakuan_baik",
  },
  {
    title: "Surat Pengantar",
    slug: "surat-pengantar",
    category: "Layanan Mahasiswa",
    description:
      "Permohonan surat pengantar untuk kebutuhan administrasi akademik atau kelembagaan.",
    requirements: ["NPM", "Pengantar", "Instansi tujuan"],
    processingTime: "2-4 hari kerja",
    sourceTable: "surat_pengantar",
  },
  {
    title: "Permohonan Magang / Kerja Praktek / Tugas Akhir",
    slug: "permohonan-magang-kerja-praktek-ta",
    category: "Layanan Mahasiswa",
    description:
      "Pengajuan surat resmi fakultas untuk kebutuhan Magang Kerja, Kerja Praktek Industri, atau Magang Tugas Akhir.",
    requirements: [
      "Data diri mahasiswa",
      "Detail instansi/tempat pelaksanaan",
      "Tujuan surat",
      "Periode pelaksanaan",
      "Surat permohonan dari program studi dalam format PDF",
    ],
    processingTime: "2-4 hari kerja",
    sourceTable: "permohonan_magang",
  },
  {
    title: "Surat Izin Kegiatan",
    slug: "surat-izin-kegiatan",
    category: "Layanan Mahasiswa",
    description:
      "Layanan ini memerlukan verifikasi bukti ACC Manajer Akademik dan Kemahasiswaan sebelum form final dibuka.",
    requirements: [
      "Bukti ACC Manajer Akademik dan Kemahasiswaan",
      "Nama himpunan",
      "Nama kegiatan",
      "Tanggal kegiatan",
      "Email pengiriman SIK",
      "SPIK final",
      "No HP/WhatsApp contact person",
    ],
    processingTime: "Bertahap setelah verifikasi bukti ACC",
    sourceTable: "surat_izin_kegiatan",
  },
  {
    title: "Keterangan Lulus",
    slug: "keterangan-lulus",
    category: "Layanan Alumni",
    description:
      "Pengajuan surat keterangan lulus sementara sebelum dokumen kelulusan final tersedia.",
    requirements: ["NPM", "Program studi", "Informasi kelulusan"],
    processingTime: "2-4 hari kerja",
    sourceTable: "keterangan_lulus",
  },
  {
    title: "Penerbitan Transkrip",
    slug: "penerbitan-transkrip",
    category: "Layanan Alumni",
    description:
      "Permohonan penerbitan dokumen transkrip untuk kebutuhan akademik atau administrasi.",
    requirements: ["NPM", "Program studi", "Informasi kelulusan"],
    processingTime: "3-5 hari kerja",
    sourceTable: "transkrip",
  },
  {
    title: "Penerbitan Ijazah",
    slug: "penerbitan-ijazah",
    category: "Layanan Alumni",
    description:
      "Layanan administrasi penerbitan ijazah untuk lulusan FMIPA Unpad.",
    requirements: ["NPM", "Program studi", "Informasi kelulusan"],
    processingTime: "3-7 hari kerja",
    sourceTable: "ijazah",
  },
  {
    title: "Legalisir Ijazah & Transkrip",
    slug: "legalisir-ijazah-transkrip",
    category: "Layanan Alumni",
    description:
      "Layanan legalisir dokumen ijazah dan transkrip untuk alumni FMIPA Unpad.",
    requirements: ["NPM", "Jumlah ijazah", "Jumlah transkrip"],
    processingTime: "3-5 hari kerja",
    sourceTable: "legalisir",
  },
  {
    title: "Bebas Peminjaman",
    slug: "bebas-peminjaman",
    category: "Layanan Perpustakaan",
    description:
      "Pengurusan keterangan bebas peminjaman perpustakaan untuk kebutuhan akademik.",
    requirements: ["NPM", "Email", "No HP/WhatsApp"],
    processingTime: "1-2 hari kerja",
    sourceTable: "bebas_pinjaman",
  },
  {
    title: "Unggah Karya Ilmiah",
    slug: "unggah-karya-ilmiah",
    category: "Layanan Perpustakaan",
    description:
      "Pendampingan administrasi unggah karya ilmiah mahasiswa atau alumni.",
    requirements: ["NPM", "Keterangan karya", "Kontak aktif"],
    processingTime: "2-4 hari kerja",
    sourceTable: "unggah_karya_ilmiah",
  },
  {
    title: "Cek Plagiarisme",
    slug: "cek-plagiarisme",
    category: "Layanan Perpustakaan",
    description:
      "Layanan pemeriksaan kemiripan karya ilmiah sebagai bagian dari proses akademik.",
    requirements: ["NPM", "Keterangan dokumen", "Kontak aktif"],
    processingTime: "2-4 hari kerja",
    sourceTable: "plagiarisme",
  },
  {
    title: "Referensi",
    slug: "referensi",
    category: "Layanan Perpustakaan",
    description:
      "Bantuan referensi literatur untuk kebutuhan akademik dan penelitian.",
    requirements: ["NPM", "Topik referensi", "Kontak aktif"],
    processingTime: "2-5 hari kerja",
    sourceTable: "referensi",
  },
] satisfies PublicService[];

export function getPublicServices() {
  return publicServices;
}

const legacySlugRedirects: Record<string, string> = {
  beasiswa: "rekomendasi-beasiswa",
  "bebas-pinjaman-perpustakaan": "bebas-peminjaman",
  "pemeriksaan-plagiarisme": "cek-plagiarisme",
  "bantuan-referensi-literatur": "referensi",
  "transkrip-nilai": "penerbitan-transkrip",
  ijazah: "penerbitan-ijazah",
  "kartu-peserta-akademik-kpa": "kartu-prestasi-akademik",
  "kartu-peserta-akademik": "kartu-prestasi-akademik",
  kpa: "kartu-prestasi-akademik",
  "surat-keterangan-masih-kuliah": "keterangan-masih-kuliah",
  "surat-keterangan-lulus": "keterangan-lulus",
  "legalisir-ijazah-dan-transkrip": "legalisir-ijazah-transkrip",
};

export function getCanonicalServiceSlug(slug: string) {
  return legacySlugRedirects[slug] ?? slug;
}

export function getPublicServiceBySlug(slug: string) {
  const canonicalSlug = getCanonicalServiceSlug(slug);

  return publicServices.find((service) => service.slug === canonicalSlug);
}

export function getServiceCategories() {
  return Array.from(new Set(publicServices.map((service) => service.category)));
}
