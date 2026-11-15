# Paket Hasil Review: NetBill Pro (15 Nov 2026)

Mulai dari **`REVIEW-REPORT.md`** (berkas 1-6) dan **`REVIEW-REPORT-2.md`** (penilaian atas usulan DEV-RTRW). Lalu terapkan berkas lain sesuai tabel.

| Berkas di paket | Tempatkan di repo Anda | Aksi |
| :--- | :--- | :--- |
| `REVIEW-REPORT.md`, `REVIEW-REPORT-2.md` | `docs/reviews/` | Arsip |
| `governance-alignment.md` | `docs/` | Baca dulu §4 (konflik status) dan §6 (koreksi = PROPOSED) |
| `artifact-register.md`, `traceability-matrix.md` | `docs/` | Pasang, isi kolom Code/bukti dari repo |
| `CLAUDE.md` (v2) | repo root | Bandingkan dengan yang ada, jangan timpa buta |
| `PRD-RTRW-2026-001_v1_2.md` | `docs/prd/` | **Ganti** v1_1 |
| `ADR-Register.md`, `adr/ADR-0001..0022.md` | `docs/adr/` | **Ganti**/tambah |
| `do-not-do.md`, `glossary.md`, `STATE.md` | `docs/` | **Ganti** |
| `TDD-Amendment-Notes.md` | `docs/tdd/` | **Terapkan** ke TDD, lalu arsipkan |
| `PLAYBOOK-Amendment-Notes.md` | `docs/` | **Terapkan** ke Playbook |
| `ledger/SPEC-LEDGER-001_v1_1.md` | `docs/specs/` | **Ganti** v1.0 |
| `ledger/ledger-vectors.json` | `docs/test-plan/` | **Ganti** (18 vektor) |
| `ledger/reference-model/*.mjs` | `docs/test-plan/reference-model/` | Salin, jalankan di CI |
| `tools/check-vector-coverage.mjs` | `tools/` | Pasang di CI |

**Menjalankan model referensi** (Node 18+, tanpa dependensi, tanpa DB):
```
node ledger/reference-model/run-vectors.mjs
node ledger/reference-model/property-test.mjs 3000 40 1
node tools/check-vector-coverage.mjs ledger/ledger-vectors.json <direktori-tes> --negatives=13
```
