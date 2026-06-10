import type { PublicService } from "@/types/service";

export const publicServices = [
  {
    title: "Surat Keterangan Aktif Kuliah",
    slug: "surat-keterangan-aktif-kuliah",
    category: "Akademik",
    description:
      "Permohonan surat keterangan status aktif kuliah untuk kebutuhan administrasi akademik.",
    requirements: ["NPM", "Kartu Tanda Mahasiswa", "Tujuan penggunaan surat"],
    processingTime: "1-3 hari kerja",
    sourceTable: "masih_kuliah_aktif",
  },
  {
    title: "Surat Keterangan Masih Kuliah",
    slug: "surat-keterangan-masih-kuliah",
    category: "Akademik",
    description:
      "Permohonan surat keterangan masih kuliah untuk keperluan administrasi eksternal.",
    requirements: ["NPM", "Kartu Tanda Mahasiswa", "Tujuan penggunaan surat"],
    processingTime: "1-3 hari kerja",
    sourceTable: "masih_kuliah",
  },
  {
    title: "Surat Keterangan Lulus",
    slug: "surat-keterangan-lulus",
    category: "Akademik",
    description:
      "Pengajuan surat keterangan lulus sementara sebelum dokumen kelulusan final tersedia.",
    requirements: ["NPM", "Program studi", "Bukti kelulusan"],
    processingTime: "2-4 hari kerja",
    sourceTable: "keterangan_lulus",
  },
  {
    title: "Kartu Peserta Akademik / KPA",
    slug: "kartu-peserta-akademik-kpa",
    category: "Akademik",
    description:
      "Layanan administrasi terkait Kartu Peserta Akademik untuk kebutuhan kegiatan akademik.",
    requirements: ["NPM", "Program studi", "Periode akademik"],
    processingTime: "2-4 hari kerja",
    sourceTable: "kpa",
  },
  {
    title: "Legalisir Ijazah dan Transkrip",
    slug: "legalisir-ijazah-dan-transkrip",
    category: "Alumni",
    description:
      "Layanan legalisir dokumen ijazah dan transkrip untuk alumni FMIPA Unpad.",
    requirements: ["Salinan ijazah", "Salinan transkrip", "Identitas alumni"],
    processingTime: "3-5 hari kerja",
    sourceTable: "legalisir",
  },
  {
    title: "Transkrip Nilai",
    slug: "transkrip-nilai",
    category: "Akademik",
    description:
      "Permohonan dokumen transkrip nilai untuk kebutuhan akademik atau administrasi.",
    requirements: ["NPM", "Program studi", "Tujuan penggunaan transkrip"],
    processingTime: "3-5 hari kerja",
    sourceTable: "transkrip",
  },
  {
    title: "Bebas Pinjaman Perpustakaan",
    slug: "bebas-pinjaman-perpustakaan",
    category: "Perpustakaan",
    description:
      "Pengurusan keterangan bebas pinjaman perpustakaan untuk kebutuhan akademik.",
    requirements: ["NPM", "Status keanggotaan perpustakaan", "Kontak aktif"],
    processingTime: "1-2 hari kerja",
    sourceTable: "bebas_pinjaman",
  },
  {
    title: "Pemeriksaan Plagiarisme",
    slug: "pemeriksaan-plagiarisme",
    category: "Perpustakaan",
    description:
      "Layanan pemeriksaan kemiripan karya ilmiah sebagai bagian dari proses akademik.",
    requirements: ["File karya ilmiah", "Identitas pemohon", "Program studi"],
    processingTime: "2-4 hari kerja",
    sourceTable: "plagiarisme",
  },
  {
    title: "Bantuan Referensi Literatur",
    slug: "bantuan-referensi-literatur",
    category: "Perpustakaan",
    description:
      "Bantuan pencarian atau pengelolaan referensi literatur untuk kebutuhan akademik.",
    requirements: ["Topik literatur", "Kebutuhan referensi", "Kontak aktif"],
    processingTime: "2-5 hari kerja",
    sourceTable: "referensi",
  },
  {
    title: "Unggah Karya Ilmiah",
    slug: "unggah-karya-ilmiah",
    category: "Perpustakaan",
    description:
      "Pendampingan administrasi unggah karya ilmiah mahasiswa atau alumni.",
    requirements: ["File karya ilmiah", "Metadata karya", "Persetujuan pembimbing"],
    processingTime: "2-4 hari kerja",
    sourceTable: "unggah_karya_ilmiah",
  },
  {
    title: "Yudisium",
    slug: "yudisium",
    category: "Akademik",
    description:
      "Layanan administrasi terkait pengajuan atau kelengkapan proses yudisium.",
    requirements: ["NPM", "Program studi", "Berkas persyaratan yudisium"],
    processingTime: "3-7 hari kerja",
    sourceTable: "yudisium",
  },
  {
    title: "Surat Pengantar",
    slug: "surat-pengantar",
    category: "Administrasi",
    description:
      "Permohonan surat pengantar untuk kebutuhan administrasi akademik atau kelembagaan.",
    requirements: ["Identitas pemohon", "Tujuan surat", "Instansi tujuan"],
    processingTime: "2-4 hari kerja",
    sourceTable: "surat_pengantar",
  },
  {
    title: "Beasiswa",
    slug: "beasiswa",
    category: "Kemahasiswaan",
    description:
      "Layanan administrasi dan rekomendasi pendukung pengajuan beasiswa.",
    requirements: ["NPM", "Informasi program beasiswa", "Dokumen pendukung"],
    processingTime: "2-5 hari kerja",
    sourceTable: "beasiswa",
  },
  {
    title: "Surat Keterangan Kelakuan Baik",
    slug: "surat-keterangan-kelakuan-baik",
    category: "Kemahasiswaan",
    description:
      "Permohonan surat keterangan kelakuan baik untuk kebutuhan administrasi mahasiswa.",
    requirements: ["NPM", "Identitas pemohon", "Tujuan penggunaan surat"],
    processingTime: "2-4 hari kerja",
    sourceTable: "kelakuan_baik",
  },
  {
    title: "Ijazah",
    slug: "ijazah",
    category: "Alumni",
    description:
      "Layanan administrasi terkait dokumen ijazah untuk lulusan FMIPA Unpad.",
    requirements: ["Identitas alumni", "Program studi", "Informasi kelulusan"],
    processingTime: "3-7 hari kerja",
    sourceTable: "ijazah",
  },
  {
    title: "KKS",
    slug: "kks",
    category: "Sarana Prasarana",
    description:
      "Layanan administrasi KKS sesuai kebutuhan operasional dan akademik FMIPA.",
    requirements: ["Identitas pemohon", "Unit terkait", "Kebutuhan layanan"],
    processingTime: "2-5 hari kerja",
    sourceTable: "kks",
  },
] satisfies PublicService[];

export function getPublicServices() {
  return publicServices;
}

export function getPublicServiceBySlug(slug: string) {
  return publicServices.find((service) => service.slug === slug);
}

export function getServiceCategories() {
  return Array.from(new Set(publicServices.map((service) => service.category)));
}
