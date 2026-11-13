# STATE.md — Status Proyek

**Terakhir diperbarui:** 2026-11-13

## Fase saat ini
Sprint 0 / Harness — menyiapkan fondasi dokumen & aturan sebelum menulis kode.

## Selesai
- Dokumen induk tersedia di `docs/` (PRD v1.1, TDD v1.1, Playbook v1.0, SPEC-LEDGER-001 v1.0).
- Harness Tahap A: README, CLAUDE.md, AGENTS.md, decisions.log, STATE.md, do-not-do.md, glossary.md, modules/ledger/README.md.

## Sedang dikerjakan
- Menunggu persetujuan Harness Tahap A sebelum lanjut Tahap B.

## Blokir
- Konfirmasi T3: apakah `git init` diizinkan?
- OQ-2, OQ-4, OQ-7, OQ-8, OQ-9, OQ-10, OQ-11 belum dijawab (tidak memblokir Harness).

## Langkah berikutnya (Tahap B)
1. Struktur monorepo: pnpm-workspace.yaml, tsconfig.base.json, package.json.
2. Skeleton apps/api (NestJS), apps/worker, apps/web (React+Vite).
3. packages/shared (util uang, Clock), packages/ui, packages/config.
4. contracts/openapi.yaml (draf), contracts/events/.
5. db/migrations/ (skema awal dari TDD 7.2 + koreksi SPEC E-3, E-5).
6. .github/workflows/ci.yml (gerbang 6.1), PR template, CODEOWNERS.
7. infra/docker/docker-compose.yml (Postgres, Redis, storage).

## Langkah setelahnya (Tahap C — Ledger)
1. Tulis tes dari SPEC-LEDGER Bagian 8, 8.1, 9 (harus gagal).
2. Implementasi `ledger` sampai tes lulus.
3. Uji properti + konkurensi + mutation testing.
