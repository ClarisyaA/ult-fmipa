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
 * 2. MAGANG-SIK (legacy)
 *    Alur lama untuk layanan eksternal SIK. Layanan Magang/KP/TA
 *    memakai form internal di halaman /ajukan, bukan stepper detail layanan.
 * 
 * 3. TEMPLATE (Student-side external template)
 *    - Rekomendasi Beasiswa
 * 
 * 4. PENGIRIMAN (Kirim dokumen ke mahasiswa)
 *    - Upload PDF
 *    - 2 opsi email: terdaftar atau pribadi
 *    - Kirim langsung ke email mahasiswa
 */

export type ServiceFlowType =
  | "perpus" // Perpustakaan FMIPA - tampil data dari web perpus
  | "magang-sik" // Legacy SIK - 5 tahap berjenjang
  | "template" // Student-side external template - Rekomendasi Beasiswa
  | "pengiriman" // Kirim dokumen - upload PDF ke email mahasiswa
  | "default"; // Fallback

interface FlowRule {
  test: RegExp;
  flow: ServiceFlowType;
}

const FLOW_RULES: FlowRule[] = [
  // 1. PERPUS: layanan perpustakaan
  { test: /perpus|pustaka/, flow: "perpus" },
  
  // 2. MAGANG-SIK: hanya slug SIK legacy, bukan layanan Magang/KP/TA internal
  { test: /^sik$|-sik(-|$)/, flow: "magang-sik" },
  
  // 3. TEMPLATE: hanya layanan yang memang punya template mahasiswa eksternal.
  { test: /^rekomendasi-beasiswa$/, flow: "template" },
  
  // 4. PENGIRIMAN: kirim dokumen ke mahasiswa
  { test: /pengiriman|kirim-dokumen/, flow: "pengiriman" },
];

export function getServiceFlowType(slug: string): ServiceFlowType {
  const match = FLOW_RULES.find((rule) => rule.test.test(slug));
  return match?.flow ?? "default";
}
