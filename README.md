# NetBill Pro - RT/RW Net Management & Billing System

Sistem manajemen operasional, billing, dan portal pelanggan untuk usaha RT/RW Net.
Web (Admin/Portal) + Mobile (Client/Kolektor), backend modular monolith.

## Status

**Fase:** Sprint 0 / Harness selesai. Siap masuk Tahap C (ledger).
Lihat `docs/STATE.md` untuk status terkini.

## Peta Dokumen

| Dokumen | Lokasi | Fungsi |
|---|---|---|
| PRD v1.1 | `docs/PRD-RTRW-2026-001_v1.1.md` | Aturan bisnis, RBAC, ledger S1-S8, NFR, AC |
| TDD v1.1 | `docs/NetBill-Pro_Master-Roadmap-Architecture_v1.0.md` | Arsitektur, skema DB, algoritma, roadmap |
| Playbook v1.0 | `docs/NetBill-Pro_AI-Assisted-Development-Playbook_v1.0.md` | Aturan pengembangan berbantuan AI |
| SPEC-LEDGER-001 v1.0 | `docs/SPEC-LEDGER-001_Ledger-Alokasi-Void_v1.0.md` | Aturan kanonik ledger & vektor uji |
| Keputusan | `docs/decisions.log` | Log keputusan Owner/teknis |
| Status proyek | `docs/STATE.md` | Status terkini untuk handover sesi |
| Larangan | `docs/do-not-do.md` | Daftar hal yang tidak boleh dilakukan |
| Glosarium | `docs/glossary.md` | Istilah domain |
| Aturan AI | `CLAUDE.md` | Aturan keras untuk agen AI |

## Hierarki Sumber Kebenaran

Keputusan Owner (decisions.log) > PRD > TDD/ADR > Spec > Kontrak > Tes > Kode.
Bila bertentangan, yang lebih tinggi menang. Kode yang bertentangan = bug.

## Prasyarat

- **Node.js 20+** (`node --version`)
- **pnpm 9.15+** (`pnpm --version`)
- **Docker Desktop** (untuk Postgres + Redis lokal; belum diperlukan sampai Tahap C)
- **Git**

## Setup Awal

1. Clone repo:

    git clone https://github.com/Syachrul/netbillpro.git
    cd netbillpro

2. Install dependensi workspace:

    pnpm install

3. Salin env example yang diperlukan:

    cp infra/docker/.env.example infra/docker/.env
    cp apps/api/.env.example apps/api/.env
    cp apps/worker/.env.example apps/worker/.env

## Menjalankan (development)

### Infrastruktur (Postgres + Redis)

Prasyarat: Docker Desktop terpasang.

    docker compose -f infra/docker/docker-compose.yml --env-file infra/docker/.env up -d

Cek status:

    docker compose -f infra/docker/docker-compose.yml ps

### Aplikasi

Jalankan semua workspace sekaligus:

    pnpm -r --parallel dev

Atau satuan (terminal terpisah):

    pnpm --filter @netbill/api dev
    pnpm --filter @netbill/worker dev
    pnpm --filter @netbill/web dev

Endpoint default:

| Layanan | URL |
| :--- | :--- |
| API | http://localhost:3000/api/v1/health |
| Worker | http://localhost:3001/api/v1/health |
| Web | http://localhost:5173 |

## Perintah Root

| Perintah | Fungsi |
| :--- | :--- |
| `pnpm install` | Install dependensi semua workspace |
| `pnpm typecheck` | Typecheck TypeScript semua workspace |
| `pnpm test` | Jalankan tes semua workspace |
| `pnpm build` | Build semua workspace |
| `pnpm lint` | (Aktif setelah ESLint dikonfigurasi di S1) |
| `pnpm format` | Format dengan Prettier |
| `pnpm format:check` | Cek format tanpa mengubah |

## Struktur Repositori

```
NEW RTRWNET/
├─ apps/
│  ├─ api/           NestJS (Fastify) - backend REST
│  ├─ worker/        NestJS - BullMQ consumers + scheduler
│  └─ web/           React + Vite + Tailwind
├─ packages/
│  └─ shared/        Util uang, Clock, errors, result
├─ infra/docker/     Compose Postgres 16 + Redis 7
├─ contracts/        OpenAPI + event schema
├─ db/
│  ├─ migrations/    (Kosong sampai Tahap C)
│  └─ seeds/         (Kosong sampai Tahap C)
├─ modules/
│  └─ ledger/        README paket konteks modul
├─ docs/             PRD, TDD, Playbook, SPEC, ADR
├─ .github/          CI, PR template, CODEOWNERS
├─ CLAUDE.md         Aturan keras untuk agen AI
├─ AGENTS.md         Tautan untuk alat AI lain
└─ README.md
```

## Prinsip Inti

1. **Dokumen adalah niat, tes adalah penegak.**
2. **Tes dulu, kode kemudian.**
3. **Potongan kecil, terverifikasi.**
4. **Zona risiko menentukan pengawasan** (Merah/Kuning/Hijau).
5. **Konteks ditulis, bukan diingat.**

## Zona Risiko

- **Merah:** ledger, alokasi, billing, payments, auth, RBAC, secret, migrasi DB.
- **Kuning:** CRUD pelanggan/paket, laporan, notifikasi, impor, PDF.
- **Hijau:** UI presentasi, dokumentasi, skrip bantu.

## Kontribusi

1. Baca `CLAUDE.md` dan `docs/do-not-do.md`.
2. Pilih satu FR dari `docs/` atau backlog.
3. Buat branch pendek: `feat/FR-XXX-nama`.
4. Ikuti alur Playbook 5: rencana -> tes (gagal) -> implementasi -> review.
5. PR harus mencantumkan ID FR/ADR/FIX.
6. Zona merah wajib 2 reviewer.

## Lisensi

Proprietary - internal project.
