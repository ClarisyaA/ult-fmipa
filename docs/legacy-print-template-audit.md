# Legacy Print Template Audit

Tanggal audit: 13 Juli 2026

## Ringkasan

Legacy ULT FMIPA mencetak surat resmi memakai FPDF, bukan browser print atau HTML-to-PDF. Template yang jelas ditemukan berada di `ULT-Lama/layanan_staf`:

- `masih_kuliah_cetak.php`
- `masih_kuliah_aktif_cetak.php`
- `kelakuan_baik_cetak.php`
- `keterangan_lulus_cetak.php`

Setiap file membaca `id_data` dari query string, mengambil satu record request, join ke `mahasiswa`, lalu menggambar PDF A4 portrait secara manual memakai koordinat millimeter.

Update migrasi: Phase 1 sudah mengimplementasikan generator PDF Next.js untuk pilot template `keterangan-lulus`. Detail implementasi dicatat di `docs/print-template-migration.md`.

## Pola Umum FPDF

Pola shared:

- `require 'core/init.php'`
- `$general->logged_out_protect()`
- `$id_data = $_GET['id_data']`
- `require('fpdf/fpdf.php')`
- `$pdf = new FPDF('P','mm','A4')`
- `$pdf->AddPage()`
- Header menggunakan `images/LogoUnpadWarna.jpg`.
- Garis kop surat pada Y sekitar `50` dan `51`.
- Tanggal Indonesia diformat manual oleh function `DateToIndo`.
- Output inline memakai `$pdf->Output($nama_file, 'I')`.

Output filename:

- `masih_kuliah_cetak.php`: `skmk_{NPM}.pdf`
- `masih_kuliah_aktif_cetak.php`: `skmka_{NPM}.pdf`
- `kelakuan_baik_cetak.php`: `skkb_{NPM}.pdf`
- `keterangan_lulus_cetak.php`: `skl_{NPM}.pdf`

## Header/Kop Surat

Empat template memakai kop surat yang sama secara struktur:

- Logo Unpad di kiri, koordinat kira-kira `x=14`, `y=12`, lebar `28`.
- Baris kementerian.
- Baris Universitas Padjadjaran.
- Baris Fakultas MIPA.
- Alamat Jatinangor.
- Telepon.
- Website dan email.
- Garis tebal dan tipis di bawah kop.

Catatan migrasi:

- Buat satu komponen/helper kop surat agar perubahan nama kementerian tidak harus diedit di empat template.
- Pastikan aset logo tersedia di Next.js public path atau embed sebagai buffer.

## Data TTD

Template membaca data TTD dari record layanan:

- `TTD_NO_SURAT`
- `TTD_TANGGAL`
- `TTD_TEMPAT`
- `TTD_PANGKAT_GOLONGAN`
- `TTD_JABATAN`
- `TTD_NAMA`
- `TTD_NIP`

Khusus `keterangan_lulus`:

- `TTD_TANGGAL_BERLAKU`
- `TTD_AN`

Di legacy, class layanan mengambil daftar pejabat dari `surat_ttd`, tetapi record request menyimpan snapshot TTD. Generator Next.js sebaiknya membaca snapshot `TTD_*` dari request agar PDF lama dan PDF baru tidak berubah ketika master pejabat berubah.

## Template: Masih Kuliah / Ket. Tunjangan Orang Tua

File: `ULT-Lama/layanan_staf/masih_kuliah_cetak.php`

Sumber data:

- `masih_kuliah`
- join `mahasiswa` by `NPM`

Field request:

- `NPM`
- `SEMESTER`
- `TAHUN_AKADEMIK`
- `EMAIL`
- `NO_HP`
- `NAMA_ORANG_TUA`
- `NIP_NRP`
- `PANGKAT_GOLONGAN`
- `INSTANSI`
- `TTD_*`

Field mahasiswa:

- `NAMA`
- `PROGRAM_STUDI`
- `JENJANG`

Isi surat:

- Judul: `SURAT KETERANGAN MASIH KULIAH`
- Nomor surat dari `TTD_NO_SURAT`.
- Identitas pejabat penandatangan.
- Identitas mahasiswa.
- Pernyataan mahasiswa FMIPA Unpad.
- Identitas orang tua/wali.
- Blok tanda tangan di kanan bawah.

Catatan migrasi:

- Di app publik sekarang layanan ini diberi title `Ket. Tunjangan Orang Tua`, tetapi surat legacy berjudul `SURAT KETERANGAN MASIH KULIAH`.
- Jangan hilangkan field orang tua/wali karena template bergantung pada field tersebut.

## Template: Masih Kuliah Aktif

File: `ULT-Lama/layanan_staf/masih_kuliah_aktif_cetak.php`

Sumber data:

- `masih_kuliah_aktif`
- join `mahasiswa` by `NPM`

Field request:

- `NPM`
- `SEMESTER`
- `TAHUN_AKADEMIK`
- `KEPERLUAN`
- `ALAMAT`
- `EMAIL`
- `NO_HP`
- `TTD_*`

Field mahasiswa:

- `NAMA`
- `PROGRAM_STUDI`
- `JENJANG`

Isi surat:

- Judul: `SURAT KETERANGAN MASIH AKTIF KULIAH`
- Nomor surat dari `TTD_NO_SURAT`.
- Identitas pejabat.
- Identitas mahasiswa.
- Semester, tahun ajaran, alamat.
- Pernyataan masih aktif kuliah.
- Blok tanda tangan.

Catatan migrasi:

- Template memakai `MultiCell` untuk alamat. Di generator baru, pastikan wrapping alamat tidak mendorong tanda tangan keluar halaman.
- `KEPERLUAN` tersimpan di table, tetapi template legacy yang dibaca tidak menampilkan field ini di isi surat.

## Template: Kelakuan Baik

File: `ULT-Lama/layanan_staf/kelakuan_baik_cetak.php`

Sumber data:

- `kelakuan_baik`
- join `mahasiswa` by `NPM`

Field request:

- `NPM`
- `KEPERLUAN`
- `ALAMAT`
- `TTD_*`

Field mahasiswa:

- `NAMA`
- `PROGRAM_STUDI`
- `JENJANG`

Isi surat:

- Judul: `SURAT KETERANGAN KELAKUAN BAIK`
- Nomor surat dari `TTD_NO_SURAT`.
- Identitas pejabat.
- Identitas mahasiswa.
- Alamat.
- Pernyataan berkelakuan baik dan tidak terlibat NAPZA.
- Blok tanda tangan.

Catatan migrasi:

- `KEPERLUAN` tersimpan, tetapi template legacy yang dibaca tidak menampilkan field ini di body utama.
- Teks NAPZA perlu dipertahankan persis secara makna karena ini substansi surat.

## Template: Keterangan Lulus

File: `ULT-Lama/layanan_staf/keterangan_lulus_cetak.php`

Sumber data:

- `keterangan_lulus`
- join `mahasiswa` by `NPM`

Field request:

- `NPM`
- `TEMPAT_LAHIR`
- `TGL_LAHIR`
- `TGL_LULUS`
- `IPK`
- `YUDISIUM`
- `DASAR_SURAT_NO`
- `DASAR_SURAT_PERIHAL`
- `DASAR_SURAT_TGL`
- `TTD_NO_SURAT`
- `TTD_TANGGAL`
- `TTD_TANGGAL_BERLAKU`
- `TTD_TEMPAT`
- `TTD_AN`
- `TTD_JABATAN`
- `TTD_NAMA`
- `TTD_NIP`

Field mahasiswa:

- `NAMA`
- `PROGRAM_STUDI`
- `JENJANG`

Isi surat:

- Watermark aktif memakai `images/watermark_A4.png`.
- Judul: `SURAT KETERANGAN LULUS`.
- Nomor surat dari `TTD_NO_SURAT`.
- Kalimat pembuka atas nama dekan.
- Nama, tempat/tanggal lahir, NPM.
- Pernyataan besar: `TELAH LULUS PROGRAM {JENJANG uppercase}`.
- Tanggal lulus, program studi, IPK, yudisium.
- Keterangan berlaku sampai `TTD_TANGGAL_BERLAKU`.
- Blok tanda tangan dengan `TTD_AN`, jabatan, nama, dan NIP.

Catatan migrasi:

- Ini template yang paling berbeda dari tiga template lain.
- Perlu support watermark.
- Perlu formatter uppercase jenjang.
- Perlu `TTD_TANGGAL_BERLAKU`; jangan hanya pakai tanggal surat.

## Surat Pengantar Dan Surat Lain

Class legacy `Surat_Pengantar.php` dan `Surat_Lain.php` menyimpan metadata surat:

- `PENGANTAR`
- `DITUJUKAN`
- `DASAR_SURAT_NO`
- `DASAR_SURAT_PERIHAL`
- `DASAR_SURAT_TGL`
- `TTD_NO_SURAT`
- `TTD_TANGGAL`
- `TTD_JABATAN`
- `TTD_NAMA`
- `TTD_NIP`

Namun file `surat_pengantar_cetak.php` atau `surat_lain_cetak.php` tidak ditemukan dalam scan file PHP. Jika perlu migrasi cetak untuk layanan ini, template harus dicari lebih lanjut di arsip/zip atau dirancang baru dari data field yang sudah ada.

## Library PDF Untuk Next.js

Pilihan implementasi yang cocok:

- `@react-pdf/renderer`: nyaman untuk komponen React, layout dokumen, dan route handler PDF.
- `pdf-lib`: cocok untuk koordinat manual dan mirip FPDF, tetapi templating teks lebih banyak manual.
- HTML-to-PDF/headless browser: paling visual, tetapi lebih berat untuk server dan deployment.

Rekomendasi:

- Pakai `@react-pdf/renderer` untuk maintainability.
- Buat route seperti `/admin/requests/[serviceSlug]/[id]/print` atau `/api/requests/[serviceSlug]/[id]/pdf`.
- Buat helper shared: date Indonesia, kop surat, field row, signature block, filename builder.
- Untuk presisi layout legacy, buat snapshot visual dari PDF legacy sebagai pembanding manual.

## Data Contract Minimal Untuk Generator PDF

Tipe data internal yang disarankan:

```ts
type LetterSigner = {
  place?: string | null;
  date?: Date | string | null;
  number?: string | null;
  actingFor?: string | null;
  title?: string | null;
  rank?: string | null;
  name?: string | null;
  nip?: string | null;
};

type StudentIdentity = {
  npm?: string | null;
  name?: string | null;
  programStudy?: string | null;
  level?: string | null;
};
```

Setiap template lalu menambahkan fields khususnya sendiri.

## Acceptance Checklist Migrasi Cetak

- PDF hanya bisa diakses user yang berhak.
- PDF membaca data request by `ID` dan service/table yang valid.
- Nomor surat, tanggal, pejabat, dan NIP berasal dari snapshot `TTD_*`.
- Tanggal memakai format Indonesia.
- Header, garis kop, logo, dan watermark sesuai template legacy.
- Filename mengikuti pola lama atau pola baru yang disetujui.
- Jika field wajib kosong, PDF menampilkan fallback aman atau route menolak dengan pesan jelas untuk staff.
- Teks panjang seperti alamat dan jabatan tidak keluar margin.
- Surat lama tetap bisa dicetak ulang walaupun master pejabat berubah.
