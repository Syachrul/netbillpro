# Artifact Register

**ID:** ART-NETBILL-001    **Versi:** 0.1 (DRAFT)    **Tanggal:** 15 November 2026

Register ini membedakan **keberadaan di paket kerja** dari **keberadaan terverifikasi di repositori**. Tidak ada artefak yang berstatus selesai tanpa bukti.

| Status | Arti |
| :--- | :--- |
| `PROVIDED-DRAFT` | Berkas ada di paket hasil kerja, belum disetujui, belum diverifikasi di repo |
| `TEMPLATE-ONLY` | Hanya template di Playbook §14, belum ada isi final |
| `NOT-PROVIDED` | Belum dibuat |
| `UNVERIFIED` | Ada klaim keberadaan, tetapi tidak ada bukti pada dokumen yang tersedia |
| `BLOCKED` | Menunggu keputusan/rekonsiliasi |

| ID | Kelompok | Artefak | Prio | Status | Lokasi | Catatan |
| :--- | :--- | :--- | :---: | :--- | :--- | :--- |
| ART-001 | Governance | CLAUDE.md / AGENTS.md | P1 | **PROVIDED-DRAFT** | `CLAUDE.md` (paket) | Versi 2 memuat otorisasi Design/Implementation/Release, lokasi Prisma, protected constraints. Bandingkan dengan berkas di repo sebelum mengganti |
| ART-002 | Governance | do-not-do.md | P1 | **PROVIDED-DRAFT** | `do-not-do.md` (paket) | v2 menggantikan v1 (alasan + penegak + butir Prisma/TRUNCATE/data asli) |
| ART-003 | Governance | decisions.log | P1 | **BLOCKED** | (tidak diunggah) | Tiga skema ID bersaing (lihat `governance-alignment.md` §3). Owner memilih satu |
| ART-004 | Governance | STATE.md | P1 | **BLOCKED** | `STATE.md` (paket) | Dua sumber status saling bertentangan (lihat `governance-alignment.md` §4). Rekonsiliasi dengan `git log` dulu |
| ART-005 | Governance | artifact-register.md | P1 | **PROVIDED-DRAFT** | berkas ini |  |
| ART-006 | Governance | traceability-matrix.md | P1 | **PROVIDED-DRAFT** | `traceability-matrix.md` (paket) | Dihasilkan dari 67 FR/MOB di PRD v1.2. Kolom Code kosong |
| ART-007 | Business | PRD | P1 | **PROVIDED-DRAFT** | `PRD-RTRW-2026-001_v1_2.md` | Perubahan E-2, E-5, E-7 adalah **USULAN** sampai Owner menyetujui di decisions.log |
| ART-008 | Business | OQ register | P1 | **PROVIDED-DRAFT** | PRD v1.2 §15 | FINAL: OQ-1,3,5,6. DEFAULT (usulan): OQ-2,4,7,8,9,10,11 |
| ART-009 | Architecture | TDD | P1 | **UNVERIFIED** | (tidak diunggah) | `TDD-Amendment-Notes.md` memberi perubahan persis. TDD tidak boleh dianggap konsisten sebelum diterapkan |
| ART-010 | Architecture | ADR register + berkas ADR | P1 | **PROVIDED-DRAFT** | `ADR-Register.md`, `adr/ADR-0001..0022.md` | ADR-04 dan ADR-14 masih Diusulkan (prasyarat C3) |
| ART-011 | Architecture | Data dictionary | P2 | **PROVIDED-DRAFT** | `netbill-pro/docs/data-dictionary.md` (folder parsial) | Dibuat dari desain TDD, **belum dicocokkan dengan skema Prisma aktual** |
| ART-012 | Architecture | Glossary | P2 | **PROVIDED-DRAFT** | `glossary.md` (paket) | v2 |
| ART-013 | Feature | Spec ledger/alokasi/void/saldo awal/refund | P1 | **PROVIDED-DRAFT** | `ledger/SPEC-LEDGER-001_v1_1.md` | Menutup 10 FR (lihat matriks) |
| ART-014 | Feature | Spec billing generator + penomoran invoice | P1 | **NOT-PROVIDED** | - | Hanya desain di TDD §8.4-8.5. Perlu spec + vektor (FR-BIL-09 belum punya vektor) |
| ART-015 | Feature | Spec payments (persetujuan void, setoran kolektor, input pembayaran) | P1 | **NOT-PROVIDED** | - | Sebagian aturan ada di SPEC-LEDGER §3.5-3.6 |
| ART-016 | Feature | Spec auth / RBAC / OTP | P1 | **NOT-PROVIDED** | - | Ada di PRD §3 dan TDD §13 tetapi belum berbentuk spec dengan contoh berangka |
| ART-017 | Testing | Vektor ledger (18) | P1 | **PROVIDED-DRAFT** | `ledger/ledger-vectors.json` | Lulus pada model referensi. **Belum** diuji pada kode nyata |
| ART-018 | Testing | Model referensi + uji properti + uji mutasi | P1 | **PROVIDED-DRAFT** | `ledger/reference-model/` | Diverifikasi lokal (18/18, 3 seed, 2 mutasi tertangkap) |
| ART-019 | Testing | Negative cases N-1..N-13 | P1 | **PROVIDED-DRAFT** | SPEC-LEDGER §8.1 |  |
| ART-020 | Testing | Concurrency test spec (berdiri sendiri) | P1 | **NOT-PROVIDED** | - | Sebagian di T12a/b dan AC-L3/L4 |
| ART-021 | Testing | Test data catalog | P1 | **NOT-PROVIDED** | - | **Wajib sintetis**; tanpa data pelanggan asli |
| ART-022 | Testing | Pemeriksa cakupan vektor | P1 | **PROVIDED-DRAFT** | `tools/check-vector-coverage.mjs` | Diuji pada simulasi 16 tes lama |
| ART-023 | API | openapi.yaml | P2 | **NOT-PROVIDED** | - | Hanya katalog endpoint (TDD §6.2) |
| ART-024 | Integration | Skema event | P2 | **BLOCKED** | - | Menunggu ADR-15 dan katalog event final |
| ART-025 | Module | README per modul | P1 | **PROVIDED-DRAFT** | `netbill-pro/modules/*/README.md` (folder parsial) | 14 berkas. Pilih lokasi tunggal: `docs/modules/<x>/` (usulan dokumen DEV) atau `modules/<x>/` |
| ART-026 | CI/CD | Gerbang CI (CI-01..CI-21) | P1 | **UNVERIFIED** | `governance-alignment.md` §2 | Register ID ada; implementasi di repo belum terbukti |
| ART-027 | CI/CD | Dependency allowlist | P1 | **NOT-PROVIDED** | - |  |
| ART-028 | CI/CD | Kebijakan secret scanning | P1 | **NOT-PROVIDED** | - | Hanya disebut (gitleaks) |
| ART-029 | Repository | CODEOWNERS | P1 | **TEMPLATE-ONLY** | Playbook §14.5 | Berisi placeholder. Wajib diganti akun GitHub valid |
| ART-030 | Repository | PR template | P1 | **TEMPLATE-ONLY** | Playbook §14.4 |  |
| ART-031 | Repository | Branch protection | P1 | **UNVERIFIED** | - | Tidak ada bukti |
| ART-032 | Quality | Golden examples | P2 | **PROVIDED-DRAFT** | `netbill-pro/docs/golden-examples.md` (folder parsial) | Belum diimplementasikan sebagai kode |
| ART-033 | Quality | Kebijakan mutation testing | P1 | **NOT-PROVIDED** | - | Usulan ambang ≥ 70% (AC-L8). Belum ada konfigurasi Stryker |
| ART-034 | Operations | Runbook backup/restore | P1 | **NOT-PROVIDED** | - | Hanya kebijakan di TDD §14.4 |
| ART-035 | Operations | Runbook migrasi/pemulihan | P1 | **NOT-PROVIDED** | - | Hanya rencana di TDD §18 |
| ART-036 | Security | Kebijakan penggunaan alat AI | P1 | **PROVIDED-DRAFT** | `netbill-pro/docs/ai-usage-policy.md` (folder parsial) |  |
| ART-037 | Governance | Amandemen Playbook | P1 | **PROVIDED-DRAFT** | `PLAYBOOK-Amendment-Notes.md` | P1-P18 |

**Ringkasan:** BLOCKED: 3, NOT-PROVIDED: 11, PROVIDED-DRAFT: 18, TEMPLATE-ONLY: 2, UNVERIFIED: 3 (total 37).

**Catatan folder parsial:** `netbill-pro/` adalah hasil kerja sebelumnya yang **tidak selesai** dan memakai penomoran keputusan serta status ADR yang berbeda dari repo Anda. Berkas di dalamnya hanya rujukan, bukan sumber kebenaran. Yang bernilai dipindahkan ke daftar ini dengan status di atas.

**Aturan pemutakhiran:** ubah status hanya bersama bukti (hash commit, laporan CI, atau catatan review) pada kolom Catatan.
