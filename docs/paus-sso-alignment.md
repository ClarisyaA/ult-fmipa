# Penyelarasan Login & Logout PAuS dengan Panduan Resmi

Dokumen ini menjelaskan bagaimana aplikasi disesuaikan dengan **"Panduan
Integrasi PAuS SSO Unpad untuk Aplikasi Pihak Ketiga" v1.0 (18 Juni 2026)**
dan arahan DPSI. Dokumen audit lama (`paus-integration-audit.md`) masih
memuat endpoint gaya lama; untuk konfigurasi terkini pakai dokumen ini.

## 1. Alur login mahasiswa

1. Mahasiswa klik **Masuk sebagai Mahasiswa** → diarahkan ke
   `/oauth/authorize` PAuS (`response_type=code`, `scope`, `state` acak).
2. PAuS mengembalikan `code` + `state` ke `/api/auth/callback/paus`
   (`state` divalidasi NextAuth).
3. Server menukar `code` di `/oauth/token` (form berisi `client_id`,
   `client_secret`, `redirect_uri`, `code`; header `Accept: application/json`).
4. Server mengambil profil dari `/api/user` dengan header
   `Authorization: Bearer <access_token>`.
5. Aturan masuk (berurutan, semuanya harus lolos):
   1. Profil memuat **NPM** (tanpa NPM, termasuk dosen/tendik → ditolak).
   2. Bukan **alumni** menurut penanda PAuS (aktif bila `PAUS_ALUMNI_FIELD` diisi).
   3. NPM ada di tabel **`mahasiswa`** (`PAUS_REQUIRE_REGISTERED_NPM`, default aktif).
6. Sesi JWT dibuat dengan role `MAHASISWA`. Token PAuS tidak disimpan di sesi.

Admin dan Staff tetap login manual (akun internal), tidak lewat PAuS.

Penolakan selalu berakhir di `/login?error=<kode>` supaya pesan tampil:

| Kode | Arti |
| --- | --- |
| `AccessDenied` | Profil tanpa NPM (mis. dosen/tendik) |
| `AlumniNotAllowed` | Akun alumni (menurut penanda PAuS) |
| `NpmNotRegistered` | NPM tidak ada di tabel `mahasiswa` |
| `RegistryUnavailable` | Tabel `mahasiswa` tidak dapat diperiksa (gagal tertutup) |

## 2. Alur logout (tujuan akhir: beranda)

Semua tombol **Keluar** memakai satu fungsi, `logout()` di
`src/lib/client-logout.ts`:

- **Admin/Staff:** hapus sesi ULT → beranda (`/`).
- **Mahasiswa PAuS:** hapus sesi ULT → `GET /api/paus/logout` → sign-out PAuS
  (`client_id` + tujuan kembali) → **beranda**.

Tujuan kembali = `NEXTAUTH_URL` + `/` (mis. `https://ult.fmipa.unpad.ac.id/`),
dibangun di server tanpa input pengguna (tidak ada open redirect). URL ini
**harus didaftarkan** di PAuS sebagai tujuan setelah logout. Bila logout global
dimatikan (`PAUS_GLOBAL_LOGOUT=false`) atau `PAUS_CLIENT_ID` kosong, pengguna
langsung ke beranda.

## 3. Variabel lingkungan

| Variabel | Default | Fungsi |
| --- | --- | --- |
| `PAUS_CLIENT_ID`, `PAUS_CLIENT_SECRET` | kosong | Dari DPSI. Provider baru aktif bila keduanya terisi. |
| `PAUS_AUTHORIZATION_URL` | `https://paus.unpad.ac.id/oauth/authorize` | |
| `PAUS_TOKEN_URL` | `https://paus.unpad.ac.id/oauth/token` | |
| `PAUS_USERINFO_URL` | `https://paus.unpad.ac.id/api/user` | |
| `PAUS_SCOPE` | `read-user-info` | |
| `PAUS_USERINFO_AUTH` | `bearer` | `query` = gaya lama (`?access_token=`). |
| `PAUS_SIGN_OUT_URL` | `https://paus.unpad.ac.id/oauth/sign-out` | **Belum dikonfirmasi DPSI.** |
| `PAUS_SIGN_OUT_REDIRECT_PARAM` | `redirect_uri` | Nama parameter tujuan kembali. |
| `PAUS_GLOBAL_LOGOUT` | `true` | `false` = hanya logout lokal. |
| `PAUS_ALUMNI_FIELD` | kosong (nonaktif) | Nama field penanda alumni dari PAuS, mis. `status`. |
| `PAUS_ALUMNI_VALUES` | `alumni,lulus` | Nilai yang berarti alumni. |
| `PAUS_ACTIVE_VALUES` | kosong | Bila diisi, hanya nilai ini yang boleh masuk. |
| `PAUS_BRIDGE_ENABLED` | `false` | PAuS Bridge (alur PHP lama) mati kecuali `true`. |
| `PAUS_REQUIRE_REGISTERED_NPM` | `true` | `false` = NPM tidak dicek ke tabel `mahasiswa` (sementara saja). |
| `AUTH_DEBUG` | `false` | `true` mencatat **bentuk** respons userinfo di log (hanya nama field dan tipe, tanpa nilai) untuk melihat format asli PAuS. Matikan lagi setelah selesai. |
| `NEXTAUTH_URL` | - | Harus sama persis dengan redirect URI yang didaftarkan. |

Kembali ke endpoint lama bila DPSI meminta: set `PAUS_AUTHORIZATION_URL=.../oauth`,
`PAUS_TOKEN_URL=.../oauth/access-token`, `PAUS_USERINFO_URL=.../api/`,
`PAUS_SCOPE=user.basic`, `PAUS_USERINFO_AUTH=query`.

Bentuk profil dibaca secara defensif (`src/lib/paus-profile.ts`): gaya lama
`attributes.<field>.attribute_value`, bentuk datar (`paus_id`, `nama`, `npm`),
atau akun aktif pertama di `accounts[]`.

## 4. Redirect URI yang didaftarkan di PAuS

| Environment | Redirect URI login | Tujuan setelah logout |
| --- | --- | --- |
| Production | `https://ult.fmipa.unpad.ac.id/api/auth/callback/paus` | `https://ult.fmipa.unpad.ac.id/` |
| Dev lokal | `http://localhost:3000/api/auth/callback/paus` | `http://localhost:3000/` |
| Staging lokal | `http://localhost:3100/api/auth/callback/paus` | `http://localhost:3100/` |

## 5. Menguji tanpa credential asli (PAuS tiruan)

`scripts/mock-paus.mjs` meniru kontrak panduan (authorize, token, userinfo,
sign-out) dengan akun uji `ZZMOCK...`. Bentuk profil bisa dipilih lewat
`MOCK_PAUS_SHAPE=flat|attributes|accounts`.

1. Jalankan PAuS tiruan:

```bash
pnpm mock:paus
```

2. Jalankan aplikasi di port 3010 dengan `PAUS_*` diarahkan ke tiruan
   (`NEXTAUTH_URL=http://localhost:3010`, `PAUS_CLIENT_ID=mock-client-id`,
   `PAUS_CLIENT_SECRET=mock-client-secret`, URL authorize/token/userinfo/sign-out
   ke `http://localhost:4010/...`, `PAUS_ALUMNI_FIELD=status`).
3. Untuk menguji pengecekan tabel, masukkan sementara NPM `ZZMOCK000001` dan
   `ZZMOCK000003` ke tabel `mahasiswa` (hapus lagi setelahnya).
4. Jalankan pemeriksa:

```bash
pnpm check:paus-flow
```

Pemeriksa memverifikasi parameter authorize, tukar token, Bearer, sesi,
logout → sign-out → beranda, serta penolakan (dosen, NPM belum terdaftar,
alumni). Atur `EXPECT_REGISTRY=true` dan `EXPECT_ALUMNI=true` untuk dua
skenario terakhir.

## 6. Checklist panduan PAuS §9

- [x] `redirect_uri` produksi & pengembangan siap didaftarkan (bagian 4).
- [x] Rute redirect & callback tersedia (NextAuth).
- [x] Pembuatan dan validasi `state` (NextAuth) - diuji.
- [x] Penukaran kode → token server-side - diuji dengan PAuS tiruan.
- [x] Userinfo dengan Bearer + validasi identitas (NPM) - diuji.
- [x] Pembuatan sesi lokal dan login - diuji.
- [x] Seluruh alur lewat HTTPS di production (`NEXTAUTH_URL=https://...`).
- [ ] `client_id`/`client_secret` dari DPSI.
- [ ] Uji dengan akun uji asli.

## 7. Menunggu konfirmasi DPSI

- Contoh respons userinfo asli (nama field Paus ID, Nama, NPM).
- Nama field dan nilai penanda alumni → isi `PAUS_ALUMNI_FIELD`.
- URL sign-out yang tepat dan pendaftaran tujuan setelah logout.
- Endpoint dan scope yang berlaku (panduan v1.0 atau endpoint lama).
