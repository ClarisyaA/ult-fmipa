# PAUS Integration - Checklist untuk DPSI

> Dokumen ini ringkas dan siap dibawa ke tim DPSI/PAUS Unpad. Tidak memuat
> credential, secret, token, atau data pribadi. Detail teknis lengkap ada di
> [`docs/paus-integration-audit.md`](paus-integration-audit.md).

## Scope Integrasi

**PAUS pada aplikasi ini hanya digunakan untuk autentikasi mahasiswa.**
Admin dan Staff ULT FMIPA login melalui akun internal (username/password)
yang dikelola sendiri oleh aplikasi ini, bukan melalui PAUS. Ini adalah
keputusan final di sisi kami, bukan sesuatu yang perlu disediakan atau
dikonfirmasi oleh DPSI - kami sebutkan di sini agar permintaan akun uji dan
data di bawah ini jelas konteksnya.

## Informasi Aplikasi

- **Nama aplikasi:** ULT FMIPA Unpad (Unit Layanan Terpadu FMIPA)
- **Framework:** Next.js 16 (App Router) + NextAuth v4
- **Environment yang membutuhkan integrasi PAUS:**
  - Staging: domain belum ditetapkan (`<DOMAIN_STAGING>`)
  - Production: `ult.fmipa.unpad.ac.id` (target; belum final dikonfirmasi
    di sisi infrastruktur)
- **PIC teknis:** `<ISI_PIC_TEKNIS>`
- **PIC DPSI (yang menangani permintaan ini):** `<ISI_PIC_DPSI>`

## Callback URI yang Ingin Didaftarkan

```
Staging:
https://<DOMAIN_STAGING>/api/auth/callback/paus

Production:
https://ult.fmipa.unpad.ac.id/api/auth/callback/paus
```

`paus` adalah provider ID pada implementasi NextAuth kami; path callback di
atas mengikuti konvensi NextAuth v4 (`/api/auth/callback/<provider id>`) dan
sudah diverifikasi dari source code, bukan asumsi.

Localhost (`http://localhost:3000` untuk local development,
`http://localhost:3100` untuk local staging rehearsal) **hanya perlu
dibahas** jika DPSI mengizinkan callback localhost untuk keperluan
developer testing pada client sandbox terpisah. Kami tidak akan
menggunakan credential staging/production untuk ini.

## Credential yang Dibutuhkan

- [ ] Client ID - staging
- [ ] Client Secret - staging
- [ ] Client ID - production
- [ ] Client Secret - production
- [ ] Konfirmasi: apakah staging dan production **wajib** menggunakan
      Client ID berbeda?
- [ ] Prosedur distribusi Client Secret yang aman (bukan email/chat biasa)
- [ ] PIC di sisi DPSI untuk rotasi/revoke credential jika terjadi kebocoran
- [ ] Masa berlaku Client Secret (apakah expired otomatis, perlu rotasi
      berkala?)
- [ ] Apakah credential dapat dirotasi tanpa downtime (mis. dua secret aktif
      sementara selama masa transisi)?

## Endpoint yang Perlu Dikonfirmasi

Endpoint yang sudah kami gunakan (sesuai informasi yang diterima sebelumnya):

| Endpoint | URL yang kami pakai saat ini |
|---|---|
| Authorization | `https://paus.unpad.ac.id/oauth` |
| Token | `https://paus.unpad.ac.id/oauth/access-token` |
| Userinfo | `https://paus.unpad.ac.id/api/` |

- [ ] Konfirmasi ketiga URL di atas masih berlaku dan sama untuk staging
      maupun production (atau ada endpoint terpisah untuk staging?)
- [ ] Apakah ada endpoint **logout/sign-out** resmi? (kami memiliki default
      `https://paus.unpad.ac.id/oauth/sign-out` tapi belum pernah
      diverifikasi/dipakai)
- [ ] Apakah ada endpoint **token revocation**?
- [ ] Apakah PAUS mendukung **OpenID Connect discovery**
      (`/.well-known/openid-configuration`) dan punya **issuer** resmi? Atau
      PAUS murni OAuth 2.0 tanpa OIDC?

## Parameter yang Perlu Dikonfirmasi

- [ ] **Scope**: kami memakai `user.basic` - apakah ini scope yang benar
      dan lengkap untuk mendapatkan nama, NPM/NIP, dan email?
- [ ] **response_type**: kami kirim `code` - dikonfirmasi benar?
- [ ] **grant_type** pada token exchange: kami kirim
      `authorization_code` - dikonfirmasi benar?
- [ ] **Autentikasi client pada token endpoint**: kami kirim `client_id` dan
      `client_secret` di **body POST** (`client_secret_post`,
      `Content-Type: application/x-www-form-urlencoded`). Apakah PAUS
      menerima metode ini, atau mewajibkan **HTTP Basic Authentication**?
- [ ] **Transport access token ke userinfo endpoint**: kami kirim
      `access_token` sebagai **query parameter** URL. Apakah endpoint
      userinfo PAUS juga mendukung/mewajibkan header
      `Authorization: Bearer <token>`?
- [ ] **PKCE**: apakah PAUS mewajibkan atau mendukung PKCE
      (`code_challenge`/`code_verifier`)?
- [ ] **state**: kami mengirim dan memvalidasi `state` secara otomatis
      (bawaan NextAuth) - tidak ada pertanyaan tambahan, hanya konfirmasi
      bahwa PAUS mengembalikan `state` yang sama persis pada callback.
- [ ] **Redirect URI matching**: apakah harus exact match? Case-sensitive?
      Trailing slash berpengaruh? Bisa lebih dari satu URI terdaftar per
      client?

## Contoh Response yang Dibutuhkan

Mohon contoh response JSON yang **sudah disanitasi/dummy** (bukan data
pengguna asli) untuk:

- [ ] Token response (field apa saja yang dikembalikan: `access_token`,
      `token_type`, `expires_in`, `refresh_token`, dll?)
- [ ] Userinfo response untuk akun **mahasiswa** (wajib - ini yang akan
      kami terima di jalur login utama)
- [ ] Userinfo response untuk akun **dosen/staff/tenaga kependidikan**
      (opsional - hanya untuk memastikan aplikasi kami menolak shape
      response ini dengan aman, bukan untuk login berhasil)
- [ ] Contoh response **error** (baik dari authorization endpoint maupun
      token/userinfo endpoint), termasuk kode error untuk: kode tidak
      valid, client salah, token expired

Field spesifik yang ingin kami konfirmasi ada di response userinfo:

- [ ] Field identifier unik permanen (yang tidak berubah seumur akun)
- [ ] **Field NPM (mahasiswa) - exact JSON path.** Ini field wajib bagi
      kami: aplikasi kami menolak login apa pun dari PAUS yang tidak
      memuat NPM yang valid.
- [ ] **Field email mahasiswa - exact JSON path.** Beberapa pertanyaan
      spesifik soal email ada di bagian terpisah di bawah.
- [ ] Field nama lengkap - exact JSON path.
- [ ] Field NIP (dosen/staff) - hanya relevan bagi kami sebagai penanda
      "bukan mahasiswa" untuk skenario negative test (lihat "Testing
      Support"); **kami tidak menggunakan NIP untuk memberi role apa pun**
      di aplikasi kami.
- [ ] Field fakultas/unit (mahasiswa)
- [ ] Field program studi (mahasiswa)
- [ ] Field yang membedakan tipe pengguna (mahasiswa vs dosen vs staff vs
      alumni) - shape response untuk masing-masing tipe
- [ ] Field status keaktifan (aktif/cuti/lulus/nonaktif) jika ada
- [ ] Apakah NPM/email dapat berubah di kemudian hari untuk akun yang
      sama? Bagaimana kami sebaiknya menangani perubahan tersebut?
- [ ] Bagaimana alumni ditangani setelah lulus - apakah masih bisa login
      via PAUS sebagai mahasiswa, atau harus ditolak?
- [ ] Apakah satu orang bisa memiliki lebih dari satu identifier PAUS
      (mis. dosen yang juga alumni)? (Konteks: tidak mengubah keputusan
      kami - identifier semacam itu tetap tidak akan memberi role Staff/
      Admin di aplikasi kami, tapi membantu kami memahami data yang
      diterima.)

### Pertanyaan spesifik soal email mahasiswa

- [ ] Apakah endpoint userinfo **selalu** mengirim email mahasiswa, atau
      bisa kosong?
- [ ] Apa **exact JSON path** untuk email pada response userinfo? Apakah
      field bernama `email` di level teratas (top-level), seperti yang
      sudah kami asumsikan dari respons yang pernah kami terima
      sebelumnya, atau field lain / nested di dalam struktur `attributes`?
- [ ] Apakah email termasuk dalam scope `user.basic` yang sudah kami
      pakai, atau perlu scope tambahan?
- [ ] Apakah email yang dikembalikan sudah terverifikasi (verified) oleh
      pihak Unpad?
- [ ] Apa yang terjadi/dikembalikan jika mahasiswa tidak memiliki email
      terdaftar - field kosong, field hilang, atau error?
- [ ] Apakah email mahasiswa dapat berubah di kemudian hari?

**Catatan:** email **bukan** syarat login di aplikasi kami - hanya NPM yang
wajib. Kami akan memetakan email jika tersedia, dan login tetap berhasil
jika email kosong. Pertanyaan di atas hanya untuk memastikan pemetaan field
kami akurat, bukan untuk menentukan apakah login diizinkan.

## Testing Support

**Akun uji yang dibutuhkan:**

Positive test (wajib):

- [ ] Minimal 1 akun mahasiswa aktif untuk uji login berhasil.
- [ ] Sebaiknya 1 akun mahasiswa dengan profil lengkap (NPM, nama, email
      terisi) agar kami bisa memverifikasi pemetaan field secara menyeluruh.

Negative test (opsional, hanya untuk memverifikasi penolakan berjalan
benar - **bukan** untuk login berhasil sebagai Staff/Admin di aplikasi
kami):

- [ ] Opsional: 1 akun non-mahasiswa/dosen (yang profilnya hanya memiliki
      NIP, tanpa NPM) untuk memastikan aplikasi kami **menolak** login
      tersebut dengan aman (aplikasi kami mewajibkan NPM untuk sesi PAUS
      apa pun).

**Mohon tidak menyediakan akun Staff/Admin untuk keperluan login PAUS** -
tidak relevan dengan kebutuhan kami, karena Staff/Admin tidak pernah login
melalui PAUS di aplikasi ini.

- [ ] Apakah tersedia sandbox/test client terpisah dari production?
- [ ] Bagaimana cara mensimulasikan akun yang tidak aktif/nonaktif untuk
      pengujian?
- [ ] Siapa PIC teknis DPSI selama masa UAT (User Acceptance Testing)?
- [ ] Format/kanal pelaporan error yang diharapkan selama masa integrasi?
- [ ] Apakah tersedia dokumentasi resmi PAUS OAuth (Swagger/Postman
      collection/dokumen PDF)?
- [ ] Apakah IP server (VPS staging/production) kami perlu di-whitelist di
      sisi PAUS?
- [ ] Apakah ada header/User-Agent tertentu yang wajib kami kirim?
- [ ] Apakah domain staging kami wajib sudah HTTPS aktif sebelum
      didaftarkan, atau bisa didaftarkan lebih dulu?

## Token Lifecycle

- [ ] Berapa lama masa berlaku (`expires_in`) access token?
- [ ] Apakah refresh token tersedia? Jika ya, berapa lama masa berlakunya?
- [ ] Apakah access token boleh kami simpan (server-side) untuk dipakai
      ulang, atau hanya boleh dipakai sekali saat login?
- [ ] Apakah ada rate limit pada endpoint authorization/token/userinfo yang
      perlu kami ketahui?

## Catatan Internal (tidak perlu dijawab DPSI, hanya konteks)

Aplikasi kami juga memiliki mekanisme terpisah bernama "PAUS Bridge" - ini
**bukan** bagian dari integrasi OAuth yang sedang kami koordinasikan di
sini. Mekanisme itu adalah jembatan HMAC-signed token dari sistem legacy
internal kami sendiri, tidak melibatkan endpoint PAUS sama sekali. Kami
sebutkan agar tidak menimbulkan kebingungan jika istilah "PAUS" muncul di
kode kami dalam dua konteks berbeda.
