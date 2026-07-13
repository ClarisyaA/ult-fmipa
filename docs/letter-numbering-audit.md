# Letter Numbering Audit

Tanggal audit: 13 Juli 2026

## Scope

Audit ini hanya memetakan perilaku legacy terkait nomor surat sebelum fitur auto-numbering dibuat di aplikasi Next.js. Tidak ada perubahan database, schema, migration, PDF template, wording resmi, metadata editor, UI, atau homepage.

Layanan yang diaudit:

- `keterangan-lulus`
- `ket-tunjangan-orang-tua`
- `keterangan-masih-kuliah`
- `keterangan-kelakuan-baik`

## Source Files Inspected

Legacy PHP:

- `ULT-Lama/layanan_staf/keterangan_lulus_add.php`
- `ULT-Lama/layanan_staf/keterangan_lulus_edit.php`
- `ULT-Lama/layanan_staf/keterangan_lulus_cetak.php`
- `ULT-Lama/layanan_staf/masih_kuliah_add.php`
- `ULT-Lama/layanan_staf/masih_kuliah_edit.php`
- `ULT-Lama/layanan_staf/masih_kuliah_cetak.php`
- `ULT-Lama/layanan_staf/masih_kuliah_aktif_add.php`
- `ULT-Lama/layanan_staf/masih_kuliah_aktif_edit.php`
- `ULT-Lama/layanan_staf/masih_kuliah_aktif_cetak.php`
- `ULT-Lama/layanan_staf/kelakuan_baik_add.php`
- `ULT-Lama/layanan_staf/kelakuan_baik_edit.php`
- `ULT-Lama/layanan_staf/kelakuan_baik_cetak.php`
- `ULT-Lama/layanan_staf/core/classes/Keterangan_Lulus.php`
- `ULT-Lama/layanan_staf/core/classes/Masih_Kuliah.php`
- `ULT-Lama/layanan_staf/core/classes/Masih_Kuliah_Aktif.php`
- `ULT-Lama/layanan_staf/core/classes/Kelakuan_Baik.php`
- `ULT-Lama/layanan_staf/core/classes/Surat_Keluar.php`
- `ULT-Lama/layanan_staf/surat_keluar_list.php`
- `ULT-Lama/layanan_staf/core/connect/database.php`
- `ULT-Lama/layanan_staf/core/init.php`
- `ULT-Lama/fmipa_sbpk.sql`

Current Next.js:

- `prisma/schema.prisma`
- `src/lib/letters/letter-metadata.ts`
- `src/components/requests/letter-metadata-editor.tsx`

## Executive Finding

Untuk empat layanan printable yang sudah dimigrasikan, legacy tidak ditemukan melakukan auto-generate nomor surat. Nomor surat diinput manual melalui field `nomor_surat`, lalu disimpan langsung ke kolom snapshot `TTD_NO_SURAT` pada tabel request masing-masing.

File cetak legacy hanya membaca `TTD_NO_SURAT` dan merendernya sebagai nomor surat. Tidak ditemukan insert otomatis ke `surat_keluar`, tidak ditemukan pemakaian sequence table pada proses add/edit empat layanan, dan tidak ditemukan mekanisme lock/transaction untuk mencegah duplikasi nomor pada flow layanan tersebut.

Ada integrasi legacy bernama `Surat_Keluar.php`, tetapi class itu hanya membaca tabel eksternal `no_surat` melalui koneksi database `surat_keluar`. Koneksi tersebut dikomentari di `core/connect/database.php`, dan instansiasi `$surat_keluar` juga dikomentari di `core/init.php`. Jadi, untuk scope layanan ini, integrasi tersebut terlihat read-only/disconnected dan bukan sumber auto-numbering yang aktif.

## Table And File Map

| Area | Object | Finding |
| --- | --- | --- |
| Request snapshot | `keterangan_lulus.TTD_NO_SURAT` | Diisi manual dari form `nomor_surat`, dipakai oleh print. |
| Request snapshot | `masih_kuliah.TTD_NO_SURAT` | Diisi manual dari form `nomor_surat`, dipakai oleh print. |
| Request snapshot | `masih_kuliah_aktif.TTD_NO_SURAT` | Diisi manual dari form `nomor_surat`, dipakai oleh print. |
| Request snapshot | `kelakuan_baik.TTD_NO_SURAT` | Diisi manual dari form `nomor_surat`, dipakai oleh print. |
| Master signer | `surat_ttd` | Dipakai untuk identitas penandatangan, bukan sequence nomor surat. |
| Jenis surat | `surat_jenis` | Berisi label jenis seperti `Surat Keterangan`, `Surat Pengantar`, `Surat Rekomendasi`. Tidak ditemukan dipakai oleh flow numbering empat layanan. |
| Surat keluar main DB | `surat_keluar` | Ada di dump dan Prisma schema, tetapi records di dump kosong. Tidak ditemukan ditulis oleh add/edit/print empat layanan. |
| Surat keluar eksternal | `no_surat` | Dibaca oleh `Surat_Keluar.php` sebagai `no_surat_lkp`, tetapi tabel ini tidak ada di dump `fmipa_sbpk.sql` dan koneksi eksternal tampak dikomentari. |

## Answers To Audit Questions

1. Legacy untuk empat layanan ini menggunakan input manual nomor surat.
2. Tidak ditemukan table running number yang dipakai oleh flow empat layanan. Tabel eksternal `no_surat` menyimpan nomor lengkap, tetapi hanya terlihat pada integrasi read-only/disconnected.
3. Ada dua kandidat riwayat surat keluar: `surat_keluar` pada main DB dan `no_surat` pada database eksternal `surat_keluar`.
4. Print action empat layanan tidak ditemukan melakukan insert ke `surat_keluar`.
5. Metadata add/edit empat layanan tidak ditemukan melakukan insert ke `surat_keluar`.
6. Untuk empat layanan ini, nomor surat resmi yang dicetak tersimpan di `TTD_NO_SURAT`.
7. `TTD_NO_SURAT` terlihat diketik manual, bukan generated dari `no_surat`.
8. Format contoh yang ditemukan bervariasi, misalnya `3961/UN6.D.1/PP/2015`, `4804/UN6.D/PK.05.00/2026`, `7354/UN6.D.1/KM.00.00/2025`, dan `1246/UN6.D.1/KM.00.00/2026`.
9. Bagian format yang tampak dinamis: running number, unit code, classification code, dan tahun. Service type tidak tampak dihitung oleh kode legacy empat layanan.
10. Reset tahunan terindikasi dari pola data, tetapi tidak ditemukan kode reset tahunan pada flow empat layanan.
11. Tidak ditemukan bukti reset per `surat_jenis` pada flow empat layanan.
12. Tidak ditemukan transaction/lock untuk mencegah nomor ganda pada flow empat layanan.
13. Tidak ditemukan duplicate prevention untuk `TTD_NO_SURAT` pada flow empat layanan.
14. Kemungkinan nomor lama mengikuti sequence surat fakultas yang lebih luas, tetapi tidak bisa dipastikan karena sumber eksternal `no_surat` tidak tersedia di schema/dump aktif.
15. Empat layanan kemungkinan masuk kategori `Surat Keterangan`, tetapi mapping kode klasifikasi resmi harus dikonfirmasi ke ULT/FMIPA sebelum auto-numbering.

## Number Format Examples

Contoh berikut hanya format nomor surat, tanpa nama atau NPM.

- `3961/UN6.D.1/PP/2015`
- `4211/UN6.D1/PP/2015`
- `3904/UN6.D.2.1/KM/2015`
- `4119/UN6.D.1/PP/2015`
- `4804/UN6.D/PK.05.00/2026`
- `4813/UN6.D.1/PK.05.02/2026`
- `7354/UN6.D.1/KM.00.00/2025`
- `7261/UN6.D.1/KM.00.01/2026`
- `1246/UN6.D.1/KM.00.00/2026`
- `2274/UN6.D.1/KM.00.00/2026`

Data legacy juga menunjukkan variasi kualitas input manual, seperti whitespace awal, format yang tidak lengkap, missing slash, typo titik/koma, dan nomor yang tampak duplicate. Ini memperkuat kesimpulan bahwa nomor tidak sepenuhnya dikendalikan generator legacy pada flow empat layanan.

## Service Mapping

| Service slug | Request table | Legacy print file | Number field | Likely jenis | Example patterns | Auto-numbering later |
| --- | --- | --- | --- | --- | --- | --- |
| `keterangan-lulus` | `keterangan_lulus` | `keterangan_lulus_cetak.php` | `TTD_NO_SURAT` | `Surat Keterangan` | `3961/UN6.D.1/PP/2015`, `4804/UN6.D/PK.05.00/2026` | Yes, after official mapping is confirmed. |
| `ket-tunjangan-orang-tua` | `masih_kuliah` | `masih_kuliah_cetak.php` | `TTD_NO_SURAT` | `Surat Keterangan` | `4211/UN6.D1/PP/2015`, later likely `KM.00.00` family | Yes, after official mapping is confirmed. |
| `keterangan-masih-kuliah` | `masih_kuliah_aktif` | `masih_kuliah_aktif_cetak.php` | `TTD_NO_SURAT` | `Surat Keterangan` | `3904/UN6.D.2.1/KM/2015`, `7354/UN6.D.1/KM.00.00/2025` | Yes, after official mapping is confirmed. |
| `keterangan-kelakuan-baik` | `kelakuan_baik` | `kelakuan_baik_cetak.php` | `TTD_NO_SURAT` | `Surat Keterangan` | `4119/UN6.D.1/PP/2015`, `1246/UN6.D.1/KM.00.00/2026` | Yes, after official mapping is confirmed. |

## Current Next.js State

Current app behavior is aligned with the legacy finding:

- `Data Surat` lets admin/staff manually edit `TTD_NO_SURAT`.
- PDF route reads snapshot `TTD_NO_SURAT` from request row.
- Signer picker reads `surat_ttd`, but does not generate nomor surat.
- No current code writes `surat_keluar` or `no_surat` for the four printable services.

This is safer than introducing auto-numbering without official sequence and registry confirmation.

## Phase 5B Implementation Notes

Phase 5B keeps manual numbering and adds safety around `TTD_NO_SURAT`.

Implemented behavior:

- `TTD_NO_SURAT` is trimmed on save.
- Internal official formatting characters such as `/`, `.`, `-`, and spaces are preserved.
- The app does not auto-format, uppercase, lowercase, or generate letter numbers.
- Newline/control characters are rejected for `TTD_NO_SURAT`.
- Duplicate detection checks only the four printable request tables and is warning-only.
- Duplicate warning does not block save or PDF rendering.
- Existing non-empty `TTD_NO_SURAT` requires confirmation before it can be replaced with a different non-empty number.
- PDF continues to read the saved snapshot value from the request row.
- No write is made to `surat_keluar`.
- No `no_surat` integration was added.
- No schema or migration was added.

This phase intentionally does not solve official sequencing. It only makes manual entry safer until ULT/FMIPA confirms the authoritative numbering source and format.

## Risk Analysis

- Duplicate nomor surat if two staff generate at the same time without lock or unique check.
- Accidental overwrite of existing `TTD_NO_SURAT`, changing historical PDFs.
- Mismatch between request snapshot `TTD_NO_SURAT` and a future `surat_keluar` / `no_surat` registry.
- Old letters changing if auto-numbering regenerates existing records.
- Missing official mapping for service to `surat_jenis`, unit code, and classification code.
- Format mismatch because legacy data spans older `PP`, `KM`, `PK.05.00`, and `PK.05.02` patterns.
- External `no_surat` source is not present in current schema/dump and may still be the real production authority.
- MariaDB concurrency risk if sequence is implemented with read-max-plus-one without transaction lock.
- No current unique constraint on `TTD_NO_SURAT` in request tables.
- Audit and rollback need clear rules if number generation succeeds but request update fails, or vice versa.
- Existing dirty data needs preservation; cleanup must not silently rewrite old official numbers.

## Recommended Implementation Plan

### Phase 5B - Manual Numbering Support Cleanup

Keep `TTD_NO_SURAT` manually editable. Improve safety around manual entry before any generator exists.

Likely files:

- `src/lib/letters/letter-metadata.ts`
- `src/components/requests/letter-metadata-editor.tsx`
- `docs/print-template-migration.md`

API route idea:

- Reuse existing `PATCH /api/requests/[serviceSlug]/[id]/letter-metadata`

Risk level: low.

Validation steps:

- Trim `TTD_NO_SURAT`.
- Reject empty number when marking print-ready.
- Show read-only duplicate warning without blocking legacy data.
- Require overwrite confirmation when replacing a non-empty number.
- Never auto-change existing numbers.

Manual QA:

- Save manual number.
- Confirm PDF uses the exact saved snapshot.
- Confirm old records are not rewritten.
- Confirm unsupported services remain unchanged.

### Phase 5C - Draft Auto-Number Preview

Add a preview-only generator. It should not save the generated number until the staff/admin explicitly confirms.

Likely files:

- New server helper under `src/lib/letters/`
- Optional API route under `/api/letters/number-preview`
- `src/components/requests/letter-metadata-editor.tsx`
- Documentation

API route idea:

- `POST /api/requests/[serviceSlug]/[id]/letter-number/preview`

Risk level: medium.

Validation steps:

- Require admin/staff.
- Reject unsupported services.
- Do not overwrite non-empty `TTD_NO_SURAT` without explicit confirmation.
- Display proposed number and format parts.
- Keep manual override.

Manual QA:

- Preview for each supported service.
- Confirm preview does not mutate DB.
- Confirm existing `TTD_NO_SURAT` remains unchanged until save.

### Phase 5D - Transactional Save

Generate and save nomor surat in one transaction, then update request snapshot and write registry if official flow requires it.

Likely files:

- New numbering service under `src/lib/letters/`
- API route under `/api/requests/[serviceSlug]/[id]/letter-number`
- Existing metadata/update helpers
- Audit log helper if available

API route idea:

- `POST /api/requests/[serviceSlug]/[id]/letter-number`

Risk level: high.

Validation steps:

- Use transaction.
- Lock the sequence source.
- Re-check request row inside transaction.
- Do not overwrite existing `TTD_NO_SURAT` unless explicit override is allowed.
- Write `surat_keluar` or external registry only after official target is confirmed.
- Add audit log without sensitive payload.
- Handle rollback safely.

Manual QA:

- Two simultaneous requests cannot receive the same number.
- Failed transaction does not partially update request snapshot.
- PDF uses generated snapshot after save.
- Registry row, if implemented, matches `TTD_NO_SURAT`.

### Phase 5E - Admin Configuration

Manage service-to-letter-kind mapping in the app once official policy is confirmed.

Likely files:

- New config helper under `src/lib/letters/`
- Admin system page if required later
- Documentation

API route idea:

- Defer until configuration requirements are confirmed.

Risk level: medium to high.

Validation steps:

- Restrict to admin.
- Preserve audit trail.
- Avoid changing historical records when mapping changes.

Manual QA:

- Mapping changes affect only future generated numbers.
- Existing snapshots remain stable.

## Open Questions For ULT/FMIPA Staff

- What is the official current format for each of the four printable services?
- Is the authoritative running number managed by a central faculty `surat_keluar` system?
- Is the external `no_surat` database still active in production?
- Should numbers be reserved when metadata is saved, when status is processed, or only when printing?
- Should the four services all use `Surat Keterangan`, or do some require a different `surat_jenis`?
- Which unit code and classification code should be used for each service?
- Is the sequence global across all faculty letters, per year, per unit, per classification, or per service?
- Are old malformed or duplicate numbers expected to remain as historical records?
- Who is allowed to generate or overwrite a nomor surat?
- What is the rollback policy if registry write succeeds but PDF metadata save fails?

## Phase 5A Validation

- Only documentation was created for this phase.
- No app source code was changed.
- No Prisma schema or migration was changed.
- No database mutation was performed.
- No generated PDFs or screenshots were committed.
