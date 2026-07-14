# Level 1 Email Delivery Helper

Tanggal: 14 Juli 2026

Fitur ini hanya menyiapkan draft Gmail untuk admin/staff setelah pengajuan selesai diproses. Sistem tidak mengirim email otomatis, tidak memakai SMTP, tidak memakai Gmail API, tidak memakai `mailto:`, dan tidak melampirkan file otomatis.

Fitur ini menggunakan Gmail compose URL. Sistem hanya mengisi email tujuan, subjek, dan isi pesan. File hasil layanan tetap harus dilampirkan manual oleh admin/staff.

## Perilaku

- Admin/staff dapat membuka kartu `Pengiriman Email` dari halaman detail pengajuan atau preview daftar.
- Setelah aksi status `Selesai` berhasil, modal `Pengajuan selesai. Siapkan email pengiriman melalui Gmail?` ditampilkan.
- Draft Gmail berisi email tujuan bila tersedia, subject, dan body.
- Jika email tujuan tidak tersedia, UI menampilkan peringatan agar admin/staff mengisi alamat email manual di Gmail.
- Semua layanan memakai instruksi lampiran manual.
- Layanan printable hanya mendapat tombol bantu `Buka PDF Surat`.

## API

Endpoint:

```http
GET /api/requests/{serviceSlug}/{id}/email-draft
```

Akses:

- `admin` dan `staff`: diizinkan
- unauthenticated: `401`
- role lain: `403`
- ID tidak valid: `400`
- pengajuan tidak ditemukan: `404`
- database tidak tersedia: structured `503` dari `error-utils.ts`

Contoh response:

```json
{
  "success": true,
  "data": {
    "recipientEmail": "student@example.com",
    "hasRecipientEmail": true,
    "subject": "Penyelesaian Pengajuan Keterangan Lulus - ULT FMIPA Unpad",
    "body": "Yth. Pemohon,\n\nPengajuan layanan Keterangan Lulus Anda telah selesai diproses.\n\nSilakan cek file hasil layanan yang akan dilampirkan pada email ini.\n\nTerima kasih.\n\nULT FMIPA Universitas Padjadjaran",
    "gmailComposeUrl": "https://mail.google.com/mail/?view=cm&fs=1...",
    "serviceTitle": "Keterangan Lulus",
    "supportsGeneratedPdf": true,
    "pdfUrl": "/api/requests/keterangan-lulus/123/pdf",
    "attachmentInstruction": "Lampirkan file hasil layanan secara manual sebelum mengirim email."
  }
}
```

## Printable Services

Layanan printable saat ini:

- `keterangan-lulus`
- `ket-tunjangan-orang-tua`
- `keterangan-masih-kuliah`
- `keterangan-kelakuan-baik`
- `permohonan-magang-kerja-praktek-ta`

Untuk layanan ini, helper menyediakan `pdfUrl`. Tombol PDF hanya membantu admin/staff membuka atau mengunduh PDF, lalu melampirkannya manual di Gmail. Jika route PDF mengembalikan `422` karena Data Surat belum lengkap, perilaku PDF route tidak diubah.

## Future Phase

Pengiriman otomatis atau lampiran otomatis baru bisa dipertimbangkan pada fase berikutnya dengan integrasi SMTP/Gmail API, konfigurasi credential, audit tambahan, retry handling, dan validasi attachment.
