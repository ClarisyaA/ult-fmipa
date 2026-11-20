# Sinkron Data Mahasiswa & Akses Fitur Staff

Dokumen ini menjelaskan bagaimana tabel `mahasiswa` diisi/diperbarui, bagaimana
tabel itu dipakai saat login PAUS, dan bagaimana Admin memberi akses fitur
import kepada akun Staff.

## 1. Mengapa tabel `mahasiswa` penting

Alur login mahasiswa mengikuti ULT lama:

1. Mahasiswa login di PAUS. PAUS mengembalikan NPM.
2. **NPM dicek ke tabel `mahasiswa`.** Jika tidak ada, login ditolak dengan
   pesan "NPM Anda belum terdaftar di data mahasiswa FMIPA. Silakan hubungi ULT
   FMIPA." dan tidak ada sesi yang dibuat.
3. Jika ada, sesi dibuat sebagai `MAHASISWA`.

Akibatnya **mahasiswa baru tidak bisa login sebelum datanya masuk ke tabel**.
Perbarui tabel setiap ada angkatan baru (lihat bagian 2 dan 3).

Login Admin/Staff (akun internal) tidak terpengaruh.

Pemeriksaan ini bisa dimatikan sementara dengan `PAUS_REQUIRE_REGISTERED_NPM=false`
(mis. saat data angkatan baru belum diimpor). Nyalakan kembali setelah data masuk.

## 2. Pintu A: unggah Excel (selalu tersedia)

Halaman: **Admin → Data Mahasiswa → Import Excel**. Staff yang diberi akses
membuka **Data Mahasiswa** di menu Staff.

- **Template sama dengan ULT lama**: `public/templates/temp_data_mahasiswa.xlsx`
  (sheet `mhs`; kolom `NPM`, `Nama`, `Kode Prodi`, `Nama Prodi`, `Nama Jenjang`,
  `Angkatan`). File lama yang judul kolomnya sedikit berbeda tetap terbaca
  menurut urutan kolom A-F. Format `.csv` juga diterima.
- Langkah: pilih file → **Periksa file** (tidak menyimpan apa pun, hanya
  menampilkan jumlah tambah/ubah/gagal) → **Simpan perubahan**.
- Batas: 5 MB dan 50.000 baris per file.

## 3. Pintu B: otomatis (nonaktif sampai ada sumber data)

Sistem lain mengirim data lewat `POST /api/internal/mahasiswa-sync`.

- Nonaktif (balasan 404) selama `MAHASISWA_SYNC_TOKEN` kosong.
- Token minimal 32 karakter acak, dikirim sebagai `Authorization: Bearer <token>`.
- Hanya dipakai server-ke-server. Jangan dipasang di browser.

```bash
curl -X POST https://ult.fmipa.unpad.ac.id/api/internal/mahasiswa-sync \
  -H "Authorization: Bearer $MAHASISWA_SYNC_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"dryRun": true, "rows": [
        {"npm": "140810260001", "nama": "Contoh", "kodeProdi": "081",
         "namaProdi": "Matematika", "jenjang": "Sarjana (S-1)", "angkatan": 2026}
      ]}'
```

`"dryRun": true` hanya memeriksa. Hapus untuk menyimpan.

## 4. Aturan yang sama untuk kedua pintu

- Kunci data adalah **NPM**: sudah ada → diperbarui, belum ada → ditambah.
- **Tidak pernah menghapus data.** Mahasiswa yang tidak ada di file tetap ada.
- **Kolom kosong tidak menimpa** data yang sudah ada.
- Baris bermasalah (NPM/nama kosong, NPM bukan huruf-angka atau lebih dari 15
  karakter, angkatan di luar 1950 sampai tahun berjalan, NPM ganda di file)
  dilewati dan dilaporkan; baris lain tetap diproses.
- `Nama Jenjang` disimpan apa adanya (dicetak langsung di surat), jadi tulis
  seragam, mis. "Sarjana (S-1)".
- Setiap penyimpanan dicatat di **User Log** (sumber, jumlah tambah/ubah,
  jumlah gagal).

## 5. Memberi Staff akses import (Role & Akses)

**Admin → System → User List → tab "Role & Akses"**: centang kolom
"Import Data Mahasiswa" pada akun Staff yang boleh. Hapus centang untuk
mencabut. Admin selalu punya semua akses.

- Staff yang diberi akses melihat menu **Data Mahasiswa** dan bisa memakai
  Import Excel. Staff tanpa akses tidak melihat menunya, dan API-nya menolak
  (403).
- Pemberian dan pencabutan akses dicatat di User Log.
- Fitur baru yang ingin dibuat bisa diberi akses yang sama dengan menambahkannya
  di `src/lib/feature-access-core.ts` (`STAFF_FEATURES`).

## 6. Persiapan di server

Jalankan migrasi pendukung sekali agar tabel akses terbentuk:

```bash
pnpm db:support-migrate
```

Migrasi `013_create_staff_feature_access.sql` bersifat idempoten (aman diulang).
Selama tabel belum ada, Admin tetap bisa mengimpor; Staff dianggap tidak punya
akses dan tab Role & Akses menampilkan petunjuk.

## 7. Variabel lingkungan

| Variabel | Default | Fungsi |
| --- | --- | --- |
| `PAUS_REQUIRE_REGISTERED_NPM` | `true` | Wajibkan NPM ada di tabel `mahasiswa` saat login PAUS. |
| `MAHASISWA_SYNC_TOKEN` | kosong (nonaktif) | Token pintu otomatis. Minimal 32 karakter. |
