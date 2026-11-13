# NETBILL PRO: MASTER ROADMAP, ARSITEKTUR & KELENGKAPAN TEKNIS-OPERASIONAL

### Kontrol Dokumen

| Atribut | Detail |
| :--- | :--- |
| **ID Dokumen** | TDD-RTRW-2026-001 |
| **Versi** | 1.0 (Draft for Review) |
| **Tanggal** | 13 November 2026 |
| **Dokumen Induk** | PRD-RTRW-2026-001 v1.1 |
| **Cakupan** | Arsitektur sistem, desain basis data, algoritma inti, keamanan, infrastruktur, strategi uji, master roadmap, rencana migrasi & go-live, operasional |
| **Pembaca** | Product Owner, Engineering Lead, Developer, QA, DevOps, Owner usaha |

> **Catatan penting.** Dokumen ini berisi **rekomendasi teknis** yang konsisten dengan PRD v1.1 (ID requirement `FR-*`, `MOB-*`, skenario ledger `S1-S8`, `OQ-*`). Keputusan yang bergantung pada Open Questions ditandai **[OQ-x]**. Estimasi waktu, kapasitas server, dan biaya adalah **perkiraan awal** yang harus divalidasi tim engineering sebelum dikunci.

---

## Daftar Isi

1. Tujuan & Hubungan Antar Dokumen
2. Prinsip Arsitektur & Catatan Keputusan (ADR)
3. Arsitektur Sistem (Konteks, Container, Komponen)
4. Tech Stack
5. Struktur Repositori & Konvensi Kode
6. Desain Backend & API
7. Desain Basis Data
8. Algoritma Inti (Ledger, Alokasi, Billing, Penomoran)
9. Background Jobs & Arsitektur Notifikasi
10. Arsitektur PDF & File
11. Arsitektur Frontend Web
12. Arsitektur Mobile (Capacitor)
13. Arsitektur Keamanan
14. Infrastruktur, Deployment & Operasi
15. Strategi Pengujian & Kualitas
16. **Master Roadmap**
17. Backlog Epik & Keterlacakan Requirement
18. Rencana Migrasi Data & Cutover Go-Live
19. Operasional: SOP, Pelatihan, Dukungan, Runbook
20. Kepatuhan, Hukum & Rilis Toko Aplikasi
21. Estimasi Biaya Infrastruktur
22. Register Risiko Lanjutan
23. Definition of Ready / Done & Quality Gates
24. Lampiran (Env, Template Pesan, Kode Error, Konvensi)

---

## 1. Tujuan & Hubungan Antar Dokumen

| Dokumen | Menjawab pertanyaan | Pemilik |
| :--- | :--- | :--- |
| **PRD v1.1** | *Apa* yang dibangun dan *mengapa*, aturan bisnis, acceptance criteria | Product |
| **Dokumen ini (TDD)** | *Bagaimana* dibangun, *kapan*, oleh siapa, dan bagaimana dioperasikan | Engineering + Product |

Urutan baca yang disarankan: PRD Bagian 5-6 (aturan bisnis ledger) → Bagian 7-8 dokumen ini (data & algoritma) → Bagian 16 (roadmap).

---

## 2. Prinsip Arsitektur & Catatan Keputusan (ADR)

### 2.1 Prinsip

1. **Correctness over speed untuk uang.** Semua yang menyentuh saldo bersifat transaksional, idempoten, dan dapat diaudit.
2. **Satu sumber kebenaran.** Web dan Mobile memakai satu backend dan satu basis data.
3. **Modular monolith dulu.** Skala target (≤ 2.000 pelanggan) tidak membutuhkan microservices. Modul dipisah rapi agar bisa diekstrak kelak.
4. **Append-only untuk data finansial.** Koreksi lewat entri baru, bukan perubahan.
5. **Gagal dengan aman.** Gangguan WhatsApp/SMTP tidak boleh menggagalkan pencatatan pembayaran (dipisah lewat antrean dan *outbox*).
6. **Sederhana dioperasikan.** Tim kecil harus bisa merawat sistem ini. Pilih teknologi populer dengan komponen minimal.
7. **Keamanan sejak desain.** Otorisasi di API, enkripsi kredensial, audit log.

### 2.2 Catatan Keputusan Arsitektur (ADR)

| ID | Keputusan | Alternatif dipertimbangkan | Alasan | Status |
| :--- | :--- | :--- | :--- | :--- |
| ADR-01 | **Modular monolith** (satu backend, modul terpisah) | Microservices | Tim kecil, skala kecil, transaksi ACID lintas modul lebih mudah | Diusulkan |
| ADR-02 | **PostgreSQL** sebagai basis data utama | MySQL, MongoDB | ACID kuat, `SELECT FOR UPDATE`, *partial unique index*, tipe enum/JSONB, trigger | Diusulkan |
| ADR-03 | **Ledger append-only** + saldo disimpan per entri (`balance_after`) | Saldo mutable di tabel pelanggan | Audit, anti-manipulasi, rekonsiliasi | Diusulkan |
| ADR-04 | **Alokasi pembayaran tercatat eksplisit** (tabel alokasi, FIFO) | Hitung status dari saldo saja | Status per tagihan tidak dapat diturunkan dari saldo total | Diusulkan |
| ADR-05 | **Transactional Outbox + Redis Queue (BullMQ)** untuk notifikasi | Kirim sinkron di request | Gangguan gateway tidak menggagalkan transaksi, ada retry & rate limit | Diusulkan |
| ADR-06 | **Mobile: React + Tailwind + Capacitor** **[OQ-5]** | React Native, Flutter | Satu basis kode dengan web, selaras keahlian tim | Menunggu OQ-5 |
| ADR-07 | **TypeScript di seluruh stack** (monorepo) | Bahasa berbeda FE/BE | Tipe dan validasi dapat dibagi (skema Zod), onboarding mudah | Diusulkan |
| ADR-08 | **PDF dengan pustaka dokumen ringan** (pdfmake atau @react-pdf/renderer), bukan headless browser | Puppeteer/Chromium | Target p95 < 1,5 detik dan memori kecil | Diusulkan |
| ADR-09 | **Integer rupiah** (`BIGINT`), tanpa float/decimal | NUMERIC | IDR tanpa desimal, menghindari galat pembulatan | Diusulkan |
| ADR-10 | **Single-tenant**, tetapi kolom `tenant_id` **tidak** ditambahkan di Fase 1 **[OQ-1]** | Multi-tenant sejak awal | Kompleksitas lebih besar. Jika OQ-1 = multi-tenant, putuskan sebelum M0 selesai | Menunggu OQ-1 |
| ADR-11 | **Token: access JWT pendek + refresh token rotasi** (disimpan hash di DB) | Sesi server-side | Cocok untuk web + mobile, dapat dicabut | Diusulkan |
| ADR-12 | **Deployment Docker Compose pada satu VPS** (Fase 1), siap dipindah ke managed service | Kubernetes | Biaya & kompleksitas operasi minimal | Diusulkan |
| ADR-13 | **Object storage S3-compatible** untuk bukti bayar, logo, PDF | Simpan di disk server | Backup & akses terkontrol lewat URL bertanda tangan | Diusulkan |

---

## 3. Arsitektur Sistem

### 3.1 Diagram Konteks

```mermaid
flowchart LR
    subgraph Pengguna
        OWN[Owner]
        ADM[Admin / Operator]
        KOL[Kolektor]
        CLI[Pelanggan]
    end

    subgraph NetBill Pro
        WEB[Web App<br/>React + Tailwind]
        MOB[Mobile App<br/>Capacitor Android/iOS]
        API[Backend API<br/>Modular Monolith]
    end

    WAG[WhatsApp Gateway<br/>pihak ketiga]
    SMTP[SMTP Email]
    FCM[FCM / APNs<br/>Push]
    STO[(Object Storage)]
    DB[(PostgreSQL)]

    OWN --> WEB
    ADM --> WEB
    KOL --> MOB
    KOL --> WEB
    CLI --> WEB
    CLI --> MOB
    WEB --> API
    MOB --> API
    API --> DB
    API --> STO
    API --> WAG
    API --> SMTP
    API --> FCM
```

### 3.2 Diagram Container

```mermaid
flowchart TB
    U[Browser / Mobile App] -->|HTTPS| RP[Reverse Proxy<br/>Caddy atau Nginx<br/>TLS, rate limit dasar]
    RP --> FE[Static Web<br/>React build]
    RP --> API[API Server<br/>Node.js + NestJS]
    API --> PG[(PostgreSQL)]
    API --> RD[(Redis)]
    API --> OBJ[(Object Storage S3)]
    WRK[Worker<br/>BullMQ consumers<br/>+ Scheduler] --> PG
    WRK --> RD
    WRK --> OBJ
    WRK --> WAG[WhatsApp Gateway]
    WRK --> SMTP[SMTP]
    WRK --> PUSH[FCM / APNs]
    API -. outbox event .-> PG
    MON[Monitoring<br/>Sentry + Uptime Kuma] -.-> API
    MON -.-> WRK
    BKP[Backup Job<br/>pg_dump / pgBackRest] --> PG
    BKP --> OBJ2[(Storage Backup<br/>lokasi terpisah)]
```

**Proses runtime:** (1) `api` melayani HTTP, (2) `worker` menjalankan antrean dan scheduler (proses terpisah, image sama), (3) `postgres`, (4) `redis`, (5) `proxy`.

### 3.3 Komponen Backend (Modul)

```mermaid
flowchart LR
    AUTH[auth<br/>login, OTP, token] --- USR[users & rbac]
    CUS[customers] --- SUB[subscriptions]
    PKG[packages] --- SUB
    BIL[billing<br/>generator, invoices] --- LED[ledger<br/>posting, alokasi]
    PAY[payments<br/>void, settlement] --- LED
    INV[invoice-docs<br/>PDF, secure link] --- BIL
    NTF[notifications<br/>templates, outbox, queue]
    RPT[reports & exports]
    SET[settings]
    AUD[audit]
    IMP[import]
    BIL --> NTF
    PAY --> NTF
    INV --> NTF
```

| Modul | Tanggung jawab | FR terkait |
| :--- | :--- | :--- |
| `auth` | Login, OTP, refresh token, lockout | MOB-C-01, NFR keamanan |
| `users` | Akun staf, peran, permission guard | FR-SET-06 |
| `customers` | CRUD pelanggan, status, pencarian | FR-CUS-* |
| `packages` | Katalog paket, kebijakan perubahan harga | FR-PKG-* |
| `subscriptions` | Riwayat paket per pelanggan | FR-CUS-03, FR-PKG-04 |
| `ledger` | **Satu-satunya** modul yang boleh menulis `ledger_entries` dan `payment_allocations` | Bagian 6 PRD |
| `billing` | Generator periode, invoice, item, void, penyesuaian | FR-BIL-* |
| `payments` | Pencatatan, void/approval, setoran kolektor | FR-PAY-* |
| `invoice-docs` | Render PDF, secure link, snapshot | FR-INV-* |
| `notifications` | Template, outbox, antrean, log, push | FR-NTF-*, FR-INV-05 |
| `reports` | Query laporan, ekspor PDF/Excel | FR-RPT-* |
| `settings` | Profil usaha, billing, gateway (terenkripsi) | FR-SET-* |
| `audit` | Pencatatan perubahan sensitif | FR-SET-07 |
| `import` | Impor CSV/Excel, validasi, saldo awal | FR-CUS-06 |

**Aturan dependensi:** modul lain **dilarang** menulis langsung ke tabel ledger/alokasi. Mereka memanggil *service* `ledger`. Ditegakkan dengan aturan lint (batas modul) dan trigger basis data.

---

## 4. Tech Stack

| Lapisan | Pilihan | Catatan |
| :--- | :--- | :--- |
| **Bahasa** | TypeScript (strict) | Seluruh stack |
| **Web frontend** | React 18+, Vite, React Router, TanStack Query, TanStack Table, React Hook Form + Zod, Tailwind CSS v4, Recharts | Komponen UI: shadcn/ui (Radix) |
| **Mobile** | Capacitor 6+ (menyesuaikan versi stabil saat mulai), plugin: Push Notifications, Filesystem, Share, Preferences/Secure Storage, Haptics, Browser, Barcode (opsional) | Basis kode sama dengan web **[OQ-5]** |
| **Backend** | Node.js LTS, NestJS (Fastify adapter), Zod/class-validator | REST + OpenAPI |
| **Akses data** | Prisma atau Kysely (SQL mentah untuk bagian kritis ledger) | Wajib bisa `FOR UPDATE` & transaksi eksplisit |
| **Basis data** | PostgreSQL 16+ | Migrasi dengan alat migrasi (Prisma Migrate/Atlas/Flyway) |
| **Cache & antrean** | Redis 7 + BullMQ | Antrean, rate limit, lock |
| **PDF** | pdfmake atau @react-pdf/renderer | ADR-08 |
| **Excel/CSV** | exceljs (streaming), fast-csv | Ekspor besar di worker |
| **Storage** | S3-compatible (MinIO self-host / Cloudflare R2 / S3) | URL bertanda tangan |
| **Email** | Nodemailer (SMTP) | Konfigurasi dari Pengaturan |
| **WhatsApp** | Adapter `WhatsAppProvider` (interface) + implementasi sesuai gateway **[OQ-8]** | Mudah diganti (R-1) |
| **Push** | Firebase Cloud Messaging (Android & iOS via APNs key) | |
| **Auth** | JWT (RS256/EdDSA atau HS256 kuat), Argon2id | |
| **Uji** | Vitest/Jest, Supertest, Testcontainers (Postgres), Playwright (E2E web), k6 (beban) | |
| **CI/CD** | GitHub Actions (atau GitLab CI) | Build, lint, test, image, deploy |
| **Container** | Docker, Docker Compose, Caddy/Nginx | |
| **Observabilitas** | Sentry (error), Uptime Kuma (uptime), pino (log JSON), Prometheus + Grafana (opsional P2) | |
| **Dokumentasi API** | OpenAPI/Swagger yang dihasilkan otomatis | |

---

## 5. Struktur Repositori & Konvensi Kode

### 5.1 Monorepo

```
netbill-pro/
├─ apps/
│  ├─ api/                  # NestJS: modul domain
│  │  └─ src/modules/{auth,users,customers,packages,subscriptions,
│  │                  ledger,billing,payments,invoice-docs,
│  │                  notifications,reports,settings,audit,import}
│  ├─ worker/               # entrypoint worker + scheduler
│  └─ web/                  # React (Admin, Portal Client, Kolektor)
│     └─ capacitor/         # android/, ios/, capacitor.config.ts
├─ packages/
│  ├─ shared/               # skema Zod, tipe, util uang/tanggal, konstanta status
│  ├─ ui/                   # komponen UI bersama (Tailwind)
│  └─ config/               # eslint, tsconfig, tailwind preset
├─ infra/
│  ├─ docker/               # Dockerfile api/worker/web, compose.*.yml
│  ├─ caddy/                # Caddyfile
│  └─ scripts/              # backup, restore, deploy
├─ db/
│  ├─ migrations/
│  └─ seeds/
├─ docs/                    # PRD, TDD, ADR, runbook
└─ .github/workflows/
```

### 5.2 Konvensi

| Area | Aturan |
| :--- | :--- |
| **Branching** | Trunk-based dengan *short-lived branch*. `main` selalu dapat dirilis. Fitur belum siap disembunyikan di balik *feature flag* |
| **Commit** | Conventional Commits (`feat:`, `fix:`, `chore:`) |
| **Review** | Minimal 1 reviewer. **Kode ledger/alokasi/billing wajib 2 reviewer** |
| **Versi** | SemVer untuk API dan app. Prefiks API `/api/v1` |
| **Uang** | Selalu `bigint`/integer rupiah. Fungsi util `formatRupiah()`. **Dilarang** `parseFloat` untuk nominal |
| **Waktu** | Simpan UTC (`timestamptz`), tampilkan WIB. Periode tagihan disimpan `YYYY-MM` (string/`date` hari pertama) |
| **Penamaan DB** | `snake_case`, tabel jamak, PK `uuid` (kecuali `ledger_entries.seq` bigserial untuk urutan) |
| **Penamaan kode** | `camelCase` variabel, `PascalCase` kelas/komponen, enum nilai `SNAKE_UPPER` |
| **Bahasa kode** | Kode & komentar Inggris, teks UI Indonesia (i18n siap) |

---

## 6. Desain Backend & API

### 6.1 Konvensi API

| Aspek | Ketentuan |
| :--- | :--- |
| **Gaya** | REST JSON, `/api/v1`, OpenAPI otomatis |
| **Auth** | `Authorization: Bearer <access_token>` |
| **Paginasi** | Cursor atau `page`+`pageSize` (maks 100). Respons memuat `data`, `meta{page,pageSize,total}` |
| **Filter & sort** | Query param (`?status=AKTIF&q=budi&sort=-created_at`) |
| **Idempotensi** | Header `Idempotency-Key` **wajib** untuk `POST /payments`, `POST /billing/runs`, `POST /invoices/{id}/send` |
| **Format error** | RFC 7807-style: `{ "code": "PAYMENT_AMOUNT_INVALID", "message": "...", "details": [...] , "requestId": "..." }` |
| **Rate limit** | Global per IP, ketat untuk `/auth/*` dan `/public/*` |
| **Validasi** | Skema Zod bersama (`packages/shared`) di FE & BE |
| **Versi kompatibilitas mobile** | Header `X-App-Version`. Server dapat menolak versi lama dengan `426 Upgrade Required` (force update) |

### 6.2 Katalog Endpoint

| Grup | Endpoint | Peran |
| :--- | :--- | :--- |
| **Auth** | `POST /auth/login` · `POST /auth/otp/request` · `POST /auth/otp/verify` · `POST /auth/refresh` · `POST /auth/logout` · `POST /auth/password/change` | Publik / semua |
| **Profil** | `GET/PATCH /me` · `POST /devices` (token push) · `DELETE /devices/{id}` | Semua |
| **Pelanggan** | `GET/POST /customers` · `GET/PATCH /customers/{id}` · `POST /customers/{id}/status` · `GET /customers/{id}/ledger` · `POST /customers/import/preview` · `POST /customers/import/commit` · `POST /customers/{id}/reset-password` | Owner, Admin (Kolektor: `GET` ringkas) |
| **Paket** | `GET/POST /packages` · `PATCH /packages/{id}` · `POST /packages/{id}/archive` · `POST /packages/{id}/price-change` | Owner, Admin |
| **Langganan** | `POST /customers/{id}/subscription/change` | Owner, Admin |
| **Billing** | `POST /billing/runs` · `GET /billing/runs/{id}` · `GET /invoices` · `GET /invoices/{id}` · `POST /invoices` (manual) · `POST /invoices/{id}/adjustments` · `POST /invoices/{id}/void` | Owner, Admin |
| **Invoice dokumen** | `GET /invoices/{id}/pdf` · `POST /invoices/{id}/send` · `POST /invoices/{id}/links` · `DELETE /invoice-links/{id}` · `GET /public/invoices/{token}` (tanpa login) | Owner, Admin, Kolektor (struk sendiri) |
| **Pembayaran** | `POST /payments` · `GET /payments` · `GET /payments/{id}` · `POST /payments/{id}/void-requests` | Owner, Admin, Kolektor (tunai) |
| **Persetujuan** | `GET /approvals` · `POST /approvals/{id}/approve` · `POST /approvals/{id}/reject` | Owner |
| **Setoran** | `GET /settlements` · `POST /settlements` (tandai disetor) | Owner, Admin |
| **Notifikasi** | `POST /notifications/broadcast/preview` · `POST /notifications/broadcast` · `GET /notifications/logs` · `POST /notifications/logs/{id}/retry` | Owner, Admin |
| **Laporan** | `GET /reports/revenue` · `/aging` · `/ledger` · `/billing-summary` · `/isolation-candidates` · `/collector-summary` · `POST /exports` · `GET /exports/{id}` | Owner, Admin (Kolektor: rekap sendiri) |
| **Dashboard** | `GET /dashboard/summary` | Owner, Admin |
| **Pengaturan** | `GET/PUT /settings/business` · `/billing` · `/whatsapp` · `/smtp` · `/templates` · `POST /settings/whatsapp/test` · `POST /settings/smtp/test` | Owner |
| **Pengguna** | `GET/POST /users` · `PATCH /users/{id}` · `POST /users/{id}/deactivate` | Owner |
| **Audit** | `GET /audit-logs` | Owner |
| **Portal Client** | `GET /portal/summary` · `GET /portal/invoices` · `GET /portal/invoices/{id}` · `GET /portal/invoices/{id}/pdf` · `GET /portal/ledger` · `GET /portal/package` · `GET /portal/payment-info` | Client |
| **Sistem** | `GET /health` · `GET /ready` · `GET /version` | Publik (terbatas) |

### 6.3 Otorisasi (Guard Berlapis)

1. **Autentikasi:** validasi JWT, status akun aktif.
2. **Peran (RBAC):** dekorator `@Roles(...)` mengikuti matriks PRD Bagian 3.
3. **Kepemilikan (anti-IDOR):** untuk peran Client, setiap query **dipaksa** `WHERE customer_id = <customer milik token>`. Tidak boleh menerima `customerId` dari klien pada endpoint `/portal/*`.
4. **Batasan kolektor:** field/aksi terbatas (hanya metode `TUNAI`, tidak bisa void).
5. **Audit:** aksi sensitif otomatis ditulis ke `audit_logs`.

---

## 7. Desain Basis Data

### 7.1 ERD (Konseptual)

```mermaid
erDiagram
    USERS ||--o| CUSTOMERS : "akun portal"
    CUSTOMERS ||--o{ SUBSCRIPTIONS : memiliki
    PACKAGES ||--o{ SUBSCRIPTIONS : dipakai
    CUSTOMERS ||--o{ INVOICES : ditagih
    INVOICES ||--|{ INVOICE_ITEMS : berisi
    CUSTOMERS ||--o{ PAYMENTS : membayar
    CUSTOMERS ||--o{ LEDGER_ENTRIES : mutasi
    PAYMENTS ||--|| LEDGER_ENTRIES : "kredit"
    INVOICES ||--o{ LEDGER_ENTRIES : "debit"
    LEDGER_ENTRIES ||--o{ PAYMENT_ALLOCATIONS : "sumber"
    INVOICES ||--o{ PAYMENT_ALLOCATIONS : "target"
    LEDGER_ENTRIES ||--o| LEDGER_REVERSALS : "dibalik"
    INVOICES ||--o{ INVOICE_LINKS : "secure link"
    CUSTOMERS ||--o{ NOTIFICATION_LOGS : menerima
    USERS ||--o{ AUDIT_LOGS : melakukan
    USERS ||--o{ DEVICE_TOKENS : memiliki
    USERS ||--o{ COLLECTOR_SETTLEMENTS : "kolektor"
    BILLING_RUNS ||--o{ INVOICES : menghasilkan
```

### 7.2 Skema Inti (PostgreSQL)

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ===== ENUM =====
CREATE TYPE user_role        AS ENUM ('OWNER','ADMIN','KOLEKTOR','CLIENT');
CREATE TYPE customer_status  AS ENUM ('AKTIF','ISOLIR','BERHENTI');
CREATE TYPE package_status   AS ENUM ('AKTIF','ARSIP');
CREATE TYPE invoice_type     AS ENUM ('BULANAN','MANUAL','SALDO_AWAL');
CREATE TYPE invoice_status   AS ENUM ('BELUM_LUNAS','DIBAYAR_SEBAGIAN','LUNAS','BATAL');
CREATE TYPE ledger_type      AS ENUM ('SALDO_AWAL','TAGIHAN','PEMBAYARAN',
                                      'PENYESUAIAN_DEBIT','PENYESUAIAN_KREDIT',
                                      'REVERSAL','REFUND_DEPOSIT');
CREATE TYPE pay_method       AS ENUM ('TUNAI','TRANSFER_BANK','E_WALLET');

-- ===== USERS & CUSTOMERS =====
CREATE TABLE users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role          user_role NOT NULL,
  name          text NOT NULL,
  email         citext UNIQUE,
  phone         text UNIQUE,                    -- format 628xxx
  password_hash text,
  is_active     boolean NOT NULL DEFAULT true,
  failed_logins int NOT NULL DEFAULT 0,
  locked_until  timestamptz,
  last_login_at timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE customers (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code          text NOT NULL UNIQUE,           -- CUST-0001
  user_id       uuid UNIQUE REFERENCES users(id),
  name          text NOT NULL,
  phone         text NOT NULL UNIQUE,           -- 628xxx dinormalisasi
  email         text,
  address       text NOT NULL,
  latitude      numeric(9,6),
  longitude     numeric(9,6),
  status        customer_status NOT NULL DEFAULT 'AKTIF',
  activated_at  date,
  due_day       smallint CHECK (due_day BETWEEN 1 AND 28),  -- null = default global
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_customers_status ON customers(status);
CREATE INDEX ix_customers_search ON customers USING gin (name gin_trgm_ops); -- butuh pg_trgm

-- ===== PAKET & LANGGANAN =====
CREATE TABLE packages (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code         text NOT NULL UNIQUE,
  name         text NOT NULL,
  speed_down   int, speed_up int,
  price        bigint NOT NULL CHECK (price >= 0),
  install_fee  bigint NOT NULL DEFAULT 0 CHECK (install_fee >= 0),
  description  text,
  status       package_status NOT NULL DEFAULT 'AKTIF'
);

CREATE TABLE subscriptions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id),
  package_id  uuid NOT NULL REFERENCES packages(id),
  price       bigint NOT NULL CHECK (price >= 0),   -- harga yang berlaku untuk pelanggan ini
  start_date  date NOT NULL,
  end_date    date,                                  -- null = berjalan
  CHECK (end_date IS NULL OR end_date >= start_date)
);
-- hanya satu langganan berjalan per pelanggan  [ubah jika OQ-7 = ya]
CREATE UNIQUE INDEX uq_active_subscription ON subscriptions(customer_id) WHERE end_date IS NULL;

-- ===== BILLING =====
CREATE TABLE billing_runs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period       char(7) NOT NULL,                     -- '2026-11'
  trigger      text NOT NULL,                        -- 'SCHEDULER' | 'MANUAL'
  started_by   uuid REFERENCES users(id),
  total        int NOT NULL DEFAULT 0,
  succeeded    int NOT NULL DEFAULT 0,
  failed       int NOT NULL DEFAULT 0,
  status       text NOT NULL DEFAULT 'RUNNING',
  started_at   timestamptz NOT NULL DEFAULT now(),
  finished_at  timestamptz
);

CREATE TABLE invoice_counters (
  period   char(7) PRIMARY KEY,
  last_seq int NOT NULL DEFAULT 0
);

CREATE TABLE invoices (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number        text NOT NULL UNIQUE,                -- INV/2026/11/0001
  customer_id   uuid NOT NULL REFERENCES customers(id),
  type          invoice_type NOT NULL DEFAULT 'BULANAN',
  period        char(7),
  billing_run_id uuid REFERENCES billing_runs(id),
  issued_at     timestamptz NOT NULL DEFAULT now(),
  due_date      date NOT NULL,
  total         bigint NOT NULL CHECK (total >= 0),
  allocated     bigint NOT NULL DEFAULT 0,           -- cache = SUM(alokasi)
  status        invoice_status NOT NULL DEFAULT 'BELUM_LUNAS',
  snapshot      jsonb NOT NULL,                      -- data usaha/pelanggan/harga saat terbit
  voided_at     timestamptz, void_reason text,
  created_by    uuid REFERENCES users(id),
  CHECK (allocated >= 0 AND allocated <= total)
);
-- cegah tagihan bulanan ganda (FR-BIL-02)
CREATE UNIQUE INDEX uq_invoice_monthly
  ON invoices(customer_id, period) WHERE type = 'BULANAN' AND status <> 'BATAL';
CREATE INDEX ix_invoices_open ON invoices(customer_id, due_date)
  WHERE status IN ('BELUM_LUNAS','DIBAYAR_SEBAGIAN');

CREATE TABLE invoice_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id  uuid NOT NULL REFERENCES invoices(id),
  kind        text NOT NULL,                         -- IURAN | INSTALASI | DISKON | DENDA | SALDO_AWAL | LAINNYA
  description text NOT NULL,
  amount      bigint NOT NULL                        -- boleh negatif untuk diskon
);

-- ===== PEMBAYARAN =====
CREATE TABLE payments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     uuid NOT NULL REFERENCES customers(id),
  amount          bigint NOT NULL CHECK (amount > 0),
  method          pay_method NOT NULL,
  paid_at         date NOT NULL,
  proof_key       text,                              -- kunci objek storage
  note            text,
  recorded_by     uuid NOT NULL REFERENCES users(id),
  idempotency_key text NOT NULL UNIQUE,
  settlement_id   uuid,                              -- FK ke collector_settlements
  voided_at       timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ===== LEDGER (APPEND-ONLY) =====
CREATE TABLE ledger_entries (
  seq           bigserial PRIMARY KEY,               -- urutan global & per pelanggan
  id            uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  customer_id   uuid NOT NULL REFERENCES customers(id),
  type          ledger_type NOT NULL,
  debit         bigint NOT NULL DEFAULT 0 CHECK (debit  >= 0),
  kredit        bigint NOT NULL DEFAULT 0 CHECK (kredit >= 0),
  balance_after bigint NOT NULL,
  ref_type      text,                                -- 'INVOICE' | 'PAYMENT' | ...
  ref_id        uuid,
  description   text,
  created_by    uuid REFERENCES users(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  CHECK ((debit = 0) <> (kredit = 0))                -- tepat satu sisi terisi
);
CREATE INDEX ix_ledger_customer_seq ON ledger_entries(customer_id, seq DESC);

CREATE FUNCTION forbid_mutation() RETURNS trigger AS $$
BEGIN RAISE EXCEPTION '% bersifat append-only', TG_TABLE_NAME; END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_ledger_immutable
  BEFORE UPDATE OR DELETE ON ledger_entries
  FOR EACH ROW EXECUTE FUNCTION forbid_mutation();

-- entri yang sudah dibalik (agar sumber kredit tidak terhitung lagi sebagai deposit)
CREATE TABLE ledger_reversals (
  original_ledger_id uuid PRIMARY KEY REFERENCES ledger_entries(id),
  reversal_ledger_id uuid NOT NULL UNIQUE REFERENCES ledger_entries(id),
  reason             text NOT NULL
);

-- alokasi bertanda (append-only): + mengalokasikan, - membatalkan
CREATE TABLE payment_allocations (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_ledger_id uuid NOT NULL REFERENCES ledger_entries(id),  -- entri KREDIT sumber dana
  invoice_id       uuid NOT NULL REFERENCES invoices(id),
  amount           bigint NOT NULL CHECK (amount <> 0),
  created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_alloc_invoice ON payment_allocations(invoice_id);
CREATE INDEX ix_alloc_source  ON payment_allocations(source_ledger_id);
CREATE TRIGGER trg_alloc_immutable
  BEFORE UPDATE OR DELETE ON payment_allocations
  FOR EACH ROW EXECUTE FUNCTION forbid_mutation();

-- ===== SETORAN KOLEKTOR =====
CREATE TABLE collector_settlements (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collector_id uuid NOT NULL REFERENCES users(id),
  settle_date  date NOT NULL,
  total        bigint NOT NULL,
  confirmed_by uuid REFERENCES users(id),
  note         text
);
ALTER TABLE payments ADD FOREIGN KEY (settlement_id) REFERENCES collector_settlements(id);

-- ===== NOTIFIKASI, OUTBOX, LINK =====
CREATE TABLE outbox_events (
  id           bigserial PRIMARY KEY,
  type         text NOT NULL,            -- INVOICE_ISSUED | PAYMENT_POSTED | ...
  payload      jsonb NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);
CREATE INDEX ix_outbox_pending ON outbox_events(id) WHERE processed_at IS NULL;

CREATE TABLE notification_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id),
  channel     text NOT NULL,             -- WHATSAPP | EMAIL | PUSH
  recipient   text NOT NULL,
  template    text NOT NULL,
  ref_type    text, ref_id uuid,
  status      text NOT NULL DEFAULT 'ANTRE',  -- ANTRE | TERKIRIM | GAGAL | DIBACA
  attempts    int NOT NULL DEFAULT 0,
  error       text,
  provider_msg_id text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  sent_at     timestamptz
);

CREATE TABLE invoice_links (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id  uuid NOT NULL REFERENCES invoices(id),
  token_hash  text NOT NULL UNIQUE,      -- simpan hash, bukan token mentah
  expires_at  timestamptz NOT NULL,
  revoked_at  timestamptz
);

-- ===== LAIN-LAIN =====
CREATE TABLE settings       (key text PRIMARY KEY, value jsonb NOT NULL, is_secret boolean DEFAULT false, updated_at timestamptz DEFAULT now());
CREATE TABLE audit_logs     (id bigserial PRIMARY KEY, user_id uuid, action text NOT NULL, entity text NOT NULL, entity_id text,
                             before jsonb, after jsonb, ip inet, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE device_tokens  (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id),
                             platform text NOT NULL, token text NOT NULL UNIQUE, last_seen timestamptz);
CREATE TABLE refresh_tokens (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id),
                             token_hash text NOT NULL UNIQUE, family_id uuid NOT NULL, expires_at timestamptz NOT NULL, revoked_at timestamptz);
CREATE TABLE approvals      (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), kind text NOT NULL, ref_id uuid NOT NULL, reason text NOT NULL,
                             requested_by uuid NOT NULL REFERENCES users(id), decided_by uuid REFERENCES users(id),
                             status text NOT NULL DEFAULT 'MENUNGGU', created_at timestamptz DEFAULT now(), decided_at timestamptz);
```

> Catatan: ekstensi `citext` dan `pg_trgm` perlu diaktifkan (`CREATE EXTENSION citext; CREATE EXTENSION pg_trgm;`). DDL di atas adalah **acuan desain**, bukan migrasi final. Tim engineering menyesuaikan dengan alat migrasi yang dipilih.

### 7.3 Status Tagihan (State Diagram)

```mermaid
stateDiagram-v2
    [*] --> BELUM_LUNAS : terbit
    BELUM_LUNAS --> DIBAYAR_SEBAGIAN : alokasi 0 < x < total
    BELUM_LUNAS --> LUNAS : alokasi >= total
    DIBAYAR_SEBAGIAN --> LUNAS : alokasi >= total
    DIBAYAR_SEBAGIAN --> BELUM_LUNAS : void pembayaran (alokasi kembali 0)
    LUNAS --> DIBAYAR_SEBAGIAN : void pembayaran sebagian
    LUNAS --> BELUM_LUNAS : void pembayaran penuh
    BELUM_LUNAS --> BATAL : void tagihan
    DIBAYAR_SEBAGIAN --> BATAL : void tagihan (alokasi dilepas)
    BATAL --> [*]
```
`Jatuh Tempo` bukan status, melainkan penanda turunan: `status IN (BELUM_LUNAS, DIBAYAR_SEBAGIAN) AND CURRENT_DATE > due_date`.

### 7.4 Invarian yang Harus Selalu Benar (Diuji Otomatis & Rekonsiliasi Harian)

| # | Invarian |
| :--- | :--- |
| I-1 | `balance_after` entri terakhir pelanggan = Σ`kredit` − Σ`debit` seluruh entri pelanggan |
| I-2 | `invoices.allocated` = Σ`payment_allocations.amount` untuk invoice tersebut |
| I-3 | Untuk setiap pelanggan: **saldo = (Σ kredit tersedia/belum teralokasi) − (Σ sisa tagihan terbuka)** |
| I-4 | Tidak ada kredit yang dialokasikan melebihi nilainya: Σ alokasi per `source_ledger_id` ≤ `kredit` |
| I-5 | Tidak ada invoice yang dialokasikan melebihi `total` |
| I-6 | Tidak ada entri ledger yang berubah atau terhapus (dijaga trigger) |

Pelanggaran invarian memicu alarm (Bagian 14.6).

---

## 8. Algoritma Inti

### 8.1 Mencatat Pembayaran (`postPayment`)

```mermaid
sequenceDiagram
    participant C as Client (Web/Mobile)
    participant A as API
    participant L as Ledger Service
    participant D as PostgreSQL
    participant Q as Outbox/Queue
    C->>A: POST /payments (Idempotency-Key)
    A->>A: Validasi + otorisasi
    A->>L: postPayment(input)
    L->>D: BEGIN
    L->>D: cek idempotency (kunci sudah ada? kembalikan hasil lama)
    L->>D: SELECT ... FROM customers WHERE id=? FOR UPDATE
    L->>D: INSERT payments
    L->>D: INSERT ledger_entries (kredit, balance_after)
    L->>D: SELECT invoice terbuka ORDER BY due_date, issued_at FOR UPDATE
    L->>D: INSERT payment_allocations (FIFO) + UPDATE invoices.allocated/status
    L->>D: INSERT audit_logs + outbox_events(PAYMENT_POSTED)
    L->>D: COMMIT
    L-->>A: hasil (saldo baru, status tagihan)
    A-->>C: 201 Created
    Q->>Q: worker kirim WA/Email/Push (asinkron)
```

Pseudo-kode:

```ts
async function postPayment(input: PostPaymentInput, actor: Actor) {
  return db.transaction(async (tx) => {
    const dup = await tx.payments.findByIdempotencyKey(input.idempotencyKey);
    if (dup) return dup.result;                                   // idempoten

    await tx.raw('SELECT 1 FROM customers WHERE id = $1 FOR UPDATE', [input.customerId]);

    const payment = await tx.payments.insert({ ...input, recordedBy: actor.id });
    const prev    = await lastBalance(tx, input.customerId);       // ORDER BY seq DESC LIMIT 1
    const credit  = await tx.ledger.insert({
      customerId: input.customerId, type: 'PEMBAYARAN',
      kredit: input.amount, debit: 0,
      balanceAfter: prev + input.amount, refType: 'PAYMENT', refId: payment.id,
    });

    let remaining = input.amount;
    const targets = input.invoiceId
      ? [await lockInvoice(tx, input.invoiceId)]
      : await lockOpenInvoicesFIFO(tx, input.customerId);          // due_date ASC, issued_at ASC

    for (const inv of targets) {
      if (remaining === 0) break;
      const need  = inv.total - inv.allocated;
      const alloc = Math.min(need, remaining);
      if (alloc > 0) {
        await tx.allocations.insert({ sourceLedgerId: credit.id, invoiceId: inv.id, amount: alloc });
        await tx.invoices.applyAllocation(inv.id, alloc);          // update allocated + status
        remaining -= alloc;
      }
    }
    // remaining > 0  => tetap sebagai deposit (kredit belum teralokasi)

    await tx.audit.log('PAYMENT_POSTED', payment);
    await tx.outbox.publish('PAYMENT_POSTED', { paymentId: payment.id });
    return buildResult(payment, credit.balanceAfter);
  });
}
```

### 8.2 Menerbitkan Tagihan & Memakai Deposit

```ts
async function issueInvoice(tx, customer, items, period, dueDate) {
  await lockCustomer(tx, customer.id);
  const number = await nextInvoiceNumber(tx, period);              // lihat 8.4
  const total  = sum(items);
  const inv    = await tx.invoices.insert({ number, customerId: customer.id, total, dueDate, period, snapshot: buildSnapshot(customer, items) });
  await tx.invoiceItems.insertMany(inv.id, items);

  const prev = await lastBalance(tx, customer.id);
  await tx.ledger.insert({ customerId: customer.id, type: 'TAGIHAN', debit: total, kredit: 0,
                           balanceAfter: prev - total, refType: 'INVOICE', refId: inv.id });

  // pakai deposit / kredit bebas (FIFO atas sumber kredit tertua)
  let need = total;
  for (const src of await freeCreditSources(tx, customer.id)) {    // query di bawah
    if (need === 0) break;
    const use = Math.min(src.free, need);
    await tx.allocations.insert({ sourceLedgerId: src.id, invoiceId: inv.id, amount: use });
    need -= use;
  }
  await tx.invoices.recomputeStatus(inv.id);
  await tx.outbox.publish('INVOICE_ISSUED', { invoiceId: inv.id });
  return inv;
}
```

Sumber kredit bebas (deposit):

```sql
SELECT l.id, l.kredit - COALESCE(SUM(a.amount), 0) AS free
FROM ledger_entries l
LEFT JOIN payment_allocations a ON a.source_ledger_id = l.id
WHERE l.customer_id = $1
  AND l.kredit > 0
  AND NOT EXISTS (SELECT 1 FROM ledger_reversals r WHERE r.original_ledger_id = l.id)
GROUP BY l.id, l.kredit, l.seq
HAVING l.kredit - COALESCE(SUM(a.amount), 0) > 0
ORDER BY l.seq;
```

### 8.3 Void Pembayaran & Void Tagihan

*   **Void pembayaran:** (1) kunci pelanggan; (2) buat entri `REVERSAL` (debit sebesar pembayaran) dan catat di `ledger_reversals`; (3) buat alokasi **negatif** untuk semua alokasi bersumber dari kredit tersebut; (4) hitung ulang `allocated` dan status invoice terdampak; (5) set `payments.voided_at`; (6) audit + persetujuan Owner (FR-PAY-06). Dana yang sebelumnya terpakai tidak otomatis dialokasikan ulang karena sumbernya sudah dibatalkan.
*   **Void tagihan:** buat entri `REVERSAL` (kredit sebesar total), alokasi negatif untuk semua alokasi ke invoice tersebut (dana kembali menjadi deposit bebas), set status `BATAL`. Setelah itu jalankan **realokasi** otomatis: dana bebas dialokasikan ke tagihan terbuka lain (FIFO).

### 8.4 Penomoran Invoice Bebas Celah

```sql
-- dijalankan di dalam transaksi penerbitan invoice
INSERT INTO invoice_counters (period, last_seq) VALUES ($1, 1)
ON CONFLICT (period) DO UPDATE SET last_seq = invoice_counters.last_seq + 1
RETURNING last_seq;
```
Baris counter terkunci sampai transaksi selesai, sehingga nomor **berurutan tanpa duplikat**. Jika transaksi gagal, nomor ikut rollback (tanpa celah). Format `INV/{YYYY}/{MM}/{0001}` dirakit dari `period` dan `last_seq` sesuai Pengaturan. Konsekuensi: penerbitan invoice dalam satu periode berjalan serial. Dengan 2.000 invoice < 5 menit, ini dapat diterima.

### 8.5 Generator Tagihan Bulanan

```mermaid
flowchart TD
    S[Scheduler WIB<br/>tgl X jam 00:05] --> L{Dapatkan<br/>distributed lock?}
    L -- tidak --> E[Keluar: sudah berjalan]
    L -- ya --> R[Buat billing_runs<br/>status RUNNING]
    R --> Q[Ambil pelanggan AKTIF<br/>tanpa invoice periode ini]
    Q --> F[Fan-out: 1 job per pelanggan<br/>antrean billing]
    F --> J[Job: transaksi issueInvoice<br/>idempoten via unique index]
    J --> C[Update counter berhasil/gagal]
    C --> D{Semua selesai?}
    D -- ya --> N[Tutup run + ringkasan ke Owner<br/>+ outbox INVOICE_ISSUED]
    D -- tidak --> J
```

Aturan: satu transaksi **per pelanggan** (bukan satu transaksi raksasa). Kegagalan satu pelanggan tidak menghentikan lainnya. Job gagal di-*retry* (maks 3). Pelanggan gagal dilaporkan di `billing_runs` dan dapat dijalankan ulang tanpa duplikasi (unique index).

### 8.6 Rekonsiliasi Harian

Job terjadwal (misal 02:00 WIB) memeriksa invarian I-1 s.d. I-5 untuk seluruh pelanggan. Hasil: ringkasan ke Owner (email/WA) dan metrik. Selisih apa pun (> 0 rupiah) = **alarm tingkat tinggi**.

---

## 9. Background Jobs & Arsitektur Notifikasi

### 9.1 Antrean & Jadwal

| Antrean / Jadwal | Fungsi | Konkurensi | Retry |
| :--- | :--- | :--- | :--- |
| `billing` | Terbitkan invoice per pelanggan | 4 | 3, backoff eksponensial |
| `notify-wa` | Kirim WhatsApp | **1-2** (laju terbatas + jeda acak) | 3, backoff |
| `notify-email` | Kirim Email | 5 | 3 |
| `notify-push` | Kirim push FCM | 10 | 2 |
| `pdf` | Render PDF | 3 | 2 |
| `export` | Ekspor laporan besar | 2 | 1 |
| `import` | Impor CSV/Excel | 1 | 0 (laporan error) |
| Cron `billing-generate` | Generator bulanan | - | - |
| Cron `reminders` | Pengingat jadwal H-3/H/H+3/H+7 | - | - |
| Cron `reconcile` | Rekonsiliasi saldo harian | - | - |
| Cron `link-cleanup` | Bersihkan link & token kedaluwarsa | - | - |
| Cron `backup` | Backup basis data | - | - |
| Cron `outbox-relay` | Salurkan `outbox_events` ke antrean | - | - |

### 9.2 Alur Notifikasi (Outbox)

```mermaid
sequenceDiagram
    participant S as Service (dalam transaksi)
    participant O as outbox_events
    participant R as Outbox Relay
    participant Q as BullMQ
    participant W as Worker
    participant P as Provider (WA/SMTP/FCM)
    S->>O: INSERT event (satu transaksi dengan data bisnis)
    R->>O: poll event belum diproses
    R->>Q: enqueue job notifikasi per kanal
    Q->>W: ambil job
    W->>W: render template + variabel
    W->>P: kirim
    alt sukses
        W->>W: notification_logs = TERKIRIM
    else gagal
        W->>Q: retry (backoff) hingga 3x
        W->>W: setelah habis = GAGAL + alarm jika massal
    end
```

Keuntungan: pembayaran/penerbitan invoice tidak pernah gagal karena provider mati, dan tidak ada event yang hilang bila server restart.

### 9.3 Mitigasi Pemblokiran WhatsApp (R-1)

*   Laju kirim dibatasi (mis. 1 pesan per 3-8 detik acak) dan broadcast dipecah per batch.
*   Pesan transaksional (invoice, konfirmasi bayar) didahulukan dari pengingat massal.
*   Penerima yang berulang gagal ditandai dan dikeluarkan dari broadcast berikutnya.
*   Antarmuka `WhatsAppProvider` sehingga mudah beralih ke WhatsApp Business API resmi.
*   Email dan push sebagai jalur cadangan.

---

## 10. Arsitektur PDF & File

| Topik | Rancangan |
| :--- | :--- |
| **Render** | Template PDF terkode (pdfmake/react-pdf) memakai data dari `invoices.snapshot` + riwayat alokasi. **Tidak** membaca master data langsung agar dokumen lama stabil (FR-INV-02) |
| **Cache** | PDF dirender sekali per "versi" invoice (hash dari snapshot + status + alokasi) dan disimpan di storage. Pembayaran baru menghasilkan versi baru |
| **Font & logo** | Font disematkan dalam paket (mis. Inter/Roboto). Logo & stempel diambil dari storage saat render |
| **Nama file** | `INV-2026-11-0001_CUST-0001.pdf` |
| **Akses** | URL bertanda tangan berumur pendek untuk staf/portal. Untuk WA/Email memakai *secure link* publik berbasis token (hash di DB, kedaluwarsa, dapat dicabut) |
| **Unggahan bukti** | Validasi MIME (JPG/PNG/PDF), maks 5 MB, nama acak, bucket privat, pemindaian ekstensi ganda. Gambar dikompres di sisi klien sebelum unggah |
| **Retensi** | Invoice & bukti bayar disimpan sesuai kebijakan retensi (default 10 tahun untuk dokumen keuangan) **[tinjau dengan konsultan hukum/pajak]** |

---

## 11. Arsitektur Frontend Web

### 11.1 Peta Situs (Sitemap)

**Admin / Owner / Kolektor (`/admin/*`)**

| Menu | Rute | Peran |
| :--- | :--- | :--- |
| Dashboard | `/admin` | Owner, Admin |
| Pelanggan | `/admin/customers` · `/new` · `/:id` (tab: Profil, Langganan, Tagihan, Ledger, Notifikasi) · `/import` | Owner, Admin (Kolektor: daftar ringkas) |
| Paket | `/admin/packages` | Owner, Admin |
| Tagihan | `/admin/invoices` · `/:id` · `/runs` (riwayat generator) | Owner, Admin |
| Pembayaran | `/admin/payments` · `/new` · `/approvals` · `/settlements` | Owner, Admin, Kolektor (terbatas) |
| Notifikasi | `/admin/notifications` (broadcast, log) | Owner, Admin |
| Laporan | `/admin/reports/{revenue,aging,ledger,billing-summary,isolation,collectors}` | Owner, Admin |
| Pengaturan | `/admin/settings/{business,billing,whatsapp,smtp,templates,users}` | Owner |
| Audit Log | `/admin/audit` | Owner |

**Portal Client (`/portal/*`)**: `/portal` (Beranda), `/portal/history` (Riwayat & Mutasi), `/portal/invoices/:id`, `/portal/package`, `/portal/profile`.

**Publik:** `/login`, `/otp`, `/i/:token` (tampilan invoice via secure link), `/privacy`, `/terms`.

### 11.2 Arsitektur Aplikasi

| Aspek | Rancangan |
| :--- | :--- |
| **Routing** | React Router dengan *route guard* berdasar peran. Layout Admin dan Layout Portal dimuat terpisah (*code splitting*) |
| **State server** | TanStack Query (cache, refetch saat fokus, *optimistic update* hanya untuk aksi non-finansial) |
| **State klien** | Minimal (Zustand/Context) untuk sesi & preferensi |
| **Form** | React Hook Form + Zod (skema dibagi dengan backend) |
| **Tabel** | TanStack Table dengan paginasi/sortir/filter **sisi server** |
| **Grafik** | Recharts |
| **Notifikasi UI** | Toast + dialog konfirmasi untuk aksi finansial (tampilkan nama & nominal) |
| **Aksesibilitas & i18n** | Komponen Radix, label Indonesia, format `Intl` (`id-ID`) |
| **Penanganan galat** | Error boundary per rute, pesan ramah, `requestId` ditampilkan untuk dukungan |

### 11.3 Design System (Tailwind)

*   **Token:** warna (primer, sukses, peringatan, bahaya, netral), spasi, radius, bayangan didefinisikan sebagai CSS variable / `@theme` Tailwind v4, mendukung mode terang (mode gelap P2).
*   **Komponen inti:** Button, Input, Select, DataTable, Card/KPI, Badge Status, Dialog, Drawer, Toast, EmptyState, Skeleton, Stepper.
*   **Badge status tagihan (konsisten di web, mobile, PDF):**

| Status | Label | Warna |
| :--- | :--- | :--- |
| `LUNAS` | Lunas | Hijau |
| `DIBAYAR_SEBAGIAN` | Dibayar Sebagian | Kuning/oranye |
| `BELUM_LUNAS` | Belum Lunas | Abu/biru |
| Penanda `Jatuh Tempo` | Jatuh Tempo | Merah (ditambahkan di samping status) |
| `BATAL` | Batal | Abu coret |

*   **Responsif:** *mobile-first* untuk Portal & Kolektor, *desktop-first* untuk Admin. Titik putus Tailwind standar.

---

## 12. Arsitektur Mobile (Capacitor)

### 12.1 Pendekatan

Satu basis kode React yang dibuild menjadi aset statis lalu dibungkus Capacitor (Android & iOS). Rute `/portal/*` dan mode Kolektor dimuat sesuai peran saat login **[OQ-5]**.

### 12.2 Konfigurasi & Plugin

```ts
// capacitor.config.ts (ringkas)
import type { CapacitorConfig } from '@capacitor/cli';
const config: CapacitorConfig = {
  appId: 'id.netbill.app',          // sesuaikan dengan domain usaha
  appName: 'NetBill',
  webDir: 'dist',
  server: { androidScheme: 'https' }, // jangan set server.url di build rilis
  plugins: { SplashScreen: { launchShowDuration: 0 } },
};
export default config;
```

| Kebutuhan | Plugin / Pendekatan |
| :--- | :--- |
| Push notification | `@capacitor/push-notifications` + FCM (APNs key diunggah ke Firebase) |
| Simpan sesi aman | Plugin secure storage (Keychain/Keystore). **Jangan** simpan token di `localStorage` biasa |
| Unduh/bagikan PDF | `@capacitor/filesystem` + `@capacitor/share` |
| Biometrik (P1) | Plugin biometric auth |
| Buka peta/navigasi | `@capacitor/browser` / intent URL `geo:` |
| Status bar, splash, ikon | `@capacitor/status-bar`, `@capacitor/splash-screen`, `@capacitor/assets` |
| Deteksi jaringan | `@capacitor/network` (tampilkan banner offline) |
| Pembaruan paksa | Cek `X-App-Version` → layar "Perbarui aplikasi" |

### 12.3 Hal yang Perlu Diperhatikan

*   **Safe area:** gunakan `viewport-fit=cover` dan `env(safe-area-inset-*)`.
*   **Tombol Back Android:** tangani lewat router agar tidak keluar app tiba-tiba.
*   **Deep link:** tautan notifikasi membuka layar invoice yang relevan.
*   **Performa:** uji di perangkat Android entry-level (RAM 3 GB) sejak sprint awal. Pakai *lazy loading* dan virtualisasi daftar (R-8).
*   **Offline:** cache baca-saja untuk Client (MOB-C-07). Kolektor wajib online di Fase 1 (MOB-A-04).
*   **Rilis:** pipeline membangun AAB (Android) dan arsip iOS via Xcode Cloud/GitHub Actions macOS runner. Distribusi uji lewat Play Internal Testing & TestFlight.

---

## 13. Arsitektur Keamanan

### 13.1 Model Ancaman Ringkas (STRIDE Ringkas)

| Ancaman | Contoh | Kontrol |
| :--- | :--- | :--- |
| **Spoofing** | Menebak login/OTP pelanggan | Rate limit, lockout, OTP 6 digit berumur 5 menit maks 5 percobaan, CAPTCHA/pembatasan ekstra bila perlu |
| **Tampering** | Mengubah nominal/ledger | Ledger append-only (trigger), transaksi ACID, validasi server, audit log |
| **Repudiation** | "Saya tidak mencatat itu" | Audit log tidak dapat diubah, `recorded_by` pada setiap transaksi |
| **Information disclosure** | Client A melihat invoice Client B (IDOR), kebocoran kredensial gateway | Filter kepemilikan wajib, token invoice acak (≥128 bit), enkripsi AES-256 untuk secret, masking di UI/log |
| **Denial of service** | Spam endpoint login/PDF | Rate limit, antrean, ukuran unggah dibatasi |
| **Elevation of privilege** | Kolektor melakukan void | RBAC di API, uji otorisasi otomatis per endpoint |

### 13.2 Kontrol Teknis

| Area | Kontrol |
| :--- | :--- |
| **Transport** | TLS 1.2+ (HSTS), sertifikat otomatis (Let's Encrypt via Caddy) |
| **Header** | CSP ketat, `X-Content-Type-Options`, `Referrer-Policy`, CORS dibatasi ke domain app |
| **Kata sandi** | Argon2id, panjang min 8, daftar sandi umum ditolak |
| **Token** | Access ≤ 15 menit. Refresh dirotasi, deteksi *reuse* (cabut satu *family*) |
| **Secret** | Dienkripsi di DB (AES-256-GCM), kunci master dari env/secret manager, tidak pernah dikembalikan utuh oleh API |
| **Unggahan** | Validasi MIME & ukuran, bucket privat, URL bertanda tangan |
| **Dependensi** | `npm audit`/Dependabot, pin versi, SBOM sederhana |
| **Log** | Tidak mencatat kata sandi, token, OTP, atau isi secret |
| **Backup** | Dienkripsi dan disimpan di lokasi terpisah |
| **Akses server** | SSH key saja, nonaktifkan login root & password, firewall (hanya 80/443 publik), fail2ban |
| **Rahasia di CI** | Disimpan di *secrets* CI, tidak di repositori |

### 13.3 Pengujian Keamanan

Checklist OWASP ASVS Level 1 sebagai acuan, uji otorisasi otomatis per endpoint (matriks peran × endpoint), pindai dependensi di CI, dan **pentest dasar** pada Sprint 10.

---

## 14. Infrastruktur, Deployment & Operasi

### 14.1 Lingkungan

| Lingkungan | Fungsi | Data |
| :--- | :--- | :--- |
| **Local** | Pengembangan (Docker Compose) | Seed data fiktif |
| **CI** | Uji otomatis (Testcontainers) | Efemeral |
| **Staging** | UAT, uji beban, uji migrasi | Salinan data **teranonimisasi** |
| **Production** | Layanan nyata | Data nyata |

### 14.2 Topologi Produksi (Fase 1)

```
Internet ─► Caddy (TLS) ─┬─► web (static)
                         └─► api ──► postgres
                                 ├─► redis
                                 └─► object storage (S3)
                worker ──► postgres / redis / provider eksternal
Backup job ──► storage backup (lokasi/penyedia berbeda)
```

*   Satu VPS (rekomendasi awal 4 vCPU / 8 GB RAM / 100 GB SSD, wilayah Indonesia atau Singapura untuk latensi).
*   Postgres dan Redis dengan volume persisten, `restart: unless-stopped`.
*   Fase 2: pisahkan Postgres ke managed DB / VPS khusus bila beban atau persyaratan ketersediaan meningkat.

### 14.3 CI/CD

```mermaid
flowchart LR
    PR[Pull Request] --> L[Lint + Typecheck]
    L --> UT[Unit Test]
    UT --> IT[Integration Test<br/>Postgres Testcontainers<br/>skenario S1-S8]
    IT --> SC[Scan dependensi]
    SC --> B[Build image]
    B --> M{Merge ke main}
    M --> ST[Deploy Staging otomatis]
    ST --> E2E[E2E Playwright + smoke test]
    E2E --> AP{Persetujuan manual}
    AP --> PR2[Deploy Production<br/>migrasi DB + rolling restart]
    PR2 --> SM[Smoke test + cek /ready]
```

*   **Migrasi DB:** kompatibel mundur (*expand/contract*), dijalankan sebelum rilis kode. Backup otomatis sebelum migrasi produksi.
*   **Rollback:** simpan 3 image terakhir, rollback satu perintah. Migrasi destruktif dilarang tanpa rencana pemulihan.
*   **Feature flag:** fitur P1/P2 dapat dimatikan tanpa rilis ulang.

### 14.4 Backup & Pemulihan

| Item | Kebijakan |
| :--- | :--- |
| **Basis data** | Dump penuh harian + WAL archiving/PITR bila memakai pgBackRest (target RPO ≤ 24 jam, ideal ≤ 15 menit) |
| **Retensi** | Harian 30 hari, mingguan 12 minggu, bulanan 12 bulan |
| **Storage objek** | Replikasi/versioning bucket |
| **Lokasi** | Penyedia atau wilayah **berbeda** dari server utama, terenkripsi |
| **Restore test** | Otomatis bulanan ke lingkungan sementara + uji manual kuartalan (AC-13), RTO ≤ 4 jam |
| **Dokumentasi** | Runbook pemulihan langkah demi langkah (Bagian 19) |

### 14.5 Pemantauan & Alarm

| Sinyal | Alat | Ambang alarm |
| :--- | :--- | :--- |
| Uptime `/health` | Uptime Kuma | Down > 2 menit |
| Error aplikasi | Sentry | Lonjakan error / error baru |
| Latensi API | Metrik/log | p95 > 2 dtk selama 10 menit |
| Antrean | Dashboard BullMQ | Backlog > 500 atau job gagal > 5% |
| Disk/CPU/RAM | Agen host | Disk > 80%, RAM > 85% |
| Job terjadwal | Heartbeat | Generator/rekonsiliasi/backup tidak jalan |
| **Invarian ledger** | Job rekonsiliasi | **Selisih > 0 = kritis** |
| Sertifikat TLS | Uptime Kuma | Kedaluwarsa < 14 hari |

Kanal alarm: WhatsApp/Telegram/Email ke Owner dan engineer jaga.

### 14.6 Kapasitas (Perkiraan, Perlu Diverifikasi dengan Uji Beban)

| Parameter | Perkiraan Fase 1 |
| :--- | :--- |
| Pelanggan aktif | 2.000 (tumbuh ke 5.000) |
| Invoice per bulan | ~2.000 |
| Entri ledger per tahun | ~50.000-60.000 |
| Pengguna aktif bersamaan | < 100 |
| Ukuran DB tahun ke-1 | < 2 GB |
| PDF tersimpan per tahun | ~2.000-6.000 file (< 2 GB) |

Beban ini ringan untuk satu server. Fokus uji beban pada **generator bulanan**, **broadcast**, dan **ekspor laporan**.

### 14.7 SLO Internal

| SLI | SLO |
| :--- | :--- |
| Ketersediaan API | ≥ 99,5% bulanan |
| Latensi p95 baca | < 500 ms |
| Latensi p95 `POST /payments` | < 1 dtk |
| Notifikasi transaksional terkirim | ≥ 95% dalam 5 menit |
| Selisih rekonsiliasi | 0 |

---

## 15. Strategi Pengujian & Kualitas

### 15.1 Piramida Uji

| Level | Cakupan | Alat | Target |
| :--- | :--- | :--- | :--- |
| **Unit** | Util uang, alokasi FIFO, penomoran, validator, template | Vitest/Jest | ≥ 80% pada modul ledger/billing |
| **Integrasi** | API + DB nyata, **skenario S1-S8**, invarian I-1..I-6, idempotensi, konkurensi | Supertest + Testcontainers | Seluruh skenario lulus di CI |
| **Kontrak API** | Skema OpenAPI vs implementasi, kompatibilitas mobile | OpenAPI lint/Dredd | Tidak ada *breaking change* tanpa versi |
| **E2E Web** | Alur utama per peran | Playwright | Smoke di setiap rilis |
| **E2E Mobile** | Login, tagihan, unduh PDF, push, input tunai | Perangkat nyata + Appium/Maestro (opsional) | Sebelum rilis toko |
| **Beban** | Generator 2.000 invoice, 50 pembayaran paralel, 100 pengguna | k6 | AC-04, AC-05 |
| **Keamanan** | Otorisasi, IDOR, rate limit, pentest dasar | Skrip + manual | AC-01, AC-14 |
| **UAT** | Data nyata (salinan), Owner + kolektor | Skrip UAT | AC-15 |
| **Eksplorasi** | Kasus tepi PRD Bagian 11 | Manual | Setiap sprint |

### 15.2 Uji Properti pada Ledger (Wajib)

Uji berbasis properti (mis. fast-check): hasilkan urutan acak operasi (terbit tagihan, bayar sebagian/lebih, void, bayar paralel) lalu pastikan **invarian I-1..I-6 tetap benar** untuk setiap urutan. Ini lebih ampuh daripada uji skenario tetap saja.

### 15.3 Data Uji
*   Generator seed: 2.000 pelanggan sintetis, riwayat 12 bulan, kombinasi cicilan/deposit/void.
*   Tidak ada data pribadi nyata di staging tanpa anonimisasi.

---

## 16. MASTER ROADMAP

### 16.1 Ringkasan Fase

| Fase | Nama | Periode (usulan) | Hasil utama |
| :--- | :--- | :--- | :--- |
| **P** | Pra-proyek / Discovery | 16 Nov - 31 Des 2026 | OQ terjawab, desain UI, akun & infrastruktur siap, kontrak penyedia |
| **M0** | Fondasi | 4 Jan - 15 Jan 2027 | Repo, CI/CD, auth, RBAC, skema DB, design system |
| **M1** | Inti Keuangan | 18 Jan - 26 Feb 2027 | Pelanggan, paket, ledger, billing, pembayaran, void, impor |
| **M2** | Komunikasi & Invoice | 1 Mar - 26 Mar 2027 | PDF, secure link, WA/Email/queue, template, pengingat |
| **M3** | Laporan, Pengaturan & Portal Web | 29 Mar - 9 Apr 2027 | Dashboard, laporan, ekspor, pengaturan, audit, portal Client web |
| **M4** | Mobile | 12 Apr - 7 Mei 2027 | App Client & Kolektor, push, uji perangkat, submit toko |
| **M5** | Hardening & UAT | 10 Mei - 21 Mei 2027 | Uji keamanan/beban, restore test, UAT |
| **M6** | Migrasi & Go-Live | 24 Mei - 18 Jun 2027 | Cutover, paralel 1 siklus, soft launch |
| **GA** | Rilis Umum & Stabilisasi | Jul - Agu 2027 | GA setelah rekonsiliasi nol selisih, hypercare 30 hari |
| **F2** | Fase 2 | Kuartal 3-4 2027 | Auto-isolir, payment gateway, dll. |

> **Catatan jadwal:** Tanggal adalah usulan dengan asumsi kickoff **4 Januari 2027**, tim sesuai Bagian 16.6, dan Open Questions dijawab sebelum 31 Desember 2026. Ada **buffer ± 20%** (di Sprint 10-11 dan jeda toko aplikasi). Perkirakan penyesuaian pada periode libur **Ramadan/Lebaran (sekitar Februari-Maret 2027)**. Verifikasi kalender libur resmi dan ketersediaan tim. Estimasi ini harus divalidasi engineering dan dikunci pada akhir M0.

### 16.2 Gantt Ringkas

```mermaid
gantt
    title NetBill Pro: Master Roadmap (usulan)
    dateFormat  YYYY-MM-DD
    axisFormat  %d %b
    section Pra-proyek
    Discovery, OQ, desain UI, akun & infra   :p0, 2026-11-16, 2026-12-31
    section Pengembangan
    M0 Fondasi (auth, RBAC, DB, CI/CD)       :m0, 2027-01-04, 2027-01-15
    M1 Inti Keuangan                         :m1, 2027-01-18, 2027-02-26
    M2 Komunikasi & Invoice                  :m2, 2027-03-01, 2027-03-26
    M3 Laporan, Pengaturan, Portal Web       :m3, 2027-03-29, 2027-04-09
    M4 Mobile (Client & Kolektor)            :m4, 2027-04-12, 2027-05-07
    M5 Hardening & UAT                       :m5, 2027-05-10, 2027-05-21
    section Peluncuran
    M6 Migrasi, Paralel, Soft Launch         :m6, 2027-05-24, 2027-06-18
    GA & Hypercare                           :ga, 2027-06-21, 2027-08-13
    section Fase 2
    Auto-isolir, Payment Gateway, dll.       :f2, 2027-08-16, 2027-12-17
```

### 16.3 Rencana Sprint (Sprint 2 Minggu)

| Sprint | Tanggal | Fokus | Keluaran (Definition of Done sprint) | FR/MOB utama |
| :--- | :--- | :--- | :--- | :--- |
| **S0 (Pra)** | 16 Nov - 31 Des | Discovery & desain | OQ-1..11 terjawab, wireframe & hi-fi layar inti, pilih WA gateway, siapkan akun Apple/Google/Firebase/domain/VPS, kontrak, finalisasi ADR | - |
| **S1** | 4 - 15 Jan | M0 Fondasi | Monorepo, CI/CD ke staging, skema DB v1 + migrasi, auth (login, refresh, lockout), RBAC guard, design system dasar, layout Admin & Portal kosong | NFR keamanan, FR-SET-06 (dasar) |
| **S2** | 18 - 29 Jan | Master data | CRUD Paket, Pelanggan (+ pencarian), riwayat langganan, status pelanggan, audit log dasar, Pengaturan profil usaha & siklus billing | FR-PKG-01..03, FR-CUS-01..05,07,09, FR-SET-01,02,07 |
| **S3** | 1 - 12 Feb | **Ledger inti** | Modul ledger (posting, alokasi FIFO, trigger append-only), `postPayment`, `issueInvoice`, **skenario S1-S8 lulus otomatis**, uji properti, uji konkurensi | Bagian 6 PRD, FR-PAY-02,04 |
| **S4** | 15 - 26 Feb | Billing & pembayaran UI | Generator bulanan (idempoten, fan-out), invoice UI, form pembayaran, void + persetujuan, penyesuaian, impor CSV (saldo awal), penomoran invoice | FR-BIL-01..09, FR-PAY-01,03,05,06, FR-CUS-06 |
| **S5** | 1 - 12 Mar | M2 Invoice & notifikasi | PDF invoice + snapshot, secure link, outbox + antrean, adapter WA & SMTP, template + variabel, log notifikasi. *Lingkup dijaga ramping (periode Lebaran)* | FR-INV-01..05, FR-NTF-03,04, FR-SET-03,04,05 |
| **S6** | 15 - 26 Mar | Pengingat & broadcast | Broadcast satuan/massal + pratinjau, jadwal pengingat otomatis, retry & kirim ulang, dashboard admin | FR-NTF-01,02, dashboard (Bag. 4.1) |
| **S7** | 29 Mar - 9 Apr | M3 Laporan & Portal Web | 4 laporan inti + Kandidat Isolir + Rekap Kolektor, ekspor PDF/Excel (background), setoran kolektor, **Portal Client web** lengkap | FR-RPT-01..06, FR-PAY-07, MOB-C (web) |
| **S8** | 12 - 23 Apr | M4 Mobile Client | Bungkus Capacitor, login/OTP, beranda, riwayat, unduh/bagikan PDF, info rekening, push FCM/APNs, secure storage | MOB-C-01..06 |
| **S9** | 26 Apr - 7 Mei | M4 Mobile Kolektor & rilis toko | Mode Kolektor (cari, input tunai, kirim struk), peta/navigasi, cache baca-saja, uji perangkat low-end, build TestFlight/Play Internal, kirim review toko | MOB-A-01..04, MOB-C-07 |
| **S10** | 10 - 21 Mei | M5 Hardening & UAT | Pentest dasar, uji beban (AC-04/05), restore test (AC-13), perbaikan bug, UAT Owner + kolektor, bekukan fitur (*code freeze*) | AC-01..15 |
| **S11** | 24 Mei - 4 Jun | M6 Migrasi & paralel | Dry-run migrasi di staging, impor data final, pelatihan, **cutover**, mulai paralel 1 siklus | Bagian 18 |
| **S12** | 7 - 18 Jun | Soft launch & stabilisasi | Soft launch ke seluruh pelanggan, hypercare, perbaikan cepat, verifikasi rekonsiliasi nol selisih | AC-15, KPI Bag. 1.3 PRD |
| **GA** | Jul - Agu | Rilis umum | GA setelah siklus paralel selesai tanpa selisih, penutupan hypercare, retrospektif proyek | - |

**Jalur kritis:** OQ terjawab → skema DB & ledger (S1-S3) → billing & pembayaran (S4) → PDF/notifikasi (S5) → portal web (S7) → mobile (S8-S9) → review toko → UAT → migrasi/cutover. Keterlambatan di ledger (S3) menggeser seluruh jadwal, sehingga S3 mendapat prioritas tertinggi dan reviewer ganda.

### 16.4 Milestone & Quality Gate

| Gate | Waktu | Kriteria lolos | Penentu |
| :--- | :--- | :--- | :--- |
| **G0: Kickoff Ready** | 31 Des 2026 | OQ-1,2,5,8 terjawab, desain inti disetujui, akun & infra siap, anggaran disetujui | Owner + PO |
| **G1: Ledger Proven** | 12 Feb 2027 | S1-S8 + uji properti + uji konkurensi lulus, 0 bug kritis di ledger | Eng Lead + QA |
| **G2: Core MVP (Web)** | 9 Apr 2027 | Alur end-to-end: pelanggan → tagihan → bayar → invoice PDF → kirim WA/Email → laporan, di staging | PO + Owner (demo) |
| **G3: Mobile Beta** | 7 Mei 2027 | Build di TestFlight & Play Internal Testing, uji perangkat lulus, review toko dikirim | PO + QA |
| **G4: Release Candidate** | 21 Mei 2027 | AC-01..14 lulus, pentest tanpa temuan tinggi terbuka, restore test lulus, UAT disetujui | Owner + Eng Lead |
| **G5: Go-Live** | 4 Jun 2027 | Dry-run migrasi sukses, rollback plan teruji, tim dukungan siap, pelatihan selesai | Owner |
| **G6: GA** | Jul-Agu 2027 | Siklus paralel selesai, rekonsiliasi nol selisih, SLO terpenuhi, hypercare selesai | Owner |

### 16.5 Prioritas Cakupan (MoSCoW terhadap Jadwal)

Jika jadwal tertekan, urutan pemotongan (dari yang pertama ditunda):

1.  **Won't (Fase 1):** FR-PAY-08 (konfirmasi transfer pelanggan), FR-BIL-10 (pembulatan), FR-NTF-06, MOB-C-02/08, WebSocket real-time.
2.  **Could:** FR-CUS-04 (due day per pelanggan), FR-PKG-04 prorata, FR-BIL-04 prorata, FR-RPT-06 rekap kolektor, FR-PAY-07 setoran kolektor, FR-NTF-02 jadwal pengingat (bisa manual dulu), mode gelap.
3.  **Should:** FR-CUS-08, FR-BIL-07, FR-RPT-05, MOB-C-07.
4.  **Must (tidak boleh dipotong):** seluruh **P0** pada PRD, terutama ledger, alokasi, void, idempotensi, RBAC, PDF + pengiriman, laporan inti, impor data, backup.

### 16.6 Tim & RACI

**Komposisi tim yang diasumsikan** *(sesuaikan dengan kondisi nyata)*:

| Peran | Alokasi | Fokus |
| :--- | :--- | :--- |
| Product Owner / PM | 50% | Prioritas, UAT, komunikasi dengan Owner |
| UI/UX Designer | 50% (puncak S0-S2) | Wireframe, hi-fi, design system |
| Backend/Fullstack Engineer ×2 | 100% | Ledger, billing, API, worker |
| Frontend/Mobile Engineer ×1 | 100% | Web, Portal, Capacitor |
| QA Engineer | 50-100% (puncak S3, S7-S10) | Uji, otomasi, UAT |
| DevOps / SRE | 20-30% | CI/CD, infra, backup, pemantauan |
| Perwakilan Owner usaha | Ad hoc | Keputusan bisnis, UAT, data |

**RACI** (R = Responsible, A = Accountable, C = Consulted, I = Informed)

| Aktivitas | Owner | PO | Eng Lead | Dev | QA | UX | DevOps |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Jawab Open Questions | A | R | C | C | I | I | I |
| Desain UI/UX | C | A | C | I | I | R | I |
| Arsitektur & ADR | I | C | A/R | C | I | I | C |
| Implementasi ledger & billing | I | C | A | R | C | I | I |
| Pengujian & Quality Gate | I | C | A | R | R | I | C |
| Infrastruktur, CI/CD, backup | I | I | A | C | I | I | R |
| Migrasi data | A | R | C | R | R | I | C |
| UAT | A | R | C | I | R | I | I |
| Keputusan go-live | A | R | C | I | C | I | C |
| Rilis toko aplikasi | I | A | C | R | C | I | R |

### 16.7 Dependensi Eksternal & Tenggat

| Dependensi | Dibutuhkan paling lambat | Pemilik | Risiko jika terlambat |
| :--- | :--- | :--- | :--- |
| Penyedia WA Gateway & kredensial uji | Sebelum S5 (1 Mar 2027) | Owner/PO | Notifikasi tidak dapat diuji (R-1) |
| Akun Apple Developer (program berbayar tahunan), Google Play Console, Firebase | Sebelum S8 (12 Apr 2027). **Disarankan daftar di S0** karena verifikasi dapat memakan waktu | PO/Owner | Mobile tertunda (R-5) |
| Domain, DNS, VPS, SMTP | Sebelum S1 | DevOps | Staging tidak tersedia |
| Data pelanggan & saldo awal (spreadsheet) | Sebelum S4 (15 Feb 2027) untuk uji impor, final di S11 | Owner | Migrasi tertunda (R-3) |
| Logo, stempel digital, info rekening usaha | Sebelum S5 | Owner | Invoice tidak lengkap |
| Kebijakan privasi & ketentuan layanan | Sebelum submit toko (S9) | Owner/PO + konsultan | Penolakan toko |

### 16.8 Rencana Rilis & Versi

| Rilis | Isi | Audiens |
| :--- | :--- | :--- |
| **v0.x (Alpha)** | Per sprint di staging | Tim internal |
| **v0.9 (Beta)** | Setelah G3: web lengkap + mobile beta | Owner, kolektor, 10-20 pelanggan terpilih |
| **v1.0-rc** | Setelah G4 | Owner + UAT |
| **v1.0 (Soft Launch)** | Go-live Juni 2027, paralel dengan sistem lama | Semua pelanggan (sistem lama tetap sebagai pembanding) |
| **v1.0 (GA)** | Setelah paralel sukses | Umum |
| **v1.1+** | Perbaikan hypercare & backlog P1/P2 | Umum |
| **v2.0 (Fase 2)** | Auto-isolir, payment gateway, dll. | Umum |

---

## 17. Backlog Epik & Keterlacakan Requirement

### 17.1 Epik

| Epik | Nama | Cakupan | Sprint |
| :--- | :--- | :--- | :--- |
| **E1** | Fondasi & Auth | Repo, CI/CD, auth, RBAC, design system | S1 |
| **E2** | Master Data | Pelanggan, paket, langganan, impor, audit dasar | S2, S4 |
| **E3** | Ledger & Billing | Ledger, alokasi, generator, invoice, penomoran | S3, S4 |
| **E4** | Pembayaran | Pencatatan, void, persetujuan, setoran | S3, S4, S7 |
| **E5** | Invoice & Notifikasi | PDF, secure link, outbox, WA/Email/Push, template, pengingat | S5, S6 |
| **E6** | Laporan & Dashboard | Dashboard, 6 laporan, ekspor | S6, S7 |
| **E7** | Pengaturan & Audit | Pengaturan terpusat, pengguna, audit log | S2, S5, S7 |
| **E8** | Portal Client Web | Layout & halaman portal | S7 |
| **E9** | Mobile | Capacitor, push, mode Client & Kolektor, rilis toko | S8, S9 |
| **E10** | Migrasi & Go-Live | Impor final, paralel, cutover, pelatihan | S11, S12 |
| **E11** | Kualitas & Keamanan | Uji properti, beban, pentest, backup/restore, UAT | Berkelanjutan, puncak S10 |

### 17.2 Matriks Keterlacakan (FR → Epik → Sprint → Acceptance Criteria)

| FR/MOB | Epik | Sprint | AC |
| :--- | :--- | :--- | :--- |
| FR-CUS-01..05,07,09 | E2 | S2 | AC-02 |
| FR-CUS-06 | E2 | S4 | AC-10 |
| FR-CUS-08 | E2 | S7 | AC-03 |
| FR-PKG-01..03 | E2 | S2 | - |
| FR-PKG-04 | E2/E3 | S4-S7 (Could) | - |
| FR-BIL-01,02,05,06,08,09 | E3 | S3-S4 | AC-03, AC-05 |
| FR-BIL-03,04,07,10 | E3 | S4 | - |
| FR-PAY-01..06 | E4 | S3-S4 | AC-03, AC-04, AC-09 |
| FR-PAY-07 | E4 | S7 | - |
| FR-PAY-08 | E4 | Fase 2 | - |
| FR-INV-01..05 | E5 | S5 | AC-06, AC-07 |
| FR-NTF-01,03,04,05 | E5 | S5-S6, S8 | AC-07 |
| FR-NTF-02 | E5 | S6 | - |
| FR-RPT-01..04 | E6 | S6-S7 | AC-08 |
| FR-RPT-05,06 | E6 | S7 | - |
| FR-SET-01..07 | E7 | S2, S5, S7 | AC-14 |
| MOB-C-01..06 | E9 | S8 | AC-11, AC-12 |
| MOB-C-07 | E9 | S9 | AC-11 |
| MOB-A-01..04 | E9 | S9 | AC-11 |
| NFR keamanan | E1/E11 | S1-S10 | AC-01, AC-14 |
| NFR backup/pemulihan | E11 | S10 | AC-13 |

---

## 18. Rencana Migrasi Data & Cutover Go-Live

### 18.1 Strategi: Paralel Satu Siklus

Sistem baru berjalan **berdampingan** dengan sistem lama selama satu siklus penagihan penuh. Sistem lama tetap menjadi acuan sampai rekonsiliasi menunjukkan selisih nol.

### 18.2 Tahapan Migrasi

| Tahap | Kegiatan | Waktu | Keluaran |
| :--- | :--- | :--- | :--- |
| **1. Inventarisasi** | Kumpulkan seluruh spreadsheet/buku, tentukan kolom pemetaan | S0-S2 | Peta kolom + template impor |
| **2. Pembersihan** | Hilangkan duplikat, normalisasi nomor WA ke `628xxx`, lengkapi alamat/paket, tetapkan status | S2-S4 | Data bersih (dikerjakan bersama Owner) |
| **3. Penentuan saldo awal** | Per pelanggan: **tunggakan** (→ invoice tipe `SALDO_AWAL` agar aging & alokasi berjalan) atau **deposit** (→ entri kredit `SALDO_AWAL`) per **tanggal cut-off** | S4 | Tabel saldo awal ditandatangani Owner |
| **4. Dry-run #1** | Impor ke staging, bandingkan total tunggakan/deposit & jumlah pelanggan dengan sumber | S5-S6 | Laporan selisih |
| **5. Dry-run #2 (UAT)** | Impor ulang data terbaru, Owner & kolektor uji alur nyata | S10 | Persetujuan UAT |
| **6. Dry-run final** | Latihan cutover lengkap (termasuk rollback) | S11 | Checklist cutover tervalidasi |
| **7. Cutover** | Bekukan perubahan di sistem lama, impor final, verifikasi total, buka akses | S11 | Sistem baru aktif |
| **8. Paralel & rekonsiliasi** | Catat transaksi di kedua sistem untuk satu siklus, bandingkan mingguan | S11-S12 + GA | Berita acara rekonsiliasi |

### 18.3 Verifikasi Cutover (Wajib Cocok)

*   Jumlah pelanggan per status.
*   Σ tunggakan dan Σ deposit sistem baru = sumber (selisih 0 rupiah).
*   Sampel 5% pelanggan diperiksa satu per satu.
*   Semua nomor WA valid dan unik.
*   Akun portal dibuat dan kredensial awal siap dikirim.

### 18.4 Checklist Go-Live

- [ ] Gate G4 lulus (AC-01..14), UAT ditandatangani
- [ ] Backup otomatis aktif + restore test terbaru lulus
- [ ] Monitoring & alarm aktif, kontak jaga terdaftar
- [ ] Gateway WA/SMTP/Push terhubung & lolos uji kirim ke nomor/email nyata
- [ ] Profil usaha, logo, stempel, rekening, template pesan final
- [ ] Penomoran invoice & tanggal siklus dikonfirmasi Owner
- [ ] Akun staf dibuat, peran benar, sandi awal diganti
- [ ] App terbit di Play Store & App Store (atau tersedia via TestFlight/Internal)
- [ ] Kebijakan privasi & ketentuan layanan terpublikasi
- [ ] Pelatihan admin & kolektor selesai, panduan tersedia
- [ ] Rencana komunikasi ke pelanggan siap (pengumuman via WA)
- [ ] Rencana rollback & kriteria pemicunya disepakati
- [ ] Tim hypercare dijadwalkan

### 18.5 Rencana Rollback

*   **Pemicu:** selisih rekonsiliasi > 0 yang tidak dapat dijelaskan dalam 24 jam, bug kritis pada ledger/pembayaran, atau gateway tidak berfungsi dan tidak ada jalur cadangan.
*   **Tindakan:** hentikan penerbitan tagihan di sistem baru, kembali ke sistem lama sebagai acuan (tetap berjalan selama paralel), pulihkan basis data ke titik sebelum cutover bila perlu, komunikasikan ke staf dan pelanggan, perbaiki, ulangi dry-run.

### 18.6 Hypercare (30 Hari Pertama)

Pemantauan harian, kanal dukungan prioritas (grup WA staf), triase bug dengan SLA (kritis < 4 jam, tinggi < 1 hari, sedang < 1 minggu), laporan mingguan ke Owner (KPI, selisih, error), retrospektif di akhir.

---

## 19. Operasional: SOP, Pelatihan, Dukungan, Runbook

### 19.1 SOP Operasional Harian/Bulanan (untuk Admin)

| Frekuensi | Kegiatan |
| :--- | :--- |
| **Harian** | Cek dashboard, status antrean/log notifikasi gagal (kirim ulang), verifikasi setoran kolektor |
| **Mingguan** | Tinjau laporan piutang/aging, kirim pengingat, cek daftar Kandidat Isolir |
| **Bulanan** | Verifikasi hasil generator (billing run), cek rekap billed vs collected, ekspor laporan untuk pembukuan |
| **Kuartalan** | Tinjau akun staf & hak akses, restore test, ganti kredensial penting |

### 19.2 Panduan Pelatihan

| Audiens | Materi | Durasi | Format |
| :--- | :--- | :--- | :--- |
| Owner | Dashboard, laporan, persetujuan void, pengaturan, audit | 2 jam | Sesi langsung + panduan PDF |
| Admin | Pelanggan, paket, tagihan, pembayaran, pengingat, impor, koreksi | 3 jam | Praktik dengan data uji |
| Kolektor | Cari pelanggan, input tunai, kirim struk, setoran | 1 jam | Praktik langsung di HP |
| Pelanggan | Login, lihat tagihan, unduh invoice | Pesan singkat + panduan bergambar | Broadcast WA |

### 19.3 Dukungan Pengguna (Support)

*   **Tingkat 1:** Admin (jawab pertanyaan pelanggan, reset sandi).
*   **Tingkat 2:** Tim engineering via kanal dukungan (sertakan `requestId`).
*   **Eskalasi:** insiden keuangan (selisih saldo) langsung ke Eng Lead + Owner.

### 19.4 Runbook Insiden (Ringkas)

| Insiden | Deteksi | Tindakan awal | Pemulihan |
| :--- | :--- | :--- | :--- |
| **API down** | Uptime Kuma | Cek container/log, restart `api`, cek disk/DB | RCA, perbaiki akar masalah |
| **Gateway WA down/diblokir** | Lonjakan status GAGAL | Jeda antrean WA, alihkan ke Email/Push, ganti penyedia/nomor | Kirim ulang pesan tertunda secara bertahap |
| **Generator gagal sebagian** | Ringkasan `billing_runs` | Lihat daftar pelanggan gagal, perbaiki data, jalankan ulang (idempoten) | Konfirmasi total tagihan = jumlah pelanggan aktif |
| **Selisih rekonsiliasi** | Alarm kritis | Bekukan penulisan untuk pelanggan terdampak, ambil snapshot, telusuri entri ledger & alokasi | Koreksi lewat entri penyesuaian/reversal, bukan edit data |
| **Kebocoran kredensial** | Laporan/anomali | Ganti secret & token, cabut sesi, audit akses | Pemberitahuan sesuai ketentuan UU PDP bila data pribadi terdampak |
| **DB rusak / hilang** | Alarm | Hentikan tulis, ikuti runbook pemulihan | Restore dari backup + PITR, verifikasi invarian, laporan insiden |
| **Disk penuh** | Alarm 80% | Bersihkan log/artefak lama, perbesar volume | Atur rotasi log & retensi |

### 19.5 Pemeliharaan Berkelanjutan

Pembaruan dependensi bulanan, patch keamanan segera untuk kerentanan kritis, pembaruan OS server terjadwal, peninjauan kuota gateway & biaya, dan peninjauan backlog Fase 2 setiap kuartal.

---

## 20. Kepatuhan, Hukum & Rilis Toko Aplikasi

### 20.1 Kepatuhan Data Pribadi (UU No. 27 Tahun 2022 tentang PDP)

| Aspek | Tindakan |
| :--- | :--- |
| Dasar pemrosesan & persetujuan | Persetujuan jelas saat pendaftaran pelanggan dan tercatat |
| Minimisasi data | Hanya kumpulkan data yang dibutuhkan layanan & penagihan |
| Hak subjek data | Prosedur akses/perbaikan/penghapusan data (kecuali yang wajib disimpan untuk pencatatan keuangan) |
| Keamanan | Enkripsi, RBAC, audit log (Bagian 13) |
| Retensi | Kebijakan retensi tertulis |
| Insiden | Prosedur pemberitahuan kebocoran data (runbook) |
| Dokumen | **Kebijakan Privasi** dan **Ketentuan Layanan** dalam bahasa Indonesia |

*Disarankan konsultasi singkat dengan konsultan hukum untuk finalisasi dokumen kebijakan dan retensi data keuangan.*

### 20.2 Pajak & Pembukuan
Dokumen invoice/kuitansi pada Fase 1 **bukan faktur pajak**. Bila usaha berstatus PKP atau membutuhkan PPN, tentukan di **OQ-4** dan konsultasikan dengan akuntan sebelum desain invoice dikunci.

### 20.3 Checklist Rilis Toko Aplikasi

| Item | Google Play | Apple App Store |
| :--- | :--- | :--- |
| Akun pengembang | Play Console (biaya sekali bayar) | Apple Developer Program (biaya tahunan) |
| Kebijakan privasi (URL publik) | Wajib | Wajib |
| Formulir data safety / privacy nutrition label | Data safety | App Privacy |
| **Penghapusan akun** | Wajib tersedia opsi permintaan hapus akun (di app dan/atau web) | Wajib tersedia penghapusan akun di dalam app bila app mendukung pembuatan akun |
| Akun demo untuk reviewer | Sediakan kredensial uji | Wajib sediakan kredensial uji |
| Aset | Ikon, screenshot, deskripsi, kategori | Ikon, screenshot per ukuran, deskripsi, kategori |
| Izin | Notifikasi, (lokasi bila dipakai) dengan alasan jelas | Teks alasan izin (Info.plist) |
| Target API level | Sesuai persyaratan terbaru Play | Sesuai SDK/Xcode terbaru yang disyaratkan |
| Waktu review | Sisakan buffer **1-2 minggu** | Sisakan buffer **1-2 minggu** (pengajuan ulang mungkin) |

*Persyaratan toko berubah berkala. Verifikasi dokumentasi resmi terbaru sebelum S8.*

---

## 21. Estimasi Biaya Infrastruktur (Perkiraan)

> Angka berikut adalah **perkiraan kasar** untuk perencanaan. Verifikasi harga aktual penyedia sebelum menganggarkan.

| Komponen | Perkiraan | Catatan |
| :--- | :--- | :--- |
| VPS 4 vCPU / 8 GB / 100 GB | Rp 300.000 - 700.000 / bulan | Tergantung penyedia & wilayah |
| Object storage + backup eksternal | Rp 50.000 - 200.000 / bulan | Tumbuh sesuai file |
| Domain | ± Rp 150.000-300.000 / tahun | |
| WhatsApp Gateway | Rp 100.000 - 500.000 / bulan | Sangat bervariasi, tergantung penyedia/volume |
| SMTP (email transaksional) | Gratis - Rp 200.000 / bulan | Tergantung volume |
| FCM (push) | Gratis | |
| Sentry / Uptime Kuma | Gratis (tier dasar) / self-host | |
| Apple Developer Program | 99 USD / tahun | Biaya resmi Apple |
| Google Play Console | 25 USD sekali bayar | Biaya resmi Google |
| **Total operasional bulanan (indikatif)** | **± Rp 0,5 - 1,5 juta** | Di luar biaya tim pengembang |

---

## 22. Register Risiko Lanjutan

Melengkapi R-1..R-8 pada PRD v1.1.

| ID | Risiko | Prob. | Dampak | Mitigasi | Pemilik |
| :--- | :--- | :---: | :---: | :--- | :--- |
| R-9 | OQ tidak terjawab sebelum kickoff (terutama OQ-1, OQ-5, OQ-8) | Sedang | Tinggi | Gate G0 mengikat, rapat keputusan di S0 | PO/Owner |
| R-10 | Ledger/alokasi lebih kompleks dari estimasi (void, realokasi) | Sedang | Tinggi | Sprint S3 khusus, uji properti, reviewer ganda, prioritas tertinggi | Eng Lead |
| R-11 | Periode Ramadan/Lebaran menurunkan ketersediaan tim | Tinggi | Sedang | Lingkup S5 dijaga ramping, buffer 20%, rencana libur disepakati sejak awal | PO |
| R-12 | Review toko aplikasi mundur atau ditolak | Sedang | Sedang | Mendaftar akun di S0, submit awal di S9, siapkan akun demo & kebijakan privasi | PO/Dev |
| R-13 | Satu orang kunci (bus factor) pada ledger/DevOps | Sedang | Tinggi | Dokumentasi, pair programming, rotasi review, runbook | Eng Lead |
| R-14 | Scope creep (permintaan fitur tambahan saat pengembangan) | Tinggi | Sedang | Backlog terkelola, MoSCoW (16.5), perubahan lewat change request | PO |
| R-15 | Data migrasi tidak lengkap/tidak akurat sehingga UAT gagal | Sedang | Tinggi | Dry-run berulang, verifikasi sampel, tanda tangan Owner atas saldo awal | PO/Owner |
| R-16 | Adopsi rendah oleh kolektor (kebiasaan lama) | Sedang | Sedang | Pelatihan langsung, UI ringkas, periode paralel, insentif | Owner |
| R-17 | Ketergantungan pada satu penyedia WA | Sedang | Sedang | Antarmuka provider, jalur Email/Push, evaluasi API resmi | Eng Lead |
| R-18 | Biaya operasional membengkak (gateway, storage) | Rendah | Sedang | Pemantauan biaya bulanan, retensi file, kuota | DevOps |
| R-19 | Regulasi/kebijakan platform berubah (WA, toko aplikasi) | Sedang | Sedang | Pemantauan kebijakan, desain fleksibel | PO |

---

## 23. Definition of Ready / Done & Quality Gates

### 23.1 Definition of Ready (Story Siap Dikerjakan)
- [ ] Terhubung ke ID requirement PRD (`FR-*`/`MOB-*`) dan epik
- [ ] Acceptance criteria tertulis (Given/When/Then)
- [ ] Desain UI tersedia (bila ada UI)
- [ ] Dependensi & data uji teridentifikasi
- [ ] Estimasi disepakati tim (≤ 5 hari kerja, kalau lebih dipecah)
- [ ] Dampak keamanan/otorisasi dan audit sudah dipikirkan

### 23.2 Definition of Done (Story Selesai)
- [ ] Kode lulus review (2 reviewer untuk ledger/billing)
- [ ] Lint, typecheck, uji unit & integrasi lulus di CI
- [ ] Uji otorisasi (peran × endpoint) ditambahkan/diperbarui
- [ ] Tidak ada nominal berbasis float, tidak ada penulisan langsung ke ledger di luar modul `ledger`
- [ ] Audit log & penanganan error/idempotensi diterapkan bila relevan
- [ ] Dokumentasi API (OpenAPI) dan catatan perubahan diperbarui
- [ ] Teks UI dalam Bahasa Indonesia, responsif, aksesibel dasar
- [ ] Diuji di staging, disetujui PO
- [ ] Tidak ada bug severity tinggi terbuka

### 23.3 Klasifikasi Severity Bug

| Severity | Definisi | Contoh | SLA perbaikan (pasca go-live) |
| :--- | :--- | :--- | :--- |
| **Kritis** | Kehilangan/kesalahan data finansial, kebocoran data, sistem tidak dapat dipakai | Saldo salah, IDOR | < 4 jam |
| **Tinggi** | Fitur utama rusak tanpa solusi sementara | Invoice tidak terkirim | < 1 hari |
| **Sedang** | Fitur rusak dengan solusi sementara | Filter laporan keliru | < 1 minggu |
| **Rendah** | Kosmetik/minor | Salah ketik label | Backlog |

---

## 24. Lampiran

### 24.1 Variabel Lingkungan (Contoh)

| Variabel | Contoh / Keterangan |
| :--- | :--- |
| `NODE_ENV` | `production` |
| `APP_BASE_URL` | `https://app.contoh.id` |
| `DATABASE_URL` | `postgres://user:pass@postgres:5432/netbill` |
| `REDIS_URL` | `redis://redis:6379` |
| `JWT_ACCESS_SECRET` / kunci privat | Rahasia kuat, rotasi berkala |
| `JWT_ACCESS_TTL` | `900` (detik) |
| `JWT_REFRESH_TTL` | `2592000` (30 hari) |
| `SECRETS_ENCRYPTION_KEY` | Kunci AES-256 (base64) untuk enkripsi secret di DB |
| `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY` | Storage objek |
| `FCM_SERVICE_ACCOUNT_JSON` | Kredensial Firebase |
| `SENTRY_DSN` | Pemantauan error |
| `TZ` | `Asia/Jakarta` |
| `CORS_ORIGINS` | Domain web/app yang diizinkan |
| `INVOICE_LINK_TTL_DAYS` | `7` |

*Kredensial WA/SMTP **tidak** disimpan di env, melainkan di tabel `settings` terenkripsi dan dikelola Owner lewat UI.*

### 24.2 Template Pesan Default (Dapat Diubah di Pengaturan)

**Tagihan Baru Terbit (WA)**
```
Halo {nama_pelanggan},
Tagihan internet {nama_usaha} periode {periode} telah terbit.

Nomor      : {nomor_invoice}
Tagihan    : {jumlah_tagihan}
Total bayar: {total_bayar}
Jatuh tempo: {jatuh_tempo}

Unduh invoice: {link_invoice}
Pembayaran ke: {rekening}
Terima kasih.
```

**Pengingat Jatuh Tempo (WA)**
```
Halo {nama_pelanggan}, pengingat: tagihan {periode} sebesar {total_bayar}
jatuh tempo pada {jatuh_tempo}. Invoice: {link_invoice}
Abaikan pesan ini jika sudah membayar. Terima kasih.
```

**Konfirmasi Pembayaran Lunas (WA)**
```
Terima kasih {nama_pelanggan}. Pembayaran {jumlah_dibayar} untuk periode {periode}
telah kami terima. Status: LUNAS. Kuitansi: {link_invoice}
```

**Konfirmasi Pembayaran Sebagian (WA)**
```
Terima kasih {nama_pelanggan}. Pembayaran {jumlah_dibayar} telah kami terima.
Sisa tagihan: {sisa_tagihan}, jatuh tempo {jatuh_tempo}. Kuitansi: {link_invoice}
```

**Pembayaran Dibatalkan (WA)**
```
Halo {nama_pelanggan}, pembayaran {jumlah_dibayar} tanggal {tanggal_bayar}
dibatalkan karena koreksi pencatatan. Hubungi kami bila ada pertanyaan.
```

Variabel tambahan di luar PRD FR-NTF-03: `{jumlah_dibayar}`, `{sisa_tagihan}`, `{tanggal_bayar}` (ditambahkan untuk template konfirmasi).

### 24.3 Kode Error Standar (Contoh)

| Kode | HTTP | Arti |
| :--- | :--- | :--- |
| `AUTH_INVALID_CREDENTIALS` | 401 | Login salah |
| `AUTH_LOCKED` | 423 | Akun terkunci sementara |
| `FORBIDDEN_ROLE` | 403 | Peran tidak diizinkan |
| `NOT_FOUND` | 404 | Data tidak ditemukan (juga dipakai untuk akses data milik orang lain) |
| `VALIDATION_FAILED` | 422 | Input tidak valid |
| `PAYMENT_AMOUNT_INVALID` | 422 | Nominal ≤ 0 atau tidak wajar |
| `PAYMENT_DATE_FUTURE` | 422 | Tanggal bayar di masa depan |
| `PAYMENT_DUPLICATE_SUSPECTED` | 409 | Pembayaran serupa baru saja dicatat (perlu konfirmasi) |
| `IDEMPOTENCY_CONFLICT` | 409 | Kunci sama dengan payload berbeda |
| `INVOICE_ALREADY_EXISTS` | 409 | Tagihan periode ini sudah ada |
| `INVOICE_VOIDED` | 409 | Tagihan sudah dibatalkan |
| `APPROVAL_REQUIRED` | 202 | Aksi menunggu persetujuan Owner |
| `APP_UPGRADE_REQUIRED` | 426 | Versi app terlalu lama |
| `RATE_LIMITED` | 429 | Terlalu banyak permintaan |
| `PROVIDER_UNAVAILABLE` | 503 | Gateway eksternal tidak tersedia |

### 24.4 Konvensi Status & Label (Sumber Tunggal)

| Kode internal | Label UI/PDF |
| :--- | :--- |
| `BELUM_LUNAS` | Belum Lunas |
| `DIBAYAR_SEBAGIAN` | Dibayar Sebagian |
| `LUNAS` | Lunas |
| `BATAL` | Batal |
| `AKTIF` / `ISOLIR` / `BERHENTI` | Aktif / Isolir / Berhenti |
| Penanda turunan | Jatuh Tempo |

### 24.5 Pustaka Skenario Uji Wajib (Ringkasan)

Seluruh S1-S8 PRD Bagian 6.5, ditambah:

| # | Skenario tambahan |
| :--- | :--- |
| T-9 | Pembayaran dengan 3 tagihan terbuka: dialokasikan FIFO, sisa menjadi deposit |
| T-10 | Pembayaran ditujukan eksplisit ke tagihan terbaru (bukan FIFO) |
| T-11 | Void tagihan yang sudah dibayar sebagian: dana kembali menjadi deposit lalu direalokasi |
| T-12 | Dua pembayaran paralel pada pelanggan sama: saldo & alokasi konsisten |
| T-13 | Permintaan pembayaran diulang dengan `Idempotency-Key` sama: hanya satu pembayaran |
| T-14 | Generator dijalankan dua kali: tidak ada tagihan ganda |
| T-15 | Impor saldo awal tunggakan & deposit: ledger, aging, dan alokasi benar |
| T-16 | Pelanggan berhenti dengan deposit: refund → saldo 0 |
| T-17 | Client mengakses invoice milik pelanggan lain: 404 |
| T-18 | Kolektor mencoba void / metode non-tunai: 403 |
| T-19 | Gateway WA mati saat pembayaran: pembayaran tetap tersimpan, notifikasi antre lalu terkirim saat pulih |
| T-20 | Reversal pembayaran yang dananya sudah dialokasikan ke 2 tagihan: kedua tagihan kembali ke status semula |

---

*Akhir dokumen. Dokumen ini hidup, diperbarui di setiap gate (G0-G6) dan setiap kali Open Questions terjawab.*
