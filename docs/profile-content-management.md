# Profile Content Management

Halaman publik `/profil` sekarang memakai data CMS untuk dua section:

- **Struktur Organisasi**
- **Location & Access / Lokasi Kami**

Jika tabel belum dimigrasikan, database tidak tersedia, atau API publik gagal dimuat, halaman publik tetap memakai fallback statis bawaan agar tidak crash.

## Dashboard

Admin:

- `/admin/profil/struktur`
- `/admin/profil/lokasi`

Staff:

- `/staff/profil/struktur`
- `/staff/profil/lokasi`

Menu sidebar menampilkan item **Profil - Struktur** dan **Profil - Lokasi**.

## Struktur Organisasi

Struktur disimpan sebagai tree di tabel `ult_profile_organization_nodes`.

Konsep parent/child:

- `PARENT_ID = NULL` berarti node root.
- Jumlah cabang di bawah setiap orang ditentukan dari jumlah child node.
- Tree tidak dibatasi hanya tiga level, tetapi tampilan publik tetap dirapikan responsif.
- Parent dropdown menyediakan opsi **Tidak ada atasan / Root**.
- API menolak parent yang sama dengan node sendiri atau parent yang membuat relasi melingkar.
- Delete node yang masih punya child akan ditolak. Pindahkan atau hapus child terlebih dahulu.

Field yang dikelola:

- Nama orang
- Jabatan / position title
- Label role
- Parent / atasan
- Sort order
- Warna cabang: hijau, merah, kuning
- Foto dan alt foto
- Status aktif/nonaktif

Foto organisasi disajikan lewat `/api/profile/images/organization/[id]`, bukan raw storage path.

## Lokasi Kami

Pengaturan utama disimpan di `ult_profile_location_settings`, sedangkan jam operasional disimpan di `ult_profile_location_hours`.

Field yang dikelola:

- Eyebrow
- Title
- Description
- Direction label
- Direction URL
- Email
- Location image
- Image alt
- Image fit
- Active status
- Operating hours rows

`directionUrl` harus URL absolut jika diisi. Email harus berbentuk email valid jika diisi.

Jam operasional bisa ditambah, diedit, dihapus, diurutkan, dan diaktif/nonaktifkan.

## Image Upload

Upload gambar Profil mengikuti aturan CMS image upload:

- WEBP
- PNG
- JPG
- JPEG
- SVG aman
- Maksimal 2 MB

SVG yang mengandung script, event handler, `javascript:`, `foreignObject`, atau referensi remote ditolak oleh validasi safe SVG.

Storage: object MinIO (bukan filesystem lokal), prefix:

- `profile/organization/`
- `profile/location/`

Lihat `docs/minio-storage-deployment.md` untuk detail arsitektur storage.

## Image Fit

Lokasi mendukung:

- `cover` / **Penuhi Card**: gambar memenuhi card.
- `contain` / **Tampilkan Utuh**: seluruh gambar terlihat, cocok untuk denah, logo, atau SVG.

Foto organisasi default memakai tampilan cover.

## API

Public:

- `GET /api/profile/organization`
- `GET /api/profile/location`
- `GET /api/profile/images/[type]/[id]`

Admin:

- `GET /api/admin/profile/organization`
- `POST /api/admin/profile/organization`
- `GET /api/admin/profile/organization/[id]`
- `PATCH /api/admin/profile/organization/[id]`
- `DELETE /api/admin/profile/organization/[id]`
- `GET /api/admin/profile/location`
- `PATCH /api/admin/profile/location`
- `POST /api/admin/profile/location/hours`
- `PATCH /api/admin/profile/location/hours/[id]`
- `DELETE /api/admin/profile/location/hours/[id]`

Staff:

- `GET /api/staff/profile/organization`
- `POST /api/staff/profile/organization`
- `GET /api/staff/profile/organization/[id]`
- `PATCH /api/staff/profile/organization/[id]`
- `DELETE /api/staff/profile/organization/[id]`
- `GET /api/staff/profile/location`
- `PATCH /api/staff/profile/location`
- `POST /api/staff/profile/location/hours`
- `PATCH /api/staff/profile/location/hours/[id]`
- `DELETE /api/staff/profile/location/hours/[id]`

Protected API membutuhkan session sesuai role. Error database memakai pesan aman:

`Koneksi database sedang tidak tersedia. Coba lagi beberapa saat lagi.`

## Audit Log

Perubahan berikut dicatat ke audit log jika tabel log tersedia:

- Create/update/delete organization node
- Update location settings
- Create/update/delete operating hour

Kegagalan audit log tidak membatalkan aksi utama.
