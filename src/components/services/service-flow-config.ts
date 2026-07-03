/**
 * service-flow-config.ts
 * 
 * Menentukan tipe alur layanan berdasarkan slug.
 * 
 * ALUR LAYANAN:
 * 
 * 1. PERPUS (Perpustakaan FMIPA)
 *    - Hanya menampilkan data dari website perpus
 *    - Tidak ada form pengajuan
 *    - Redirect ke https://perpustakaan.fmipa.unpad.ac.id
 * 
 * 2. MAGANG-SIK (Magang & SIK)
 *    Tahapan:
 *    - Ajukan bersama Koordinator (mahasiswa + madam + koordinator)
 *    - Verifikasi & Upload Surat Izin (dari madam)
 *    - Upload ke SBAK
 *    - Diproses SBAK
 *    - Form SBAK (Eksternal) - keluar dari FMIPA
 * 
 * 3. TEMPLATE (Surat dengan template)
 *    - Tunjangan Orang Tua
 *    - Keterangan Masih Kuliah
 *    - Keterangan Kelakuan Baik
 *    - Keterangan Lulus
 * 
 * 4. PENGIRIMAN (Kirim dokumen ke mahasiswa)
 *    - Upload PDF
 *    - 2 opsi email: terdaftar atau pribadi
 *    - Kirim langsung ke email mahasiswa
 */

export type ServiceFlowType =
  | "perpus" // Perpustakaan FMIPA - tampil data dari web perpus
  | "magang-sik" // Magang & SIK - 5 tahap berjenjang
  | "template" // Surat template - Tunjangan, Kuliah, Kelakuan, Lulus
  | "pengiriman" // Kirim dokumen - upload PDF ke email mahasiswa
  | "default"; // Fallback

interface FlowRule {
  test: RegExp;
  flow: ServiceFlowType;
}

const FLOW_RULES: FlowRule[] = [
  // 1. PERPUS: layanan perpustakaan
  { test: /perpus|pustaka/, flow: "perpus" },
  
  // 2. MAGANG-SIK: magang dan SIK
  { test: /magang|^sik$|-sik(-|$)/, flow: "magang-sik" },
  
  // 3. TEMPLATE: surat-surat dengan template
  { 
    test: /tunjangan|orang-tua|masih-kuliah|aktif-kuliah|kelakuan|lulus/,
    flow: "template",
  },
  
  // 4. PENGIRIMAN: kirim dokumen ke mahasiswa
  { test: /pengiriman|kirim-dokumen/, flow: "pengiriman" },
];

export function getServiceFlowType(slug: string): ServiceFlowType {
  const match = FLOW_RULES.find((rule) => rule.test.test(slug));
  return match?.flow ?? "default";
}