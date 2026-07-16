# Requirements Traceability Matrix

## Core Traceability

| Requirement | Acceptance criteria | Manual test | Unit/API/Integration | Playwright | NFR | Status | Notes |
|---|---|---|---|---|---|---|---|
| Auth and role protection | AC-AUTH-001..003 | TC-AUTH-001..003 | auth/proxy/API tests | E2E-AUTH-001..002 | security | Partially covered | Existing `auth.spec.ts`; expand API coverage. |
| Service catalog and whitelist | AC-SERVICE-001, AC-SERVICE-003 | TC-SERVICE-001 | legacy-services unit, route API | E2E-SERVICE-001 | security/data integrity | Partially covered | Existing service catalog matrix. |
| Service submission | AC-SERVICE-002 | TC-SERVICE-002..003 | submissions integration | E2E-SERVICE-002..003 | reliability | Partially covered | Existing student/full-service specs need more negative cases. |
| Student ownership | AC-STUDENT-001 | TC-STUDENT-001 | student API tests | E2E-STUDENT-001 | security/privacy | Planned | Critical IDOR coverage missing. |
| Admin/staff request handling | AC-REQUEST-001..002 | TC-REQUEST-001..003 | request API/status tests | E2E-ADMIN-001, E2E-STAFF-001 | privacy/performance | Partially covered | Existing admin-staff request spec. |
| Printable services | AC-PRINT-001..002 | TC-PRINT-001..002 | metadata/PDF API tests | E2E-PRINT-001 | PDF perf/a11y | Planned | Manual PDF visual approval needed. |
| SIK workflow | AC-SIK-001..003 | TC-SIK-001..003 | SIK API tests | E2E-SIK-001 | security/reliability | Partially covered | Existing SIK spec; add negative cases. |
| Activity CMS | AC-CMS-ACTIVITY-001 | TC-CMS-001 | home activity API/upload tests | E2E-CMS-ACT-001 | storage | Planned | Needs image replacement/missing-file E2E. |
| Information CMS | AC-CMS-INFO-001..002 | TC-CMS-002..003 | information API/upload tests | E2E-CMS-INFO-001 | storage/cache | Planned | Recent image replacement should be regression tested. |
| Profile CMS | AC-CMS-PROFILE-001 | TC-CMS-004 | profile API/storage tests | E2E-CMS-PROFILE-001 | responsive | Planned | Public tree/layout needs screenshot checks. |
| Service suggestions | AC-SUGGESTION-001 | TC-SUGGESTION-001 | suggestion API tests | E2E-SUG-001 | privacy | Planned | Public/staff/admin matrix needed. |
| Surveys | AC-SURVEY-001 | TC-SURVEY-001 | survey API tests | E2E-SURVEY-001 | privacy | Partially covered | Existing survey spec is load-focused. |
| System users/password | AC-SYSTEM-001 | TC-SYSTEM-001 | user API/password hash tests | E2E-SYSTEM-001 | security | Planned | No current E2E found for reset. |
| Safe errors/uploads | AC-SEC-001 | TC-SEC-001 | error/storage/upload unit/API | E2E-NFR-001 | security/reliability | Planned | Needs fault-injection harness. |
| Responsive/accessibility | AC-NFR-001..002 | TC-NFR-001..002 | component tests | E2E-RESP-001, E2E-TUTORIAL-001 | a11y/responsive | Planned | Manual baseline required. |

## Service Traceability

| Service slug | Source table | AC | Manual/API | Playwright | Status |
|---|---|---|---|---|---|
| kartu-prestasi-akademik | kpa | AC-SERVICE-001..003 | TC-SERVICE-001..003 | E2E-SERVICE-003 | Planned |
| kartu-kemajuan-studi | kks | AC-SERVICE-001..003 | TC-SERVICE-001..003 | E2E-SERVICE-003 | Planned |
| rekomendasi-beasiswa | beasiswa | AC-SERVICE-001..003 | TC-SERVICE-001..003 | E2E-SERVICE-003 | Planned |
| ket-tunjangan-orang-tua | masih_kuliah | AC-SERVICE-002, AC-PRINT-002 | TC-SERVICE-003, TC-PRINT-002 | E2E-SERVICE-003, E2E-PRINT-001 | Planned |
| keterangan-masih-kuliah | masih_kuliah_aktif | AC-SERVICE-002, AC-PRINT-002 | TC-SERVICE-003, TC-PRINT-002 | E2E-SERVICE-003, E2E-PRINT-001 | Planned |
| keterangan-kelakuan-baik | kelakuan_baik | AC-SERVICE-002, AC-PRINT-002 | TC-SERVICE-003, TC-PRINT-002 | E2E-SERVICE-003, E2E-PRINT-001 | Planned |
| surat-pengantar | surat_pengantar | AC-SERVICE-002 | TC-SERVICE-003 | E2E-SERVICE-003 | Planned |
| permohonan-magang-kerja-praktek-ta | permohonan_magang | AC-SERVICE-002, AC-PRINT-002 | TC-SERVICE-003, TC-PRINT-002 | E2E-SERVICE-003, E2E-PRINT-001 | Planned |
| surat-izin-kegiatan | surat_izin_kegiatan | AC-SIK-001..003 | TC-SIK-001..003 | E2E-SIK-001 | Partially covered |
| keterangan-lulus | keterangan_lulus | AC-SERVICE-002, AC-PRINT-002 | TC-SERVICE-003, TC-PRINT-002 | E2E-SERVICE-003, E2E-PRINT-001 | Planned |
| penerbitan-transkrip | transkrip | AC-SERVICE-002 | TC-SERVICE-003 | E2E-SERVICE-003 | Planned |
| penerbitan-ijazah | ijazah | AC-SERVICE-002 | TC-SERVICE-003 | E2E-SERVICE-003 | Planned |
| legalisir-ijazah-transkrip | legalisir | AC-SERVICE-002 | TC-SERVICE-003 | E2E-SERVICE-003 | Planned |
| bebas-peminjaman | bebas_pinjaman | AC-SERVICE-002 | TC-SERVICE-003 | E2E-SERVICE-003 | Planned |
| unggah-karya-ilmiah | unggah_karya_ilmiah | AC-SERVICE-002 | TC-SERVICE-003 | E2E-SERVICE-003 | Planned |
| cek-plagiarisme | plagiarisme | AC-SERVICE-002 | TC-SERVICE-003 | E2E-SERVICE-003 | Planned |
| referensi | referensi | AC-SERVICE-002 | TC-SERVICE-003 | E2E-SERVICE-003 | Planned |

