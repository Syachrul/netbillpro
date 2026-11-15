# Governance Alignment: Penyelarasan Tata Kelola Pengembangan

**ID:** GOV-NETBILL-001    **Versi:** 0.1 (DRAFT, menunggu persetujuan Owner)    **Tanggal:** 15 November 2026
**Tujuan:** menyatukan istilah, gerbang, model otorisasi, dan skema ID yang saat ini ada dalam beberapa versi di dokumen proyek. Dokumen ini **tidak mengubah** PRD/TDD.

## 1. Model Otorisasi (diadopsi dari usulan DEV-RTRW, dengan penyesuaian)

| Otorisasi | Mengizinkan | Tidak otomatis mengizinkan | Dicatat di |
| :--- | :--- | :--- | :--- |
| **DESIGN** | Menyusun rancangan, spec, dokumen | Implementasi | `decisions.log` |
| **IMPLEMENTATION** | Menulis kode/tes untuk **satu tahap/tugas** yang disebut | Tahap berikutnya; perubahan di luar tugas; release | `decisions.log` + `STATE.md` (Current Task) |
| **RELEASE** | Push ke remote/merge ke `main`/deploy | - | `decisions.log` |

Tiga kondisi harus dibuktikan **terpisah**, tidak saling menggantikan:

| Kondisi | Bukti |
| :--- | :--- |
| **CI PASS** | Laporan CI semua gerbang yang berlaku |
| **Human Review ACCEPTED** | Catatan review (zona merah: 2 reviewer, atau 1 reviewer + checklist) |
| **Release Authorization GRANTED** | Entri tertulis Owner |

## 2. Register Gerbang CI

CI-01..CI-15 adalah ID dari usulan DEV-RTRW (dipertahankan). CI-16..CI-21 adalah tambahan dari review (Playbook P1).

| ID | Gerbang | Bukti wajib | Catatan |
| :--- | :--- | :--- | :--- |
| CI-01 | Strict typecheck | Laporan typecheck | |
| CI-02 | Project lint | Laporan lint | Termasuk aturan khusus (uang, `Clock`, `.skip`) |
| CI-03 | Module boundary | Laporan dependency check | |
| CI-04 | Unit/integrasi | Laporan tes | Postgres nyata (Testcontainers) |
| CI-05 | Skenario ledger | **S1-S8, T9-T15, T21-T22** (+ N-1..N-13) | Usulan DEV-RTRW menulis "T9-T20": T-14 dan T-16..T-20 bukan vektor ledger |
| CI-06 | Uji properti | **I-1 sampai I-8** | Usulan DEV-RTRW menulis I-1..I-6 (usang) |
| CI-07 | Mutation testing | Skor mutasi | Ambang awal ≥ 70% zona merah (AC-L8), dikaitkan dengan G1 |
| CI-08 | Uji kontrak | Validasi OpenAPI/event | |
| CI-09 | Otorisasi | Matriks peran × endpoint | |
| CI-10 | Lint migrasi | Laporan kompatibilitas | Tambahkan larangan `DROP` objek kustom |
| CI-11 | Audit dependensi | Audit + allowlist | |
| CI-12 | Secret scanning | Laporan gitleaks | |
| CI-13 | Cakupan | Ambang cakupan | ≥ 80% ledger/billing |
| CI-14 | Keterlacakan | Laporan requirement → tes | Sumber: `traceability-matrix.md` |
| CI-15 | Build | Laporan build web/mobile | |
| **CI-16** | Model referensi ledger | `run-vectors.mjs` + `property-test.mjs` | Pagar logika independen |
| **CI-17** | Cek drift migrasi Prisma | Laporan `prisma migrate diff` | Uji perilaku di versi Prisma Anda |
| **CI-18** | Lint: klien Prisma tidak menulis tabel ledger | Laporan lint | ADR-22 |
| **CI-19** | Schema Conformance | Hasil kueri katalog (TDD-Amendment B) | |
| **CI-20** | Cakupan vektor | `check-vector-coverage.mjs` | Mencegah drift spec ↔ tes |
| **CI-21** | Pemindaian data pribadi | Laporan | Berkas CSV/XLSX/dump di repo |

## 3. Skema ID Keputusan (tiga skema saat ini bersaing)

| Sumber | Contoh ID | Dipakai oleh |
| :--- | :--- | :--- |
| Addendum PRD | `D-2026-11-13-OQ-1` | Keputusan OQ |
| Usulan DEV-RTRW | `D-NB-001 ... D-NB-009` | Keputusan teknis C2 |
| Playbook / folder parsial | `D-001`, `D-101`, `D-201` | Draf awal |

**Usulan (perlu keputusan Owner):** satu **ID kanonik `D-NB-###`** berurutan, ditambah kolom **Alias** untuk ID lama (`D-2026-11-13-OQ-1`). Alasan: sudah ada keputusan teknis yang memakainya dan alias menjaga rujukan di PRD tetap valid. Skema `D-001/D-101/D-201` dihentikan. Sebelum memakai nomor `D-NB-###`, periksa bahwa nomor itu belum dipakai di `decisions.log` asli (berkas itu tidak ikut diunggah).

Kolom wajib: `ID | Alias | Tanggal | Subjek | Keputusan | Alasan | Pemutus | Dokumen terdampak | Status | Bukti penerapan`. Status: `PROPOSED`, `DEFAULT`, `APPROVED`, `APPROVED WITH QUALIFICATION`, `SUPERSEDED`.

## 4. Dua Sumber Status Proyek Saling Bertentangan (harus direkonsiliasi sebelum STATE.md dipakai)

| Hal | `STATE.md` (diunggah) | Usulan DEV-RTRW (bagian 4.2) |
| :--- | :--- | :--- |
| Fixtures/C2-2 | **Selesai** (4/4 tes lulus) | **C2-2-1 menunggu implementasi & review**; C2-2-2/3 belum dimulai |
| C2-3 | **16 file tes sudah dibuat**, menunggu review | **Tidak diotorisasi** |
| Tahap | A, B, C0-C1, C2-1, C2-2 | A, B1-B4b, C0, C1, C2-1 (commit lokal), C2-2-1, ... C5 |
| Commit | tidak dicantumkan | C1 `bfd7c5f`, C2-1 `73932e6` |
| Tanggal | 13 Nov 2026 | 13 Nov 2026 |

Kedua tidak mungkin benar bersamaan. **Jangan memilih salah satu berdasarkan dokumen.** Buktikan dari repositori:

```
git log --oneline --decorate -20
git status --short
ls apps/api/test            # adakah fixtures.ts dan 16 berkas tes vektor?
pnpm --filter api test      # tes mana yang lulus/gagal sekarang
```
Catat hasilnya di `STATE.md` (hash, jumlah tes, tanggal). Jika 16 file tes ternyata sudah ada padahal C2-3 "tidak diotorisasi", catat sebagai **penyimpangan prosedur** dan putuskan: dipertahankan untuk direview, atau dihapus dari cabang.

## 5. Peta Gerbang & Penamaan (satu tabel, tidak menambah istilah baru)

| Penamaan repo (Tahap) | Roadmap TDD | Gerbang | Catatan |
| :--- | :--- | :--- | :--- |
| A (Harness & Git) | S1 / M0 | - | |
| B1-B4b (monorepo, CI, Compose) | S1 / M0 | - | |
| C0-C1 (Prisma schema & migrasi) | S1-S2 | - | Migrasi C1 **dibekukan** (lihat §6) |
| C2 (Testcontainers, fixtures, tes vektor) | S3 (persiapan) | - | Fixtures menguji infrastruktur, bukan aturan bisnis |
| C3 (LedgerService) | S3 | **G1 Ledger Proven** | Dibuka oleh **AG-00** |
| C4, C5 | - | - | Definisinya tidak ada pada dokumen yang diunggah. Jangan diasumsikan |
| **AG-00 AI Development Readiness** | G0 | Prasyarat C3 | = Playbook §13 + *Checklist Pembukaan C3* di STATE. **Satu daftar**, bukan tiga |

**Tabrakan huruf:** usulan DEV-RTRW menamai urutan tata kelola "Tahap A-F", sama dengan "Tahap A-C" pekerjaan repo. Gunakan **GS-1..GS-6** (Governance Step) untuk urutan tata kelola: GS-1 Foundation, GS-2 Source of Truth, GS-3 Feature Specs, GS-4 Test Governance, GS-5 Engineering Guardrails, GS-6 Module Context.

## 6. Koreksi Hasil Review vs Aturan "Jangan Ubah PRD/TDD/Migrasi C1"

Usulan DEV-RTRW menetapkan: PRD/TDD/keputusan bisnis tidak diubah tanpa otorisasi, dan migrasi C1 tidak diubah. Hasil verifikasi menemukan koreksi yang menyentuh keduanya. Perlakuannya:

| Koreksi | Sifat | Jalur yang benar |
| :--- | :--- | :--- |
| E-2 (status S4 = `Dibayar Sebagian`) | Aturan bisnis | **USULAN**. Perlu keputusan Owner (D-1) |
| E-7 / BR-V6 (void ditolak bila dana sudah di-refund) | Aturan bisnis | **USULAN**. Perlu keputusan Owner |
| E-5 (`total > 0`) | Aturan bisnis + skema | **USULAN**. Perlu keputusan Owner (D-3) |
| E-1 (REVERSAL bukan sumber dana) | Perbaikan bug desain TDD §8.2 | Perlu persetujuan sebagai amandemen TDD. Konsisten dengan I-3 yang sudah disetujui |
| E-3 (`payment_allocations`: `invoice_id` nullable + `refund_ledger_id`) | Skema | Hanya untuk fitur refund (P1). **Migrasi baru (forward-only)**, bukan mengedit C1. Perlu otorisasi IMPLEMENTATION terpisah |
| E-5 pada skema (`CHECK total > 0`) | Skema | Migrasi baru yang sama |

**Aturan:** paket review ini **tidak berlaku sebagai persetujuan** atas koreksi di atas. Statusnya `PROPOSED` sampai Owner menulis `APPROVED` di `decisions.log`. Selama belum disetujui, AI tidak boleh menerapkannya pada kode.
Perkecualian aman: E-1 dan BR-V6 menambah pembatasan (menolak operasi), sehingga menerapkannya pada **tes** lebih aman daripada tidak. Tetap perlu persetujuan sebelum jadi kewajiban.

**TRUNCATE dan append-only.** Keputusan D-NB-008 memakai `TRUNCATE ... RESTART IDENTITY CASCADE` untuk pembersihan tes. Trigger baris `BEFORE UPDATE OR DELETE` **tidak menghalangi `TRUNCATE`**. Pastikan: (a) peran aplikasi produksi tidak memiliki hak `TRUNCATE` (Checklist B6), (b) pertimbangkan trigger `BEFORE TRUNCATE` tingkat pernyataan pada tabel ledger yang hanya dilewati pada koneksi tes, (c) `CASCADE` pada TRUNCATE tidak pernah dijalankan di luar basis data tes. Ini bagian dari kualifikasi "APPROVED WITH QUALIFICATION" pada D-NB-008 dan perlu dicatat eksplisit.

## 7. Koreksi Rujukan Internal Playbook (terverifikasi pada berkas)

| # | Lokasi (baris) | Tertulis | Seharusnya | Sumber temuan |
| :--- | :--- | :--- | :--- | :--- |
| 1 | §3 (100) `decisions.log` | 14.7 | **14.6** | DEV-RTRW (lokasi disebut §8, sebenarnya §3) |
| 2 | §3 (102) dan §11 (342) `do-not-do.md` | 14.8 | **14.7** | DEV-RTRW (disebut §8; sebenarnya §3 dan §11) |
| 3 | §5.1 (151) prompt adversarial | 14.4 | **14.3.d** | DEV-RTRW |
| 4 | §3 (110) `pull_request_template.md` | 14.5 | **14.4** | **Terlewat di DEV-RTRW** |
| 5 | §3 (111) `CODEOWNERS` | 14.6 | **14.5** | **Terlewat di DEV-RTRW** |
| 6 | §3 `db/migrations/` | lokasi generik | `apps/api/prisma/migrations/` (keputusan C1) | DEV-RTRW |
| 7 | §6.1 ambang mutasi | tidak normatif | ≥ 70% zona merah (AC-L8), dikaitkan G1 | DEV-RTRW |
| 8 | §6.4 / §14.5 CODEOWNERS | placeholder | akun GitHub valid | DEV-RTRW |
| 9 | §14.9 CI | sketsa | disesuaikan dengan skrip/workspace aktual | DEV-RTRW |
