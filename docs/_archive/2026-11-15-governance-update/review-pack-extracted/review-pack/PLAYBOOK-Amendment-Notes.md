# Playbook Amendment Notes (DEV-RTRW-2026-001 v1.0 → v1.1)

Playbook yang diunggah identik dengan v1.0. Perubahan di bawah menyesuaikannya dengan kenyataan proyek (Documentation-First, Prisma, pnpm) dan temuan review.

| # | Lokasi | Perubahan | Alasan |
| :--- | :--- | :--- | :--- |
| P1 | §6.1 Gerbang CI | Tambah **#16 Model referensi ledger** (`run-vectors.mjs`, `property-test.mjs`), **#17 Cek drift migrasi Prisma + larangan DROP objek kustom**, **#18 Lint: klien Prisma tidak menulis tabel ledger**, **#19 Schema Conformance** (kueri katalog TDD-Amendment B), **#20 Cakupan vektor** (`tools/check-vector-coverage.mjs`), **#21 Pemindaian data pribadi** (berkas CSV/XLSX/dump di repo) | Keputusan T2 dan temuan review |
| P2 | §14.6 Format `decisions.log` | Samakan skema ID dengan yang sudah dipakai PRD: `D-<YYYY-MM-DD>-<kode>` (mis. `D-2026-11-13-OQ-1`). Tambahkan kolom **STATUS** (`DEFAULT`/`FINAL`) | Addendum PRD memakai `D-2026-11-13-OQ-1`, playbook memakai `D-001`: tidak konsisten |
| P3 | §12-13 | Formalkan **Documentation-First** sebagai gerbang (G0.5) dengan checklist di `STATE.md` (Checklist Pembukaan C3) | STATE sudah memakainya, tetapi belum ada di playbook |
| P4 | §7 Risiko | Tambah **V-17: Drift spec ↔ tes.** Tes dibuat dari versi spec lama (16 file tes dari v1.0, kini 18 vektor). Mitigasi: versi spec dicantumkan di header tes, gerbang cakupan vektor di CI | Terjadi nyata pada proyek ini |
| P5 | §7 Risiko | Tambah **V-18: Tabrakan penomoran ID** antara dokumen (TDD T-16/T-17 vs vektor). Mitigasi: satu daftar ID skenario, penomoran lanjutan, tidak memakai ulang | Ditemukan saat review |
| P6 | §6.2 Aturan lint | Tambah baris: larang `prisma.<modelLedger>.create/update/delete` di luar modul `ledger`; larang `Float/Decimal` di `schema.prisma`; larang `prisma db push` | ADR-22 |
| P7 | §8 Manajemen konteks | `STATE.md` wajib memuat: **Fakta belum diverifikasi**, **Checklist gerbang**, **Pemetaan tahap ke Roadmap**, **Berkas yang tidak ikut ditinjau** | Mencegah klaim kemajuan yang tak terverifikasi |
| P8 | §1 / kebijakan data | Seed dan fixture **selalu sintetis**. Spreadsheet asli hanya untuk migrasi di lingkungan privat (S11), tidak pernah di repo/prompt/CI | STATE lama mencantumkan "Seeds menunggu data asli" |
| P9 | §14 Template | Template spec: tambah kolom **versi spec** dan **ID vektor** pada tiap AC | Mendukung P4 |
| P10 | §4 Zona | Tegaskan **zona merah** juga mencakup `db/migrations` dan `prisma/migrations` serta konfigurasi CI | Migrasi memuat trigger/CHECK |
| P11 | §14 (rujukan) dan §3 | Perbaiki 5 rujukan nomor templat (§3: decisions.log 14.7→14.6, do-not-do 14.8→14.7, PR template 14.5→14.4, CODEOWNERS 14.6→14.5; §5.1 prompt adversarial 14.4→14.3.d; §11 do-not-do 14.8→14.7) | Terverifikasi pada berkas. Lihat `governance-alignment.md` §7 |
| P12 | §3, §14 | Lokasi migrasi: `apps/api/prisma/migrations/` (bukan `db/migrations/`) | Keputusan C1 |
| P13 | Bagian baru §9b | Model otorisasi **DESIGN / IMPLEMENTATION / RELEASE** dan tiga bukti terpisah (CI PASS, Review ACCEPTED, Release GRANTED) | Dari usulan DEV-RTRW |
| P14 | §6.1 | Pakai ID gerbang **CI-01..CI-21** (tabel di `governance-alignment.md` §2) | Dari usulan DEV-RTRW + tambahan review |
| P15 | §10 | Status keterlacakan: `NOT STARTED`, `SPECIFIED`, `TESTED`, `IMPLEMENTED`, `VERIFIED`, `ACCEPTED`, `BLOCKED` + `traceability-matrix.md` | Dari usulan DEV-RTRW |
| P16 | §13 | Jadikan **AG-00** nama resmi readiness §13 (satu daftar, termasuk *Checklist Pembukaan C3*) | Hindari tiga daftar paralel |
| P17 | §8 | Aturan **Evidence**: laporan penyelesaian wajib memuat sumber, diff, hasil tes nyata, dan daftar yang tidak diverifikasi | Dari usulan DEV-RTRW |
| P18 | §6.4 / §14.5 | `CODEOWNERS` placeholder wajib diganti akun GitHub valid sebelum branch protection diaktifkan; ambang mutasi ≥ 70% dikaitkan ke G1 | Dari usulan DEV-RTRW |
