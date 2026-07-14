# Frontend API Handout

Dokumen ini adalah pegangan frontend untuk integrasi API ULT FMIPA Unpad. Fokusnya:
route API, role akses, request/response, upload, error handling, dan pola UI. Untuk setup
project, database, migration, dan troubleshooting umum, tetap baca `README.md` dan dokumen di
folder `docs/`.

Base URL lokal:

```text
http://localhost:3000
```

Di dalam aplikasi Next.js ini, gunakan relative URL:

```ts
fetch("/api/services");
```

## Konvensi API

Sebagian endpoint baru memakai pola:

```json
{
  "success": true,
  "message": "Berhasil.",
  "data": {}
}
```

Error standar dari helper server:

```json
{
  "success": false,
  "error": {
    "code": "DATABASE_UNAVAILABLE",
    "message": "Koneksi database sedang tidak tersedia. Coba lagi beberapa saat lagi."
  }
}
```

Beberapa endpoint lama masih mengembalikan:

```json
{ "error": "Pesan error" }
```

Jadi helper FE harus mendukung dua bentuk error tersebut.

Status yang umum:

| Status | Arti FE |
| --- | --- |
| `200` | Berhasil |
| `201` | Data dibuat |
| `400` | Validasi gagal atau payload salah |
| `401` | Belum login |
| `403` | Role tidak sesuai |
| `404` | Data/route tidak ditemukan |
| `409` | Konflik, biasanya butuh konfirmasi ulang |
| `422` | Data belum lengkap untuk diproses/cetak |
| `500` | Error server tidak terduga |
| `503` | Database tidak tersedia |

Pesan DB down standar:

```text
Koneksi database sedang tidak tersedia. Coba lagi beberapa saat lagi.
```

## Auth Dan Role

App memakai NextAuth session. FE biasanya tidak mengirim token manual karena cookie/session
same-origin ikut terkirim oleh browser.

| Role | Akses API |
| --- | --- |
| Public | API publik tanpa login |
| Student/Mahasiswa | API `/api/student/...` dan pengajuan layanan |
| Staff | API `/api/staff/...` dan sebagian API cetak surat |
| Admin | API `/api/admin/...`, master data, dan sebagian API cetak surat |

Aturan penting:

- Student identity memakai session. FE tidak perlu dan tidak boleh mengandalkan input NPM untuk identity.
- Staff tidak boleh menghapus pengajuan layanan.
- Admin dapat menghapus pengajuan layanan dan mengelola master/system data.
- Endpoint PDF dan letter metadata hanya untuk admin/staff.
- Tangani `401` dengan ajakan login, `403` dengan pesan tidak punya akses.

## Helper Fetch

Gunakan helper JSON yang bisa membaca dua bentuk error:

```ts
export async function fetchJson<T>(
  url: string,
  init: RequestInit = {},
): Promise<T> {
  const isFormData = init.body instanceof FormData;
  const response = await fetch(url, {
    cache: "no-store",
    credentials: "same-origin",
    ...init,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(init.headers ?? {}),
    },
  });

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await response.json().catch(() => null)
    : await response.text().catch(() => null);

  if (!response.ok) {
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      typeof payload.error === "object" &&
      payload.error !== null &&
      "message" in payload.error
        ? String(payload.error.message)
        : typeof payload === "object" &&
            payload !== null &&
            "error" in payload
          ? String(payload.error)
          : "Terjadi kesalahan. Coba lagi beberapa saat lagi.";

    throw new Error(message);
  }

  return payload as T;
}
```

Untuk upload, jangan set `Content-Type` manual:

```ts
const formData = new FormData();
formData.append("title", title);
formData.append("image", file);

await fetchJson("/api/admin/home/activities", {
  method: "POST",
  body: formData,
});
```

Untuk PDF, CSV, attachment, dan gambar, jangan pakai `fetchJson` karena response bukan JSON.

## Public Homepage API

### `GET /api/home/activities`

Dipakai oleh `src/components/home/home-landing-sections.tsx` untuk section Kegiatan Mahasiswa.
Auth public. Response JSON:

```ts
type PublicHomeActivity = {
  id: string;
  title: string;
  eyebrow: string | null;
  description: string;
  image: string | null;
  imageAlt: string;
  imageFit: "cover" | "contain";
  sortOrder: number;
};

type Response = { data: PublicHomeActivity[] };
```

Behavior:

- Hanya item aktif.
- Urut `sortOrder ASC`, lalu data terbaru.
- Jika tabel belum ada atau DB read gagal ringan, backend mengembalikan `data: []`.
- FE homepage boleh fallback ke data statis jika fetch gagal.

### `GET /api/home/activities/images/[id]`

Response adalah gambar, bukan JSON. Pakai langsung sebagai `src`.

```tsx
<img
  src={`/api/home/activities/images/${activity.id}`}
  alt={activity.imageAlt || activity.title}
  className={activity.imageFit === "contain" ? "object-contain" : "object-cover"}
/>
```

Catatan:

- Public hanya bisa melihat gambar activity aktif.
- Admin/staff bisa melihat gambar activity nonaktif lewat session.
- SVG dikirim dengan `Content-Security-Policy` dan `X-Content-Type-Options: nosniff`.
- Storage path mentah tidak diekspos.

### `GET /api/home/links`

Dipakai CTA Kalender Akademik di homepage. Auth public. Response:

```ts
{
  data: {
    academicCalendar: {
      id: string;
      linkKey: "academic_calendar";
      label: "Kalender Akademik";
      url: string;
      isActive: boolean;
      createdAt: string;
      updatedAt: string | null;
      updatedBy: string | null;
    } | null;
  };
}
```

Default URL jika DB/tabel belum tersedia:

```text
https://www.unpad.ac.id/pengumuman/kalender-kegiatan-akademik-universitas-padjadjaran-tahun-akademik-2026-2027/
```

Render link:

```tsx
<a href={academicCalendarUrl} target="_blank" rel="noopener noreferrer">
  Kalender Akademik
</a>
```

## Homepage CMS API

Dipakai halaman:

- `/admin/beranda/kegiatan`
- `/admin/beranda/kegiatan/tambah`
- `/admin/beranda/kegiatan/[id]/edit`
- `/staff/beranda/kegiatan`
- `/staff/beranda/kegiatan/tambah`
- `/staff/beranda/kegiatan/[id]/edit`

Routes admin dan staff memiliki behavior sama, role sesuai prefix.

| Method | Endpoint | Auth | Kegunaan |
| --- | --- | --- | --- |
| `GET` | `/api/admin/home/activities` | Admin | List semua activity |
| `POST` | `/api/admin/home/activities` | Admin | Buat activity |
| `GET` | `/api/admin/home/activities/[id]` | Admin | Detail activity |
| `PATCH` | `/api/admin/home/activities/[id]` | Admin | Update activity |
| `DELETE` | `/api/admin/home/activities/[id]` | Admin | Hapus activity |
| `GET` | `/api/staff/home/activities` | Staff | List semua activity |
| `POST` | `/api/staff/home/activities` | Staff | Buat activity |
| `GET` | `/api/staff/home/activities/[id]` | Staff | Detail activity |
| `PATCH` | `/api/staff/home/activities/[id]` | Staff | Update activity |
| `DELETE` | `/api/staff/home/activities/[id]` | Staff | Hapus activity |

FormData/JSON fields:

```text
title
eyebrow
description
imageAlt
imageFit       // cover | contain
isActive       // true | false
sortOrder
image          // File, optional multipart only
```

Upload rule:

- Max 2 MB.
- WEBP, PNG, JPG/JPEG, SVG.
- SVG divalidasi aman: script, event handler, `javascript:`, `foreignObject`, dan remote reference ditolak.
- Field selain daftar di atas ditolak.
- `imageFit = cover` berarti Penuhi Card.
- `imageFit = contain` berarti Tampilkan Utuh.

Academic calendar CMS:

| Method | Endpoint | Auth | Kegunaan |
| --- | --- | --- | --- |
| `GET` | `/api/admin/home/links` | Admin | Ambil state link beranda |
| `PATCH` | `/api/admin/home/links/academic-calendar` | Admin | Update URL Kalender Akademik |
| `GET` | `/api/staff/home/links` | Staff | Ambil state link beranda |
| `PATCH` | `/api/staff/home/links/academic-calendar` | Staff | Update URL Kalender Akademik |

Payload:

```json
{
  "url": "https://example.com/kalender-akademik",
  "isActive": true
}
```

URL harus absolut dan hanya `http://` atau `https://`. Skema seperti `javascript:`,
`data:`, dan `file:` ditolak.

## Services Dan Pengajuan

Public:

| Method | Endpoint | Auth | Used by |
| --- | --- | --- | --- |
| `GET` | `/api/services` | Public | `/layanan` |
| `GET` | `/api/services/[slug]` | Public | `/layanan/[slug]`, `/layanan/[slug]/ajukan` |
| `GET` | `/api/services/[slug]/links` | Public | Link template layanan |
| `POST` | `/api/services/[slug]/requests` | Student | Form pengajuan |

Slug layanan yang tersedia:

```text
kartu-prestasi-akademik
kartu-kemajuan-studi
rekomendasi-beasiswa
ket-tunjangan-orang-tua
keterangan-masih-kuliah
keterangan-kelakuan-baik
surat-pengantar
keterangan-lulus
penerbitan-transkrip
penerbitan-ijazah
legalisir-ijazah-transkrip
bebas-peminjaman
unggah-karya-ilmiah
cek-plagiarisme
referensi
permohonan-magang-kerja-praktek-ta
surat-izin-kegiatan
```

`POST /api/services/[slug]/requests` menerima JSON atau `multipart/form-data`.
Gunakan `FormData` jika ada lampiran.

Untuk `rekomendasi-beasiswa`, template Surat Rekomendasi Beasiswa memakai link eksternal dinamis dari database, bukan file `.docx` lokal. Default URL:

```text
https://docs.google.com/document/d/13D9_jd6D31Ycdyz0xwFLHzPY02eQW648tNB3wyR6cCo/edit?usp=sharing
```

Admin/staff dapat mengubah URL melalui card `Pengaturan Link Layanan`. Public page memakai fallback default jika database/link belum tersedia. Mahasiswa harus membuka atau menyalin template dari Google Docs, mengisi dokumen, lalu mengunggah dokumen yang sudah dilengkapi pada `Lampiran Dokumen Pendukung`; upload tetap wajib.

Layanan `ket-tunjangan-orang-tua`, `keterangan-masih-kuliah`, `keterangan-kelakuan-baik`, `surat-pengantar`, dan `keterangan-lulus` tidak memiliki template DOC/DOCX yang diunduh mahasiswa. Surat resmi dibuat/cetak dari sisi admin/staff melalui `Data Surat` dan PDF generator. Public student page untuk layanan tersebut tidak menampilkan kartu template atau tombol `Unduh Template`.

Aturan lampiran target:

- `ket-tunjangan-orang-tua`: dokumen pendukung opsional.
- `keterangan-masih-kuliah`: dokumen pendukung opsional.
- `keterangan-kelakuan-baik`: dokumen pendukung opsional.
- `surat-pengantar`: dokumen pendukung wajib; helper text menyebut contoh surat perizinan, bukti persetujuan, atau tangkapan layar persetujuan dari Kaprodi/pihak terkait.
- `keterangan-lulus`: dokumen pendukung opsional; field data kelulusan, Yudisium dropdown, dan validasi IPK/Yudisium tetap berlaku.

Field umum yang dibaca:

```text
email
phone
description
scholarshipName
semester
tahunAkademik
namaOrangTua
nipNrp
pangkatGolongan
instansi
pengantar
ditujukan
dasarSuratNo
dasarSuratPerihal
dasarSuratTgl
tempatLahir
tanggalLahir
tanggalLulus / tglLulus
ipk
yudisium
jumlahTranskrip
jumlahIjazah
jumlahTranslet
programStudi
jenisPermohonan
kontakPerson
tempatPelaksanaan
tujuanSurat
alamatSurat
kecamatanKabupaten
kotaKabupaten
provinsi
tanggalMulai
tanggalSelesai
attachments
```

Success umum:

```json
{
  "data": {
    "id": "123",
    "requestId": "123",
    "serviceSlug": "kartu-prestasi-akademik",
    "serviceTitle": "Kartu Prestasi Akademik",
    "status": "pending",
    "attachmentCount": 1
  },
  "message": "Pengajuan layanan berhasil dikirim."
}
```

Upload rule default lampiran layanan:

- Key FormData: `attachments`.
- Max 3 file.
- Max 5 MB per file.
- PDF, JPG/JPEG, PNG.

Rule khusus:

| Layanan | Rule |
| --- | --- |
| `permohonan-magang-kerja-praktek-ta` | Minimal 1 file, max 5 file PDF, max 10 MB per file |
| `surat-izin-kegiatan` tahap bukti ACC | Minimal 1 file, max 5 file PDF/JPG/PNG, max 10 MB |
| `surat-izin-kegiatan` tahap final SPIK | Minimal 1 file, max 5 file PDF/JPG/PNG, max 10 MB |

Contoh submit:

```ts
const formData = new FormData();
formData.append("description", description);
files.forEach((file) => formData.append("attachments", file));

const result = await fetchJson<{
  data: { requestId: string; attachmentCount: number };
  message: string;
}>(`/api/services/${serviceSlug}/requests`, {
  method: "POST",
  body: formData,
});
```

## SIK Specific Flow

Routes:

| Method | Endpoint | Auth | Kegunaan |
| --- | --- | --- | --- |
| `POST` | `/api/services/surat-izin-kegiatan/requests` | Student | Upload bukti ACC Manajer |
| `PATCH` | `/api/admin/requests/surat-izin-kegiatan/[id]/approval` | Admin | Approve/reject bukti ACC |
| `PATCH` | `/api/staff/requests/surat-izin-kegiatan/[id]/approval` | Staff | Approve/reject bukti ACC |
| `PATCH` | `/api/services/surat-izin-kegiatan/requests/[id]/final` | Student | Submit form final + SPIK final |

Alur:

1. Mahasiswa upload bukti ACC.
2. Status bukti menjadi pending verification.
3. Admin/staff membuka detail atau preview pengajuan dan memakai panel `Verifikasi Surat Izin Kegiatan`.
4. Jika bukti sesuai, klik `Setujui Verifikasi`; jika tidak sesuai, isi alasan lalu klik `Tolak Verifikasi`.
5. Jika approved, mahasiswa submit form final.
6. Setelah final terkirim, pengajuan masuk workflow status normal.

Catatan UI admin/staff:

- Jangan tampilkan pesan `Workflow belum tersedia` untuk tahap SIK.
- Saat `APPROVAL_STATUS = pending`, tampilkan tombol `Setujui Verifikasi` dan `Tolak Verifikasi`.
- Saat `APPROVAL_STATUS = rejected`, tampilkan status `Ditolak` dan alasan penolakan.
- Saat `APPROVAL_STATUS = verified` tetapi form final belum dikirim, tampilkan status `Terverifikasi` dan pesan `Menunggu mahasiswa melengkapi form final SIK`.
- Tombol status normal dan email helper baru tersedia setelah form final SIK dikirim mahasiswa.

Approval payload:

```json
{ "action": "approve" }
```

Reject payload:

```json
{
  "action": "reject",
  "reason": "Bukti belum sesuai."
}
```

Final FormData:

```text
namaHimpunan
namaKegiatan
tanggalKegiatan
emailPengiriman
noHpWa
attachments       // SPIK final, minimal 1 file
```

Error penting:

- `400` jika action tidak valid atau alasan penolakan lebih dari 500 karakter.
- `409` jika bukti belum verified, final sudah pernah dikirim, bukti pending/verified belum selesai, atau bukti ACC tidak lagi dalam status pending saat diverifikasi.
- `503` mengembalikan `success: false` dengan `error.code = DATABASE_UNAVAILABLE`.
- Status update normal SIK akan ditolak jika form final belum dikirim.

## Student Request Dan Survey

Student routes:

| Method | Endpoint | Auth | Used by |
| --- | --- | --- | --- |
| `GET` | `/api/student/requests` | Student | `/mahasiswa/riwayat` |
| `GET` | `/api/student/requests/[serviceSlug]/[id]` | Student | Detail riwayat |
| `GET` | `/api/student/requests/[serviceSlug]/[id]/survey` | Student | Survey di detail |
| `POST` | `/api/student/requests/[serviceSlug]/[id]/survey` | Student | Submit/update survey detail |
| `GET` | `/api/student/surveys/requests` | Student | `/survei` |
| `GET` | `/api/student/surveys/pending` | Student | Helper pending survey |
| `POST` | `/api/student/surveys` | Student | Submit/update survey |

Query list request:

```text
page=1
limit=10
service={SERVICE_SLUG}
status=pending | inProgress | completed | delivered
```

Survey payload:

```json
{
  "serviceSlug": "kartu-prestasi-akademik",
  "requestId": "123",
  "overallRating": 5,
  "ratingTangibility": 5,
  "ratingReliability": 5,
  "ratingResponsiveness": 4,
  "ratingAssurance": 5,
  "ratingEmpathy": 5,
  "comment": "Pelayanan cepat."
}
```

Rules:

- `overallRating` wajib.
- Rating 1 sampai 5.
- Komentar maksimal 500 karakter.
- Survey hanya untuk pengajuan milik mahasiswa yang sudah `completed` atau `delivered`.

## Admin/Staff Request API

| Method | Endpoint | Auth | Used by |
| --- | --- | --- | --- |
| `GET` | `/api/admin/summary` | Admin | Dashboard admin |
| `GET` | `/api/staff/summary` | Staff | Dashboard staff |
| `GET` | `/api/admin/notifications/requests` | Admin | Badge/notifikasi |
| `GET` | `/api/staff/notifications/requests` | Staff | Badge/notifikasi |
| `GET` | `/api/admin/requests` | Admin | List pengajuan |
| `GET` | `/api/staff/requests` | Staff | List pengajuan |
| `GET` | `/api/admin/requests/[serviceSlug]/[id]` | Admin | Detail pengajuan |
| `GET` | `/api/staff/requests/[serviceSlug]/[id]` | Staff | Detail pengajuan |
| `PATCH` | `/api/admin/requests/[serviceSlug]/[id]/status` | Admin | Update status |
| `PATCH` | `/api/staff/requests/[serviceSlug]/[id]/status` | Staff | Update status |
| `DELETE` | `/api/admin/requests/[serviceSlug]/[id]` | Admin | Hapus pengajuan |
| `DELETE` | `/api/staff/requests/[serviceSlug]/[id]` | Staff | Route ada, selalu 403 |
| `GET` | `/api/admin/requests/export` | Admin | CSV export |

Query list/export:

```text
service={SERVICE_SLUG}
category=mahasiswa | akademik-alumni | perpustakaan
status=pending | inProgress | completed | delivered
sort=newest | oldest
page=1
limit=10
scope=filtered | all       // export
```

Status payload:

```json
{
  "action": "process",
  "staffName": "Admin ULT"
}
```

Action yang didukung:

```text
process
complete
deliver
cancelProcess
cancelComplete
cancelDeliver
```

Status UI:

| API status | Label |
| --- | --- |
| `pending` | Menunggu |
| `inProgress` | Diproses |
| `completed` | Selesai |
| `delivered` | Diambil/Dikirim |

CSV export:

```ts
const response = await fetch("/api/admin/requests/export?scope=all", {
  credentials: "same-origin",
});
const blob = await response.blob();
const url = URL.createObjectURL(blob);
const link = document.createElement("a");
link.href = url;
link.download = "pengajuan.csv";
link.click();
URL.revokeObjectURL(url);
```

## Attachment, PDF, Dan Surat Resmi

### `GET /api/attachments/[id]`

Auth admin/staff atau student pemilik pengajuan. Response file/blob, bukan JSON.
Gunakan link/tab baru:

```tsx
<a href={`/api/attachments/${attachment.id}`} target="_blank" rel="noopener noreferrer">
  Lihat lampiran
</a>
```

### `GET /api/requests/[serviceSlug]/[id]/pdf`

Auth admin/staff. Response `application/pdf`, inline.

Supported slug:

```text
keterangan-lulus
ket-tunjangan-orang-tua
keterangan-masih-kuliah
keterangan-kelakuan-baik
```

Status penting:

- `404` jika template/service tidak didukung atau pengajuan tidak ada.
- `400` jika ID tidak valid.
- `422` jika data surat belum lengkap.
- `503` jika DB tidak tersedia.

```tsx
<a
  href={`/api/requests/${serviceSlug}/${id}/pdf`}
  target="_blank"
  rel="noopener noreferrer"
>
  Cetak Surat
</a>
```

### Letter metadata

| Method | Endpoint | Auth |
| --- | --- | --- |
| `GET` | `/api/requests/[serviceSlug]/[id]/letter-metadata` | Admin/Staff |
| `PATCH` | `/api/requests/[serviceSlug]/[id]/letter-metadata` | Admin/Staff |

Response sukses:

```ts
{
  success: true;
  data: {
    serviceSlug: string;
    requestId: string;
    readiness: { isReady: boolean; message: string } | null;
    duplicateNumber: {
      hasDuplicateNumber: boolean;
      duplicateCount: number;
      duplicateSamples: Array<{ serviceSlug: string; id: string; npm?: string }>;
    };
    signerPickerAvailable: boolean;
    signerPickerMessage: string | null;
    signers: Array<{ id: number; name: string; nip: string; title: string; actingFor: string; rank: string }>;
    commonFields: LetterMetadataField[];
    serviceFields: LetterMetadataField[];
  };
}
```

Common fields:

```text
TTD_NO_SURAT
TTD_TANGGAL
TTD_TEMPAT
TTD_PANGKAT_GOLONGAN
TTD_JABATAN
TTD_NAMA
TTD_NIP
```

Service-specific fields:

```text
// keterangan-lulus
TTD_TANGGAL_BERLAKU
TTD_AN
TEMPAT_LAHIR
TGL_LAHIR
TGL_LULUS
IPK
YUDISIUM
DASAR_SURAT_NO
DASAR_SURAT_PERIHAL
DASAR_SURAT_TGL

// ket-tunjangan-orang-tua
SEMESTER
TAHUN_AKADEMIK
NAMA_ORANG_TUA
NIP_NRP
PANGKAT_GOLONGAN
INSTANSI

// keterangan-masih-kuliah
SEMESTER
TAHUN_AKADEMIK
ALAMAT
KEPERLUAN

// keterangan-kelakuan-baik
ALAMAT
KEPERLUAN
```

Jika PATCH mengubah nomor surat lama, API bisa mengembalikan `409`. Ulangi dengan:

```json
{ "TTD_NO_SURAT": "123/UN6.X/PK.01/2026", "confirmNumberOverwrite": true }
```

## Informasi API

Public:

| Method | Endpoint | Auth | Used by |
| --- | --- | --- | --- |
| `GET` | `/api/information` | Public | `/informasi`, `/informasi/[slug]` data listing |
| `GET` | `/api/information/images/[imageId]` | Public/Admin/Staff | Image src |

Public visibility rule: `published`, aktif, tidak archived, dan masuk jadwal tampil.

Admin/staff:

| Method | Endpoint | Auth |
| --- | --- |
| `GET` | `/api/admin/information` | Admin |
| `POST` | `/api/admin/information` | Admin |
| `GET` | `/api/admin/information/[id]` | Admin |
| `PATCH` | `/api/admin/information/[id]` | Admin |
| `DELETE` | `/api/admin/information/[id]` | Admin |
| `POST` | `/api/admin/information/[id]/images` | Admin |
| `PATCH` | `/api/admin/information/[id]/images/[imageId]` | Admin |
| `DELETE` | `/api/admin/information/[id]/images/[imageId]` | Admin |
| `POST` | `/api/admin/information/[id]/images/[imageId]/cover` | Admin |
| `GET` | `/api/staff/information` | Staff |
| `POST` | `/api/staff/information` | Staff |
| `GET` | `/api/staff/information/[id]` | Staff |
| `PATCH` | `/api/staff/information/[id]` | Staff |
| `DELETE` | `/api/staff/information/[id]` | Staff |
| `POST` | `/api/staff/information/[id]/images` | Staff |
| `PATCH` | `/api/staff/information/[id]/images/[imageId]` | Staff |
| `DELETE` | `/api/staff/information/[id]/images/[imageId]` | Staff |
| `POST` | `/api/staff/information/[id]/images/[imageId]/cover` | Staff |

FormData fields:

```text
title
category
summary
content
status          // draft | published | archived
featured
isActive
displayStartAt
displayEndAt
images          // max 5 file
imageFits       // cover | contain, sejajar urutan images
```

Upload rule informasi:

- Max 5 gambar per post.
- Max 2 MB per gambar.
- WEBP, PNG, JPG/JPEG, SVG.
- SVG aman saja yang diterima.
- `imageFit` default `cover`; pakai `contain` untuk logo/poster agar tidak crop.

PATCH image metadata:

```json
{
  "altText": "Deskripsi gambar",
  "imageFit": "contain"
}
```

## Profile CMS API

Dipakai halaman publik `/profil`. Jika API/DB tidak tersedia, public UI memakai fallback statis.

Public:

| Method | Endpoint | Auth |
| --- | --- | --- |
| `GET` | `/api/profile/organization` | Public |
| `GET` | `/api/profile/location` | Public |
| `GET` | `/api/profile/images/[type]/[id]` | Public/Admin/Staff |

`type` gambar: `organization` atau `location`.

Organization node:

```ts
type ProfileOrganizationNode = {
  id: string;
  parentId: string | null;
  name: string;
  positionTitle: string;
  roleLabel: string | null;
  photoUrl: string | null;
  photoAlt: string | null;
  colorVariant: "emerald" | "red" | "amber";
  isActive: boolean;
  sortOrder: number;
  children: ProfileOrganizationNode[];
};
```

Location:

```ts
type ProfileLocationSettings = {
  eyebrow: string | null;
  title: string;
  description: string;
  directionLabel: string;
  directionUrl: string | null;
  email: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
  imageFit: "cover" | "contain";
  hours: Array<{ id: string; dayLabel: string; timeLabel: string; sortOrder: number; isActive: boolean }>;
};
```

Admin/staff organization:

| Method | Endpoint | Auth |
| --- | --- | --- |
| `GET` | `/api/admin/profile/organization` | Admin |
| `POST` | `/api/admin/profile/organization` | Admin |
| `GET` | `/api/admin/profile/organization/[id]` | Admin |
| `PATCH` | `/api/admin/profile/organization/[id]` | Admin |
| `DELETE` | `/api/admin/profile/organization/[id]` | Admin |
| `GET` | `/api/staff/profile/organization` | Staff |
| `POST` | `/api/staff/profile/organization` | Staff |
| `GET` | `/api/staff/profile/organization/[id]` | Staff |
| `PATCH` | `/api/staff/profile/organization/[id]` | Staff |
| `DELETE` | `/api/staff/profile/organization/[id]` | Staff |

Organization FormData/JSON fields:

```text
parentId        // id, root, none, atau kosong
name
positionTitle
roleLabel
photoAlt
colorVariant    // emerald | red | amber
isActive
sortOrder
image
```

Delete node ditolak `409` jika masih punya bawahan.

Admin/staff location:

| Method | Endpoint | Auth |
| --- | --- | --- |
| `GET` | `/api/admin/profile/location` | Admin |
| `PATCH` | `/api/admin/profile/location` | Admin |
| `POST` | `/api/admin/profile/location/hours` | Admin |
| `PATCH` | `/api/admin/profile/location/hours/[id]` | Admin |
| `DELETE` | `/api/admin/profile/location/hours/[id]` | Admin |
| `GET` | `/api/staff/profile/location` | Staff |
| `PATCH` | `/api/staff/profile/location` | Staff |
| `POST` | `/api/staff/profile/location/hours` | Staff |
| `PATCH` | `/api/staff/profile/location/hours/[id]` | Staff |
| `DELETE` | `/api/staff/profile/location/hours/[id]` | Staff |

Location FormData/JSON fields:

```text
eyebrow
title
description
directionLabel
directionUrl     // URL absolut jika diisi
email
imageAlt
imageFit         // cover | contain
isActive
image
```

Hour JSON:

```json
{
  "dayLabel": "Senin - Jumat",
  "timeLabel": "08.00 - 16.00 WIB",
  "sortOrder": 1,
  "isActive": true
}
```

Upload rule profile:

- Max 2 MB.
- WEBP, PNG, JPG/JPEG, SVG.
- SVG aman saja yang diterima.

## Survey Summary API

| Method | Endpoint | Auth | Used by |
| --- | --- | --- | --- |
| `GET` | `/api/admin/surveys/summary` | Admin | `/admin/surveys` |
| `GET` | `/api/staff/surveys/summary` | Staff | `/staff/surveys` |

Gunakan untuk chart/ringkasan kepuasan. Jika data kosong, tampilkan empty state, bukan error.

## Admin Master Dan System API

Semua route di bagian ini auth admin.

Mahasiswa:

| Method | Endpoint | Body |
| --- | --- | --- |
| `POST` | `/api/admin/master/mahasiswa` | `npm`, `nama`, `kdPs`, `kdPa`, `programStudi`, `jenjang`, `angkatan`, `fak` |
| `PATCH` | `/api/admin/master/mahasiswa/[npm]` | sama, tanpa `npm` |
| `DELETE` | `/api/admin/master/mahasiswa/[npm]` | optional `{ "forceDelete": true }` |

Delete mahasiswa ditahan jika masih punya pengajuan, kecuali dikirim ulang dengan `forceDelete: true`.

Tracer alumni:

| Method | Endpoint | Body |
| --- | --- | --- |
| `POST` | `/api/admin/alumni/tracer-study` | `nama`, `npm`, `program`, `prodi`, `tahunMasuk`, `tahunLulus`, `instansi`, `jabatan`, `statusIsi` |
| `PATCH` | `/api/admin/alumni/tracer-study/[id]` | field yang sama |
| `DELETE` | `/api/admin/alumni/tracer-study/[id]` | tidak perlu body |

System data:

| Method | Endpoint | Body |
| --- | --- | --- |
| `POST` | `/api/admin/system/levels` | `levelDataId`, `levelDataName`, `fieldName` |
| `PATCH` | `/api/admin/system/levels/[id]` | `levelDataName`, `fieldName` |
| `DELETE` | `/api/admin/system/levels/[id]` | tidak perlu body |
| `POST` | `/api/admin/system/units` | `levelDataId`, `levelDataCode`, `unitName` |
| `PATCH` | `/api/admin/system/units/[id]` | `levelDataId`, `levelDataCode`, `unitName` |
| `DELETE` | `/api/admin/system/units/[id]` | tidak perlu body |
| `POST` | `/api/admin/system/users` | `username`, `fullName`, `email`, `telephone`, `accessCode`, `unitId`, `confirmed`, `password`, `confirmPassword` |
| `PATCH` | `/api/admin/system/users/[username]` | user fields, password optional |
| `DELETE` | `/api/admin/system/users/[username]` | tidak perlu body |
| `GET` | `/api/admin/system/user-log` | query read-only |

Proteksi user management:

- Password/hash tidak pernah dikirim ke FE.
- Password minimal 8 karakter dan harus cocok dengan konfirmasi.
- Akun yang sedang login tidak bisa dinonaktifkan, diturunkan dari admin, dipindah unit, atau dihapus.
- Delete user diblokir jika masih punya riwayat aktivitas; nonaktifkan sebagai alternatif.

## Auth Dan Utility

| Method | Endpoint | Auth | Notes |
| --- | --- | --- | --- |
| `GET/POST` | `/api/auth/[...nextauth]` | Public/internal NextAuth | Gunakan `signIn`, `signOut`, `useSession` |
| `GET` | `/api/health` | Public | Health check DB/API |

FE biasanya tidak memanggil route NextAuth langsung. Pakai helper NextAuth.

## Pola UI Frontend

Loading:

- Set `isLoading` saat request.
- Disable submit button.
- Untuk list, tampilkan skeleton atau empty placeholder.

Error:

```ts
try {
  await fetchJson("/api/admin/home/activities");
} catch (error) {
  const message = error instanceof Error ? error.message : "Terjadi kesalahan.";
  setError(message);
}
```

Khusus 503 DB down, tampilkan pesan ramah dan tombol coba lagi.

Upload:

- Validasi tipe dan ukuran file di FE sebelum submit.
- Tetap tampilkan error backend karena backend adalah validasi final.
- Jangan set `Content-Type` untuk `FormData`.
- Untuk SVG dari API image, gunakan `unoptimized` jika memakai `next/image`.

Image rendering:

```tsx
const objectClass = imageFit === "contain" ? "object-contain" : "object-cover";
```

Gunakan background netral pada wrapper saat `object-contain` agar ruang kosong tetap rapi.

Refresh:

- Setelah create/update/delete, refetch list atau `router.refresh()`.
- Setelah save letter metadata, refetch metadata/readiness sebelum enable tombol cetak.

## Route Inventory

| Feature | Method | Endpoint | Auth | Response | Used by | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Health | GET | `/api/health` | Public | JSON | Infra/dev | Internal health check |
| NextAuth | GET/POST | `/api/auth/[...nextauth]` | Public | NextAuth | Login/session | Jangan dipanggil manual kecuali perlu |
| Services | GET | `/api/services` | Public | JSON | `/layanan` | Katalog layanan |
| Service Detail | GET | `/api/services/[slug]` | Public | JSON | `/layanan/[slug]` | Detail layanan |
| Service Submit | POST | `/api/services/[slug]/requests` | Student | JSON | `/layanan/[slug]/ajukan` | JSON/FormData |
| SIK Final | PATCH | `/api/services/surat-izin-kegiatan/requests/[id]/final` | Student | JSON | Form final SIK | FormData |
| Homepage Activities | GET | `/api/home/activities` | Public | JSON | Homepage | Active only |
| Activity Image | GET | `/api/home/activities/images/[id]` | Public/Admin/Staff | Image | Image src | SVG CSP + nosniff |
| Home Links | GET | `/api/home/links` | Public | JSON | Homepage CTA | Kalender Akademik |
| Information Public | GET | `/api/information` | Public | JSON | `/informasi` | Published visible only |
| Information Image | GET | `/api/information/images/[imageId]` | Public/Admin/Staff | Image | Image src | Storage path hidden |
| Profile Org Public | GET | `/api/profile/organization` | Public | JSON | `/profil` | Active tree |
| Profile Location Public | GET | `/api/profile/location` | Public | JSON | `/profil` | Active location |
| Profile Image | GET | `/api/profile/images/[type]/[id]` | Public/Admin/Staff | Image | `/profil` | `organization`/`location` |
| Attachment | GET | `/api/attachments/[id]` | Owner/Admin/Staff | File | Detail pengajuan | Blob/file, not JSON |
| Student Requests | GET | `/api/student/requests` | Student | JSON | Riwayat | Own requests |
| Student Detail | GET | `/api/student/requests/[serviceSlug]/[id]` | Student | JSON | Detail riwayat | Own request only |
| Student Survey Detail | GET/POST | `/api/student/requests/[serviceSlug]/[id]/survey` | Student | JSON | Detail riwayat | Completed/delivered |
| Student Survey List | GET | `/api/student/surveys/requests` | Student | JSON | `/survei` | Pending/submitted |
| Student Survey Pending | GET | `/api/student/surveys/pending` | Student | JSON | Optional badge/helper | Lightweight helper |
| Student Survey Submit | POST | `/api/student/surveys` | Student | JSON | `/survei` | Rating 1-5 |
| Admin Summary | GET | `/api/admin/summary` | Admin | JSON | Dashboard admin | Cards summary |
| Staff Summary | GET | `/api/staff/summary` | Staff | JSON | Dashboard staff | Cards summary |
| Admin Notifications | GET | `/api/admin/notifications/requests` | Admin | JSON | Navbar/dashboard | Pending count |
| Staff Notifications | GET | `/api/staff/notifications/requests` | Staff | JSON | Navbar/dashboard | Pending count |
| Admin Requests | GET | `/api/admin/requests` | Admin | JSON | Admin requests | Filter/pagination |
| Staff Requests | GET | `/api/staff/requests` | Staff | JSON | Staff requests | Filter/pagination |
| Admin Request Detail | GET/DELETE | `/api/admin/requests/[serviceSlug]/[id]` | Admin | JSON | Detail pengajuan | Delete admin only |
| Staff Request Detail | GET/DELETE | `/api/staff/requests/[serviceSlug]/[id]` | Staff | JSON | Detail pengajuan | DELETE returns 403 |
| Admin Status | PATCH | `/api/admin/requests/[serviceSlug]/[id]/status` | Admin | JSON | Detail/table | Status actions |
| Staff Status | PATCH | `/api/staff/requests/[serviceSlug]/[id]/status` | Staff | JSON | Detail/table | Status actions |
| Admin SIK Approval | PATCH | `/api/admin/requests/surat-izin-kegiatan/[id]/approval` | Admin | JSON | SIK verification | approve/reject |
| Staff SIK Approval | PATCH | `/api/staff/requests/surat-izin-kegiatan/[id]/approval` | Staff | JSON | SIK verification | approve/reject |
| Request Export | GET | `/api/admin/requests/export` | Admin | CSV | Admin export | `text/csv` |
| Letter PDF | GET | `/api/requests/[serviceSlug]/[id]/pdf` | Admin/Staff | PDF/Text/JSON | Detail pengajuan | `application/pdf` |
| Letter Metadata | GET/PATCH | `/api/requests/[serviceSlug]/[id]/letter-metadata` | Admin/Staff | JSON | Detail pengajuan | 409 overwrite |
| Email Draft Helper | GET | `/api/requests/[serviceSlug]/[id]/email-draft` | Admin/Staff | JSON | Detail pengajuan | Compose only, manual attachment |
| Admin Home Activities | GET/POST | `/api/admin/home/activities` | Admin | JSON | Admin CMS | List/create |
| Admin Home Activity Detail | GET/PATCH/DELETE | `/api/admin/home/activities/[id]` | Admin | JSON | Admin CMS | Detail/update/delete |
| Staff Home Activities | GET/POST | `/api/staff/home/activities` | Staff | JSON | Staff CMS | List/create |
| Staff Home Activity Detail | GET/PATCH/DELETE | `/api/staff/home/activities/[id]` | Staff | JSON | Staff CMS | Detail/update/delete |
| Admin Home Links | GET | `/api/admin/home/links` | Admin | JSON | Admin CMS | Link state |
| Admin Calendar Link | PATCH | `/api/admin/home/links/academic-calendar` | Admin | JSON | Admin CMS | URL validation |
| Staff Home Links | GET | `/api/staff/home/links` | Staff | JSON | Staff CMS | Link state |
| Staff Calendar Link | PATCH | `/api/staff/home/links/academic-calendar` | Staff | JSON | Staff CMS | URL validation |
| Public Service Links | GET | `/api/services/[slug]/links` | Public | JSON | Layanan public | Fallback default |
| Admin Service Links | GET | `/api/admin/service-links` | Admin | JSON | Admin CMS | Link state |
| Admin Scholarship Template Link | PATCH | `/api/admin/service-links/rekomendasi-beasiswa/scholarship-recommendation-template` | Admin | JSON | Admin CMS | URL validation |
| Staff Service Links | GET | `/api/staff/service-links` | Staff | JSON | Staff CMS | Link state |
| Staff Scholarship Template Link | PATCH | `/api/staff/service-links/rekomendasi-beasiswa/scholarship-recommendation-template` | Staff | JSON | Staff CMS | URL validation |
| Admin Information | GET/POST | `/api/admin/information` | Admin | JSON | Admin informasi | List/create |
| Admin Information Detail | GET/PATCH/DELETE | `/api/admin/information/[id]` | Admin | JSON | Admin informasi | Detail/update/delete |
| Admin Info Images | POST | `/api/admin/information/[id]/images` | Admin | JSON | Admin informasi | Upload images |
| Admin Info Image | PATCH/DELETE | `/api/admin/information/[id]/images/[imageId]` | Admin | JSON | Admin informasi | Metadata/delete |
| Admin Info Cover | POST | `/api/admin/information/[id]/images/[imageId]/cover` | Admin | JSON | Admin informasi | Set cover |
| Staff Information | GET/POST | `/api/staff/information` | Staff | JSON | Staff informasi | List/create |
| Staff Information Detail | GET/PATCH/DELETE | `/api/staff/information/[id]` | Staff | JSON | Staff informasi | Detail/update/delete |
| Staff Info Images | POST | `/api/staff/information/[id]/images` | Staff | JSON | Staff informasi | Upload images |
| Staff Info Image | PATCH/DELETE | `/api/staff/information/[id]/images/[imageId]` | Staff | JSON | Staff informasi | Metadata/delete |
| Staff Info Cover | POST | `/api/staff/information/[id]/images/[imageId]/cover` | Staff | JSON | Staff informasi | Set cover |
| Admin Surveys | GET | `/api/admin/surveys/summary` | Admin | JSON | Admin surveys | Summary |
| Staff Surveys | GET | `/api/staff/surveys/summary` | Staff | JSON | Staff surveys | Summary |
| Admin Mahasiswa | POST | `/api/admin/master/mahasiswa` | Admin | JSON | Master mahasiswa | Create |
| Admin Mahasiswa Detail | PATCH/DELETE | `/api/admin/master/mahasiswa/[npm]` | Admin | JSON | Master mahasiswa | Update/delete |
| Admin Tracer | POST | `/api/admin/alumni/tracer-study` | Admin | JSON | Master alumni | Create |
| Admin Tracer Detail | PATCH/DELETE | `/api/admin/alumni/tracer-study/[id]` | Admin | JSON | Master alumni | Update/delete |
| Admin Levels | POST | `/api/admin/system/levels` | Admin | JSON | System data | Create |
| Admin Level Detail | PATCH/DELETE | `/api/admin/system/levels/[id]` | Admin | JSON | System data | Update/delete |
| Admin Units | POST | `/api/admin/system/units` | Admin | JSON | System data | Create |
| Admin Unit Detail | PATCH/DELETE | `/api/admin/system/units/[id]` | Admin | JSON | System data | Update/delete |
| Admin Users | POST | `/api/admin/system/users` | Admin | JSON | User management | Create |
| Admin User Detail | PATCH/DELETE | `/api/admin/system/users/[username]` | Admin | JSON | User management | Update/delete |
| Admin User Log | GET | `/api/admin/system/user-log` | Admin | JSON | Audit log | Read-only |
| Admin Profile Org | GET/POST | `/api/admin/profile/organization` | Admin | JSON | Profile CMS | List/create |
| Admin Profile Org Detail | GET/PATCH/DELETE | `/api/admin/profile/organization/[id]` | Admin | JSON | Profile CMS | Detail/update/delete |
| Admin Profile Location | GET/PATCH | `/api/admin/profile/location` | Admin | JSON | Profile CMS | Get/update |
| Admin Profile Hours | POST | `/api/admin/profile/location/hours` | Admin | JSON | Profile CMS | Add hour |
| Admin Profile Hour Detail | PATCH/DELETE | `/api/admin/profile/location/hours/[id]` | Admin | JSON | Profile CMS | Update/delete |
| Staff Profile Org | GET/POST | `/api/staff/profile/organization` | Staff | JSON | Profile CMS | List/create |
| Staff Profile Org Detail | GET/PATCH/DELETE | `/api/staff/profile/organization/[id]` | Staff | JSON | Profile CMS | Detail/update/delete |
| Staff Profile Location | GET/PATCH | `/api/staff/profile/location` | Staff | JSON | Profile CMS | Get/update |
| Staff Profile Hours | POST | `/api/staff/profile/location/hours` | Staff | JSON | Profile CMS | Add hour |
| Staff Profile Hour Detail | PATCH/DELETE | `/api/staff/profile/location/hours/[id]` | Staff | JSON | Profile CMS | Update/delete |

## Email Delivery Helper Level 1

`GET /api/requests/[serviceSlug]/[id]/email-draft` menyiapkan data Gmail compose untuk admin/staff:

- `recipientEmail` jika tersedia dari field request atau alumni profile.
- `subject` dengan format `Penyelesaian Pengajuan {serviceTitle} - ULT FMIPA Unpad`.
- `body` default yang netral dan tidak menyebut auto-attachment.
- `gmailComposeUrl`.
- `supportsGeneratedPdf` dan `pdfUrl` hanya untuk layanan printable.
- `attachmentInstruction` selalu berisi instruksi lampiran manual.

Fitur ini menggunakan Gmail compose URL. Sistem hanya mengisi email tujuan, subjek, dan isi pesan. File hasil layanan tetap harus dilampirkan manual oleh admin/staff. Fitur ini tidak memakai `mailto:`, tidak mengirim email otomatis, tidak memakai SMTP, tidak memakai Gmail API, dan tidak mengubah generator PDF.

Layanan printable (`keterangan-lulus`, `ket-tunjangan-orang-tua`, `keterangan-masih-kuliah`, `keterangan-kelakuan-baik`, `permohonan-magang-kerja-praktek-ta`) hanya menampilkan tombol bantu `Buka PDF Surat`; PDF tetap harus dibuka/diunduh lalu dilampirkan manual di Gmail.

## Data Surat Printable

`GET /api/requests/[serviceSlug]/[id]/letter-metadata` menyertakan `identity` aman untuk display `Data Surat`:

- `npm`
- `name`
- `programStudy`
- `email`
- `phone`

Frontend harus menampilkan identitas ini read-only untuk semua layanan printable. Untuk `keterangan-lulus`, field `Yudisium` memakai dropdown nilai resmi:

- `Pujian`
- `Sangat Memuaskan`
- `Memuaskan`

Admin/staff harus memvalidasi IPK dan Yudisium terhadap data akademik resmi sebelum mencetak. PDF `keterangan-lulus` menolak IPK di luar 0.00-4.00 dan Yudisium di luar pilihan resmi.

`permohonan-magang-kerja-praktek-ta` mendukung PDF Surat Permohonan Izin Magang Kerja. Template mengikuti acuan `docs/Magang_Kerja140810230017.pdf` dan memakai snapshot `Data Surat` pada row `permohonan_magang`, termasuk tujuan surat, alamat, tanggal pelaksanaan, nomor surat, tanggal surat, dan penandatangan.

## Belum Tersedia / Tidak Ditemukan

- Tidak ada route `PUT` di `src/app/api`.
- Tidak ada bulk delete request API.
- Tidak ada dedicated report tab API selain summary, survey summary, request list, dan CSV export.
- List master data tertentu masih bisa berasal dari server component/helper, bukan route GET khusus.

## Tipe Minimal FE

```ts
export type Role = "admin" | "staff" | "student";

export type RequestStatus =
  | "pending"
  | "inProgress"
  | "completed"
  | "delivered";

export type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type ApiErrorPayload =
  | { error: string; issues?: Array<{ field: string; message: string }> }
  | { success: false; error: { code?: string; message: string } };
```
