# Homepage Content Management

Dokumen ini menjelaskan pengelolaan section **Kegiatan Mahasiswa** di homepage ULT FMIPA.

## Akses Pengelolaan

Admin dan staff dapat mengelola item melalui:

- Admin: `/admin/beranda/kegiatan`
- Staff: `/staff/beranda/kegiatan`

Menu sidebar menampilkan item **Kegiatan Mahasiswa**.

## Field Kegiatan

Setiap item mendukung field berikut:

- Judul
- Eyebrow / kategori
- Deskripsi
- Gambar
- Alt gambar
- Status aktif
- Urutan tampil
- Created/updated metadata
- Created by / updated by

## Gambar

Upload gambar memakai storage lokal `storage/home-activities` dan disajikan lewat API aman:

- `/api/home/activities/images/[id]`

Format yang didukung:

- WEBP
- PNG
- JPG/JPEG
- SVG

Batas ukuran mengikuti konvensi upload informasi saat ini: maksimal 2 MB per gambar.
Form gambar mendukung klik untuk memilih file atau drag-and-drop ke area upload.
File upload asli disimpan di `storage/home-activities` dan tidak boleh ikut commit. Folder ini di-ignore kecuali `.gitkeep`.

## Active / Inactive

Homepage hanya menampilkan item yang aktif. Menonaktifkan item dari admin/staff akan menghilangkan item tersebut dari carousel publik tanpa menghapus datanya.

## Ordering

Homepage mengurutkan item aktif berdasarkan:

1. `SORT_ORDER` ascending
2. `CREATED_AT` descending
3. `ID` descending

Jumlah item yang tampil dikontrol oleh jumlah item aktif.

## Permission Behavior

Admin dan staff dapat melakukan aksi yang sama untuk Kegiatan Mahasiswa:

- list
- tambah
- edit
- upload/ganti gambar
- aktif/nonaktif
- hapus

Endpoint management membutuhkan session admin atau staff. Request tanpa session mengembalikan `401`, sedangkan role lain seperti student mengembalikan `403`.

## Public Fallback

Homepage mengambil data dari `/api/home/activities`. Jika database kosong, tabel belum dimigrasikan, atau API tidak tersedia, komponen homepage tetap aman dan memakai fallback statis bawaan agar section tidak crash.

Admin/staff list menampilkan pesan ramah jika database belum tersedia:

`Koneksi database sedang tidak tersedia. Coba lagi beberapa saat lagi.`

## Manual QA Checklist

Public homepage:

- Buka homepage dan pastikan section Kegiatan Mahasiswa tampil.
- Pastikan tombol `Pelajari Selengkapnya` tidak ada pada slide Kegiatan Mahasiswa.
- Pastikan item aktif dari CMS tampil sesuai urutan.
- Pastikan carousel tetap rapi untuk 1, 2, dan lebih dari 2 item.
- Pastikan arrows/progress hanya muncul ketika ada lebih dari 1 item.
- Pastikan gambar dimuat dari `/api/home/activities/images/[id]`, bukan raw path storage.
- Matikan database lalu buka homepage; section harus tetap aman dengan fallback statis.

Admin/staff CMS:

- Tambah activity dengan judul, eyebrow, deskripsi, gambar, alt text, status aktif, dan urutan.
- Edit semua field tersebut dan pastikan homepage ikut berubah.
- Nonaktifkan item dan pastikan item hilang dari homepage.
- Upload format invalid dan pastikan ditolak.
- Upload file lebih dari 2 MB dan pastikan ditolak.
- Upload gambar dengan drag-and-drop dan dengan klik/select.
- Hapus activity dan pastikan item tidak tampil lagi.
- Pastikan tidak ada raw filesystem path atau stack trace pada UI/API response.
- Matikan database lalu buka halaman admin/staff Kegiatan Mahasiswa; pesan database harus ramah.

Regression spot checks:

- Homepage hero pertama tetap tampil.
- Section homepage lain tetap tampil.
- Admin/staff dashboard tetap bisa dibuka.
- Informasi CRUD tetap bisa dibuka.
- Request admin/staff, survey, Magang, SIK, dan flow PDF/surat tidak disentuh oleh fitur ini.

## Known Limitations

- Form saat ini mendukung satu gambar utama per item.
- Hapus gambar tanpa mengganti gambar belum dipisahkan menjadi aksi tersendiri.
- SVG didukung untuk kebutuhan asset dekoratif; route gambar menambahkan header `Content-Security-Policy` dan `X-Content-Type-Options`.
