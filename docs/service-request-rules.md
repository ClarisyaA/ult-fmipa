# Service Request Rules

## Rekomendasi Beasiswa Template

Layanan `rekomendasi-beasiswa` memakai template eksternal dinamis, bukan file `.docx` lokal dari aplikasi.

Default URL:

```text
https://docs.google.com/document/d/13D9_jd6D31Ycdyz0xwFLHzPY02eQW648tNB3wyR6cCo/edit?usp=sharing
```

Aturan:

- Tombol public membuka Google Docs/Drive di tab baru dengan `target="_blank"` dan `rel="noopener noreferrer"`.
- URL disimpan di `ult_service_links` dengan `SERVICE_SLUG = rekomendasi-beasiswa` dan `LINK_KEY = scholarship_recommendation_template`.
- Admin/staff dapat mengubah URL dari card `Pengaturan Link Layanan`.
- Public page memakai default URL jika database belum tersedia atau row link belum ada.
- Sistem tidak membuat, menyimpan, atau mengunduh template `.docx` lokal untuk fitur ini.
- Mahasiswa membuka atau menyalin template dari Google Docs, mengisi dokumen, lalu mengunggah dokumen yang sudah dilengkapi pada `Lampiran Dokumen Pendukung`.
- Upload dokumen pendukung untuk `rekomendasi-beasiswa` tetap wajib.

Validasi URL admin/staff:

- URL wajib diisi.
- URL maksimal 500 karakter.
- URL harus absolut.
- Hanya `http://` dan `https://` yang diterima.
- Skema tidak aman seperti `javascript:`, `data:`, dan `file:` ditolak.

## Layanan Surat Resmi Tanpa Template Mahasiswa

Layanan berikut tidak memiliki template DOC/DOCX yang diunduh mahasiswa:

- `ket-tunjangan-orang-tua`
- `keterangan-masih-kuliah`
- `keterangan-kelakuan-baik`
- `surat-pengantar`
- `keterangan-lulus`

Surat resmi untuk layanan tersebut dibuat dan dicetak dari sisi admin/staff melalui `Data Surat` dan PDF generator. Public student page tetap menampilkan informasi layanan, persyaratan, ringkasan, tombol `Ajukan Layanan`, dan form pengajuan, tetapi tidak menampilkan kartu template atau tombol `Unduh Template`.

Aturan lampiran:

- `ket-tunjangan-orang-tua`: dokumen pendukung opsional.
- `keterangan-masih-kuliah`: dokumen pendukung opsional.
- `keterangan-kelakuan-baik`: dokumen pendukung opsional.
- `surat-pengantar`: dokumen pendukung wajib, misalnya surat perizinan, bukti persetujuan, atau tangkapan layar persetujuan dari Kaprodi/pihak terkait.
- `keterangan-lulus`: dokumen pendukung opsional; field data kelulusan tetap diisi di form pengajuan.

Catatan: `rekomendasi-beasiswa` tetap terpisah karena memakai link template eksternal yang dapat diatur admin/staff.

## Indikator Field Form Mahasiswa

Semua form `/layanan/[slug]/ajukan` harus menampilkan indikator required/optional yang sesuai validasi backend:

- Field wajib memakai marker merah `*`.
- Field opsional memakai label `Opsional`.
- Upload wajib menampilkan `*` dan teks `Wajib`.
- Upload opsional menampilkan label `Opsional` dan helper text `Lampiran dokumen pendukung bersifat opsional.`

Field kontak umum `Email` dan `No HP/WhatsApp` wajib untuk layanan pengajuan mahasiswa yang memakai `ServiceRequestForm`. SIK memakai indikator yang sama pada tahap upload bukti ACC dan form final.

Setiap form pengajuan mahasiswa juga wajib menampilkan `Bahasa Surat *` dengan pilihan:

- `Bahasa Indonesia` tersimpan sebagai `id`.
- `Bahasa Inggris` tersimpan sebagai `en`.

Backend hanya menerima nilai `id` atau `en`. Jika nilai kosong, backend memakai default `id`; nilai lain ditolak dengan error validasi.

Email yang diisi mahasiswa disimpan pada row pengajuan, bukan hanya dipakai dari session. Helper Gmail memprioritaskan email dari row pengajuan sebelum fallback profil/alumni.

## Workflow Verifikasi SIK Admin/Staff

Layanan `surat-izin-kegiatan` memiliki workflow bertahap sebelum masuk status normal:

- Mahasiswa mengunggah bukti ACC sebagai tahap awal.
- Admin/staff memverifikasi bukti ACC dari detail atau preview pengajuan.
- Saat status bukti `pending`, UI menampilkan tombol `Setujui Verifikasi` dan `Tolak Verifikasi`, bukan pesan `Workflow belum tersedia`.
- Penolakan wajib memakai alasan maksimal 500 karakter dan alasan ditampilkan kembali di detail/preview.
- Setelah bukti disetujui, mahasiswa harus mengisi form final SIK terlebih dahulu.
- Tombol status normal dan helper pengiriman email hanya digunakan setelah form final SIK dikirim.

Route approval:

- `PATCH /api/admin/requests/surat-izin-kegiatan/[id]/approval`
- `PATCH /api/staff/requests/surat-izin-kegiatan/[id]/approval`

Payload approve cukup `{ "action": "approve" }`. Payload reject memakai `{ "action": "reject", "reason": "..." }`.

## Data Surat Dan Cetak PDF

Untuk layanan printable (`keterangan-lulus`, `ket-tunjangan-orang-tua`, `keterangan-masih-kuliah`, `keterangan-kelakuan-baik`, `permohonan-magang-kerja-praktek-ta`), editor `Data Surat` menampilkan tombol `Cetak Surat` di footer editor berdekatan dengan tombol `Simpan`.

Jika readiness belum lengkap, tombol tetap terlihat dalam keadaan tidak aktif dan helper text menampilkan `Lengkapi Data Surat sebelum mencetak PDF resmi.`
