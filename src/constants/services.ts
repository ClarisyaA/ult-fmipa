export const serviceCategories = [
  "Akademik",
  "Kemahasiswaan",
  "Alumni",
  "Sarana Prasarana",
  "Perpustakaan",
] as const;

export type ServiceCategory = (typeof serviceCategories)[number];

export type ServiceItem = {
  title: string;
  slug: string;
  category: ServiceCategory;
  description: string;
  requirements: string[];
  processingTime: string;
};

export const services: ServiceItem[] = [
  {
    title: "Surat Keterangan Aktif Kuliah",
    slug: "surat-keterangan-aktif-kuliah",
    category: "Akademik",
    description:
      "Permohonan surat keterangan status aktif kuliah untuk kebutuhan administrasi mahasiswa.",
    requirements: ["NPM", "Kartu Tanda Mahasiswa", "Tujuan penggunaan surat"],
    processingTime: "1-3 hari kerja",
  },
  {
    title: "Surat Rekomendasi Beasiswa",
    slug: "surat-rekomendasi-beasiswa",
    category: "Kemahasiswaan",
    description:
      "Pengajuan surat rekomendasi untuk kebutuhan pendaftaran atau pelaporan beasiswa.",
    requirements: [
      "NPM",
      "Informasi program beasiswa",
      "Dokumen pendukung beasiswa",
    ],
    processingTime: "2-4 hari kerja",
  },
  {
    title: "Peminjaman Ruangan/Laboratorium",
    slug: "peminjaman-ruangan-laboratorium",
    category: "Sarana Prasarana",
    description:
      "Permohonan peminjaman fasilitas ruangan atau laboratorium untuk kegiatan akademik.",
    requirements: [
      "Nama kegiatan",
      "Jadwal pemakaian",
      "Penanggung jawab kegiatan",
    ],
    processingTime: "2-5 hari kerja",
  },
  {
    title: "Legalisir Ijazah dan Transkrip",
    slug: "legalisir-ijazah-transkrip",
    category: "Alumni",
    description:
      "Layanan legalisir dokumen akademik untuk alumni FMIPA Unpad.",
    requirements: [
      "Salinan ijazah",
      "Salinan transkrip",
      "Identitas alumni",
    ],
    processingTime: "3-5 hari kerja",
  },
  {
    title: "Bebas Pinjaman Perpustakaan",
    slug: "bebas-pinjaman-perpustakaan",
    category: "Perpustakaan",
    description:
      "Pengurusan keterangan bebas pinjaman perpustakaan untuk kebutuhan akademik.",
    requirements: ["NPM", "Status keanggotaan perpustakaan", "Kontak aktif"],
    processingTime: "1-2 hari kerja",
  },
  {
    title: "Unggah Karya Ilmiah",
    slug: "unggah-karya-ilmiah",
    category: "Perpustakaan",
    description:
      "Pendampingan administrasi unggah karya ilmiah mahasiswa atau alumni.",
    requirements: [
      "File karya ilmiah",
      "Metadata karya",
      "Persetujuan pembimbing",
    ],
    processingTime: "2-4 hari kerja",
  },
];
