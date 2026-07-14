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

## Active / Inactive

Homepage hanya menampilkan item yang aktif. Menonaktifkan item dari admin/staff akan menghilangkan item tersebut dari carousel publik tanpa menghapus datanya.

## Ordering

Homepage mengurutkan item aktif berdasarkan:

1. `SORT_ORDER` ascending
2. `CREATED_AT` descending
3. `ID` descending

Jumlah item yang tampil dikontrol oleh jumlah item aktif.

## Public Fallback

Homepage mengambil data dari `/api/home/activities`. Jika database kosong, tabel belum dimigrasikan, atau API tidak tersedia, komponen homepage tetap aman dan memakai fallback statis bawaan agar section tidak crash.

## Known Limitations

- Form saat ini mendukung satu gambar utama per item.
- Hapus gambar tanpa mengganti gambar belum dipisahkan menjadi aksi tersendiri.
- Fallback publik hanya dipakai di client homepage; halaman admin/staff tetap menunjukkan daftar kosong jika tabel belum tersedia.
