# db/ — Database Directory

**Status:** PLACEHOLDER (belum ada implementasi aktif di direktori ini)

## Tujuan direktori

Direktori `db/` disiapkan sebagai lokasi eventual untuk migration files dan seed scripts.

## Status saat ini

Kedua sub-direktori (`migrations/` dan `seeds/`) saat ini **KOSONG** — hanya berisi `.gitkeep`.

**Migration aktual:** `apps/api/prisma/migrations/` (4 migrations + lock file)
**Schema definition:** `apps/api/prisma/schema.prisma`

## Governance status — PENTING

**Schema implementation dan migration NOT AUTHORIZED** per:
- `DLR-06` (`decisions.log`)
- `DEC-2026-11-16-C3-RATIFY-001` (limited to C3 code at `786566c`)
- Phase B directive (2026-11-17)

## Authorization matrix

| Aktivitas | Status |
| :--- | :--- |
| Reading existing migrations | ✅ **Permitted** within documentary scope |
| Reading `schema.prisma` | ✅ **Permitted** within documentary scope |
| **Running test suite** | 🟡 **REQUIRES SEPARATE AUTHORIZATION** |
| Running `prisma migrate deploy` against real database | 🔴 **NOT AUTHORIZED** |
| Running `prisma migrate deploy` against ephemeral testcontainers DB | 🟡 **REQUIRES EXPLICIT AUTHORIZATION** |
| Creating new migration | 🔴 **NOT AUTHORIZED** (DLR-06) |
| Modifying `schema.prisma` | 🔴 **NOT AUTHORIZED** (DLR-06) |
| Filling `db/migrations/` or `db/seeds/` | 🔴 **NOT AUTHORIZED** |

## Konvensi yang direkomendasikan (belum diimplementasikan)

Jika migration strategy dipindahkan ke `db/`:
1. `db/migrations/YYYYMMDDHHMMSS_deskripsi/` dengan `migration.sql`
2. `db/seeds/` untuk data initialization
3. Satu sumber kebenaran (jangan duplikasi dengan `apps/api/prisma/migrations/`)
4. Update `db/README.md` saat isi berubah

## Reference

- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/migrations/`
- `docs/decisions.log` — DLR-06
- `docs/adr/ADR-0022.md` — Prisma ORM decision

---

*PLACEHOLDER. Jangan menambahkan migration/seed/test execution tanpa Owner
authorization eksplisit. Schema implementation = NOT AUTHORIZED.*
