# Preview ULT FMIPA di Vercel

Branch: `chore/vercel-preview-seed-accounts`. Import repository ini ke Vercel
dengan **Root Directory** default (`./`), framework Next.js, dan package
manager pnpm. Root Git sudah berada di folder proyek ini.
Build command cukup `pnpm build`; perintah ini juga menjalankan `prisma generate`.

## Database kosong

Siapkan **database MariaDB baru dan kosong**, terpisah dari database kampus.
Database harus dapat diakses dari Vercel lewat jaringan. Jangan impor dump
`database/exports/` karena berisi data lama. Dari mesin yang dapat mengakses
database preview, isi variabel database di bawah lalu jalankan sekali:

```powershell
pnpm install --frozen-lockfile
pnpm db:push
pnpm preview:schema
pnpm preview:check
```

`db:push` hanya untuk database preview **yang benar-benar baru dan kosong**;
jangan arahkan ke database lama atau production. `preview:schema` menjalankan
struktur tabel dari migrasi pendukung tanpa data contoh. Semua isian tetap
kosong, termasuk pengajuan, pengguna, konten CMS, dan data mahasiswa.
Beberapa halaman yang membutuhkan data referensi lama mungkin menampilkan
pilihan kosong sampai data tersebut diisi melalui aplikasi.

## Environment Variables Vercel

Isi untuk environment Preview (dan Production jika preview ingin memakai
domain Production). Semua nilai rahasia dibuat baru dan tidak dimasukkan ke git.

| Nama                                                      | Nilai                                                                 |
| --------------------------------------------------------- | --------------------------------------------------------------------- |
| `NEXTAUTH_URL`                                            | URL deployment, misalnya `https://nama-proyek.vercel.app`             |
| `NEXTAUTH_SECRET`                                         | Secret acak yang kuat, misalnya hasil `openssl rand -base64 32`       |
| `DATABASE_URL`                                            | `mysql://USER:PASSWORD@HOST:PORT/NAMA_DATABASE_PREVIEW`               |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Parameter database yang sama dengan `DATABASE_URL` (dipakai aplikasi) |
| `DB_CONNECTION_LIMIT`                                     | `2` untuk membatasi koneksi tiap instance serverless                  |
| `DEV_ADMIN_EMAIL`, `DEV_ADMIN_PASSWORD`                   | Identitas dan password akun admin uji                                 |
| `DEV_STAFF_EMAIL`, `DEV_STAFF_PASSWORD`                   | Identitas dan password akun staff uji                                 |
| `DEV_STUDENT_EMAIL`, `DEV_STUDENT_PASSWORD`               | Identitas dan password akun mahasiswa uji                             |
| `DEV_STUDENT_NAME`, `DEV_STUDENT_NPM`                     | Nama dan NPM fiktif akun mahasiswa uji                                |

Gunakan tiga email dan tiga password unik. Akun uji ini diaktifkan langsung
oleh konfigurasi login dan tidak menambah baris pada tabel `data_users`.
Pastikan NPM uji tidak memakai NPM mahasiswa sungguhan. Jangan mengisi
konfigurasi PAUS pada preview jika login SSO belum akan diuji.

Untuk fitur unggah/lampiran, sediakan object storage S3-compatible yang dapat
diakses dari Vercel dan isi `MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_USE_SSL`,
`MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, dan `MINIO_BUCKET`. Bucket harus baru
dan privat. Tanpa ini, halaman dasar dan login dapat diuji, tetapi fitur
unggah tidak akan berfungsi.

Setelah env tersimpan, lakukan **Redeploy** di Vercel. Uji `/login` dengan
ketiga akun, lalu buka halaman admin, staff, dan mahasiswa. URL preview yang
berubah pada tiap commit memerlukan `NEXTAUTH_URL` yang cocok dengan domain
yang sedang dipakai; gunakan domain tetap agar callback login stabil.
