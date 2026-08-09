# Legacy ULT FMIPA Audit

Tanggal audit: 13 Juli 2026

## Scope

Audit ini membaca project legacy PHP di `ULT-Lama` dan membandingkannya dengan app Next.js di `ult-fmipa`. Fokus utama:

- Inventory layanan dan workflow legacy.
- Jalur cetak/PDF surat resmi.
- Gap yang perlu dimigrasikan ke Next.js.
- Risiko teknis yang perlu dijaga saat implementasi ulang.

Tidak ada source app, schema, migration, API, UI, atau file legacy yang diubah dalam audit ini.

## Struktur Legacy

Project legacy terbagi menjadi beberapa area:

- `ULT-Lama/layanan_staf`: area staff operasional layanan. Ini area paling penting untuk workflow status dan cetak surat.
- `ULT-Lama/layanan_terpadu`: area layanan terpadu/front-office untuk input dan daftar layanan.
- `ULT-Lama/layanan_admin`: area admin, master data, reporting, import/export, dan PHPExcel.
- `ULT-Lama/layanan_sbpk`: area publik/portal lama.
- `ULT-Lama/fmipa_sbpk.sql`: dump database legacy, besar dan berisi data historis.

## Layanan Legacy Yang Terlihat

Layanan yang ditemukan dari file staff dan sudah punya padanan atau kandidat padanan di Next.js:

- Kartu Prestasi Akademik: table `kpa`.
- Kartu Kemajuan Studi: table `kks`.
- Rekomendasi Beasiswa: table `beasiswa`.
- Ket. Tunjangan Orang Tua: table `masih_kuliah`.
- Keterangan Masih Kuliah: table `masih_kuliah_aktif`.
- Keterangan Kelakuan Baik: table `kelakuan_baik`.
- Surat Pengantar: table `surat_pengantar`.
- Surat Lain: table `surat_lain`.
- Keterangan Lulus: table `keterangan_lulus`.
- Penerbitan Transkrip: table `transkrip`.
- Penerbitan Ijazah: table `ijazah`.
- Legalisir Ijazah & Transkrip: table `legalisir`.
- Bebas Peminjaman: table `bebas_pinjaman`.
- Unggah Karya Ilmiah: table `unggah_karya_ilmiah`.
- Cek Plagiarisme: table `plagiarisme`.
- Referensi: table `referensi`.

Next.js saat ini sudah punya daftar layanan publik di `src/lib/legacy-services.ts` dengan sebagian besar table di atas, ditambah layanan baru/modern:

- Permohonan Magang / Kerja Praktek / Tugas Akhir: table `permohonan_magang`.
- Surat Izin Kegiatan: table `surat_izin_kegiatan`.

## Workflow Status Legacy

Pola umum workflow legacy memakai kolom tanggal dan operator/staff langsung di table layanan:

- `PERMINTAAN_TGL`, `PERMINTAAN_ENTRY`, `PERMINTAAN_IP`.
- `PROSES_TGL`, `PROSES_STAF`.
- `SELESAI_TGL`, `SELESAI_STAF`.
- `DIAMBIL_TGL`, `DIAMBIL_OLEH` untuk layanan fisik/diambil.
- `DIKIRIM_TGL`, `DIKIRIM_OLEH` untuk layanan digital/dikirim.

Update status dilakukan lewat `ULT-Lama/layanan_staf/update_status.php`, lalu diteruskan ke method per class seperti:

- `masih_kuliah_update_proses`, `masih_kuliah_update_selesai`, `masih_kuliah_update_diambil`.
- `kelakuan_baik_update_proses`, `kelakuan_baik_update_selesai`, `kelakuan_baik_update_diambil`.
- `surat_lain_update_proses`, `surat_lain_update_selesai`, `surat_lain_update_dikirim`.

Class legacy biasanya memeriksa kolom target masih `NULL` sebelum update. Ini mencegah klik ulang menimpa timestamp yang sudah ada.

Next.js sudah meniru pola status ini di `src/lib/legacy-request-detail.ts` dan `src/lib/legacy-request-status.ts`, tetapi ada perbedaan penting:

- Next.js `updateRequestStatus` saat ini melakukan `UPDATE` langsung tanpa kondisi `... IS NULL`.
- Untuk layanan `ijazah` dan `transkrip`, status update masih ditandai unsupported karena workflow legacy-nya bukan normal 3 langkah, melainkan verifikasi-fakultas-universitas.

Rekomendasi:

- Jika ingin presisi legacy, tambahkan guard `WHERE kolom_target IS NULL` saat update status.
- Pisahkan workflow normal, digital-delivery, dan verification-workflow supaya admin tidak salah menekan status.

## Data Master Dan Relasi

Master yang dipakai oleh legacy:

- `mahasiswa`: data mahasiswa aktif, join memakai `NPM`.
- `mahasiswa_sd_2015`: arsip mahasiswa lama, sudah diakomodasi oleh Next.js detail requester.
- `surat_ttd`: master pejabat/penandatangan.
- `yudisium`: master predikat untuk keterangan lulus.
- `surat_jenis` dan `no_surat`: registry surat keluar/penomoran surat.
- `log_users`: log login/aktivitas legacy.

Catatan penting:

- Template cetak tidak langsung mengambil penandatangan dari `surat_ttd`. Data penandatangan disnapshot ke table layanan dalam kolom `TTD_*`.
- Karena data `TTD_*` berada di masing-masing request, generator PDF baru harus membaca snapshot request, bukan selalu master terbaru.

## Cetak/PDF Legacy

File cetak resmi yang ditemukan:

- `ULT-Lama/layanan_staf/masih_kuliah_cetak.php`
- `ULT-Lama/layanan_staf/masih_kuliah_aktif_cetak.php`
- `ULT-Lama/layanan_staf/kelakuan_baik_cetak.php`
- `ULT-Lama/layanan_staf/keterangan_lulus_cetak.php`
- `ULT-Lama/layanan_staf/masih_kuliah_cetak - awal.php` sebagai versi lama/awal

Semua file ini:

- Require login staff lewat `core/init.php` dan `$general->logged_out_protect()`.
- Mengambil request dari query `id_data`.
- Mengambil data request lewat class service, misalnya `get_data_masih_kuliah($id_data)`.
- Menggunakan `fpdf/fpdf.php`.
- Membuat PDF A4 portrait dengan koordinat manual.
- Output inline browser dengan filename seperti `skmk_NPM.pdf`, `skmka_NPM.pdf`, `skkb_NPM.pdf`, `skl_NPM.pdf`.

Detail lengkap template dicatat di `docs/legacy-print-template-audit.md`.

## Layanan Dengan Cetak Belum Ditemukan

Tidak ditemukan file `*_cetak.php` untuk:

- `surat_pengantar`
- `surat_lain`
- `legalisir`
- `ijazah`
- `transkrip`
- `kpa`
- `kks`
- `beasiswa`
- layanan perpustakaan (`bebas_pinjaman`, `unggah_karya_ilmiah`, `plagiarisme`, `referensi`)

Ini tidak otomatis berarti legacy tidak pernah mencetak layanan tersebut. Namun dari scan filename dan class staff, generator PDF resmi yang jelas hanya ada untuk empat layanan surat:

- Ket. Tunjangan Orang Tua / masih kuliah orang tua.
- Keterangan Masih Aktif Kuliah.
- Keterangan Kelakuan Baik.
- Keterangan Lulus.

## Gap Utama Di Next.js

Yang sudah ada:

- Daftar layanan publik dan slug canonical.
- Query list/detail pengajuan lintas table.
- Update status normal untuk banyak layanan.
- Workflow khusus SIK.
- Basic admin/staff management dari pekerjaan sebelumnya.

Yang belum terlihat/masih perlu:

- Generator PDF resmi untuk empat template legacy.
- UI staff/admin untuk mengisi atau memperbarui field `TTD_*`, dasar surat, nomor surat, dan tanggal berlaku.
- Integrasi master `surat_ttd` sebagai picker pejabat.
- Integrasi registry `no_surat`/`surat_jenis` bila penomoran otomatis ingin dipertahankan.
- Verification workflow lengkap untuk `ijazah` dan `transkrip`.
- Export/reporting setara `rekap_permintaan.php` dan PHPExcel legacy bila masih diperlukan.
- Guard update status agar tidak menimpa timestamp lama.

## Prioritas Migrasi Yang Disarankan

1. PDF generator read-only untuk empat template legacy.
   - Mulai dari `keterangan_lulus`, karena template paling berbeda dan memakai watermark serta tanggal berlaku.
   - Lanjut `masih_kuliah`, `masih_kuliah_aktif`, `kelakuan_baik` karena layout header dan TTD mirip.

2. Staff form metadata surat.
   - Tambah edit fields: `TTD_NO_SURAT`, `TTD_TANGGAL`, `TTD_TEMPAT`, `TTD_JABATAN`, `TTD_PANGKAT_GOLONGAN`, `TTD_NAMA`, `TTD_NIP`.
   - Untuk `keterangan_lulus`, tambah `TTD_TANGGAL_BERLAKU`, `TTD_AN`, `TEMPAT_LAHIR`, `TGL_LAHIR`, `TGL_LULUS`, `IPK`, `YUDISIUM`, `DASAR_SURAT_*`.

3. Master penandatangan.
   - Jadikan `surat_ttd` sebagai picker.
   - Saat request disimpan/cetak final, snapshot data pejabat ke `TTD_*`.

4. Penomoran surat.
   - Audit detail `no_surat`, `surat_jenis`, dan `surat_keluar_list.php`.
   - Putuskan apakah Next.js akan memakai nomor manual seperti legacy form atau penomoran otomatis.

5. Workflow verification untuk ijazah/transkrip.
   - Tambah aksi `verify`, `faculty`, `university`, `deliver` terpisah dari normal `process/complete/deliver`.

## Risiko Dan Catatan Teknis

- Legacy menyimpan data historis sangat lama. Jangan mengubah dump atau tabel produksi tanpa backup.
- Cetak PDF bergantung pada snapshot `TTD_*`; jika memakai master terbaru, surat lama bisa berubah isinya.
- Header kementerian di template legacy berubah mengikuti masa berlaku; template baru perlu mudah diperbarui tanpa edit banyak file.
- Beberapa file legacy memakai `die($e->getMessage())`, sehingga error DB lama bisa menampilkan detail teknis. Next.js sebaiknya tetap memakai error handling tertutup.
- Banyak layanan memakai NPM sebagai kunci relasi, tetapi sebagian alumni bisa berada di table arsip/alumni. Query requester baru perlu tetap fallback seperti yang sudah mulai dilakukan.

## File Legacy Yang Menjadi Rujukan Audit

- `ULT-Lama/layanan_staf/update_status.php`
- `ULT-Lama/layanan_staf/core/classes/Masih_Kuliah.php`
- `ULT-Lama/layanan_staf/core/classes/Masih_Kuliah_Aktif.php`
- `ULT-Lama/layanan_staf/core/classes/Kelakuan_Baik.php`
- `ULT-Lama/layanan_staf/core/classes/Keterangan_Lulus.php`
- `ULT-Lama/layanan_staf/core/classes/Surat_Pengantar.php`
- `ULT-Lama/layanan_staf/core/classes/Surat_Lain.php`
- `ULT-Lama/layanan_staf/*_cetak.php`
- `ult-fmipa/src/lib/legacy-services.ts`
- `ult-fmipa/src/lib/legacy-request-detail.ts`
- `ult-fmipa/src/lib/legacy-request-status.ts`
- `ult-fmipa/prisma/schema.prisma`
