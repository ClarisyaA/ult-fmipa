# Preview ULT FMIPA di Vercel

Branch: `chore/vercel-preview-seed-accounts`. Import repository ini ke Vercel
dengan **Root Directory** default (`./`), framework Next.js, dan package
manager pnpm. Root Git sudah berada di folder proyek ini.
Build command cukup `pnpm build`; perintah ini juga menjalankan `prisma generate`.

## Database kosong

Siapkan **database MariaDB baru dan kosong**, terpisah dari database kampus.
Untuk biaya nol, gunakan [MariaDB Cloud Serverless Free Developer Tier](https://mariadb.com/docs/mariadb-cloud/readme/serverless).
Database harus dapat diakses dari Vercel lewat jaringan. Jangan impor dump
`database/exports/` karena berisi data lama. Dari mesin yang dapat mengakses
database preview, isi variabel database di bawah lalu jalankan sekali:

```powershell
pnpm install --frozen-lockfile
pnpm preview:create-db
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

| Nama                                                      | Nilai                                                                    |
| --------------------------------------------------------- | ------------------------------------------------------------------------ |
| `NEXTAUTH_URL`                                            | URL deployment, misalnya `https://nama-proyek.vercel.app`                |
| `NEXTAUTH_SECRET`                                         | Secret acak yang kuat, misalnya hasil `openssl rand -base64 32`          |
| `DATABASE_URL`                                            | `mysql://USER:PASSWORD@HOST:PORT/NAMA_DATABASE_PREVIEW?sslaccept=strict` |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Parameter database yang sama dengan `DATABASE_URL` (dipakai aplikasi)    |
| `DB_SSL`                                                  | `true` untuk MariaDB Cloud                                               |
| `DB_CONNECTION_LIMIT`                                     | `2` untuk membatasi koneksi tiap instance serverless                     |
| `MAX_UPLOAD_SIZE_MB`                                      | `4` untuk upload umum di bawah batas request Vercel                      |
| `DEV_ADMIN_EMAIL`, `DEV_ADMIN_PASSWORD`                   | Identitas dan password akun admin uji                                    |
| `DEV_STAFF_EMAIL`, `DEV_STAFF_PASSWORD`                   | Identitas dan password akun staff uji                                    |
| `DEV_STUDENT_EMAIL`, `DEV_STUDENT_PASSWORD`               | Identitas dan password akun mahasiswa uji                                |
| `DEV_STUDENT_NAME`, `DEV_STUDENT_NPM`                     | Nama dan NPM fiktif akun mahasiswa uji                                   |

Gunakan tiga email dan tiga password unik. Akun uji ini diaktifkan langsung
oleh konfigurasi login dan tidak menambah baris pada tabel `data_users`.
Pastikan NPM uji tidak memakai NPM mahasiswa sungguhan. Jangan mengisi
konfigurasi PAUS pada preview jika login SSO belum akan diuji.

Untuk fitur unggah/lampiran, gunakan [Cloudflare R2 Standard](https://developers.cloudflare.com/r2/pricing/)
dengan bucket privat baru. R2 menggunakan API S3-compatible. Isi
`MINIO_ENDPOINT` dengan `<ACCOUNT_ID>.r2.cloudflarestorage.com` (tanpa `https://`),
`MINIO_PORT=443`, `MINIO_USE_SSL=true`, lalu isi
`MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, dan `MINIO_BUCKET`. Bucket harus baru
dan privat. Tanpa ini, halaman dasar dan login dapat diuji, tetapi fitur
unggah tidak akan berfungsi.
Vercel Functions membatasi body request pada 4,5 MB, termasuk overhead
multipart. Untuk preview, gunakan file kecil (maksimal sekitar 4 MB). Form
yang memiliki batas unggah lebih besar tetap akan gagal untuk file di atas
batas Vercel; dukungan file besar perlu alur unggah langsung ke object storage.

Vercel Hobby gratis untuk penggunaan personal/non-komersial. MariaDB Cloud
dan R2 memiliki kuota gratis terpisah; cek kuota saat membuat resource.
MariaDB Cloud memakai IP allowlist. Karena alamat keluar Vercel Hobby tidak
tetap, akses jaringan database perlu diatur untuk preview publik dengan
password unik dan TLS, serta hanya memakai data uji. Jangan memakai database
kampus untuk konfigurasi ini.

Setelah env tersimpan, lakukan **Redeploy** di Vercel. Uji `/login` dengan
ketiga akun, lalu buka halaman admin, staff, dan mahasiswa. URL preview yang
berubah pada tiap commit memerlukan `NEXTAUTH_URL` yang cocok dengan domain
yang sedang dipakai; gunakan domain tetap agar callback login stabil.
