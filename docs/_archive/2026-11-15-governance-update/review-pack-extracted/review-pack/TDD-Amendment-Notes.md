# TDD Amendment Notes (untuk Rekonsiliasi TDD)

| Atribut | Isi |
| :--- | :--- |
| Berlaku untuk | TDD-RTRW-2026-001 v1.1 → **v1.2** |
| Tanggal | 15 November 2026 |
| Mengapa dokumen ini | TDD terbaru tidak ikut diunggah, jadi perubahan diberikan dalam bentuk **lokasi → sebelum → sesudah** agar dapat diterapkan langsung ("Langkah Berikutnya #2" di STATE) |
| Sumber koreksi | SPEC-LEDGER-001 v1.1 §0 (E-1..E-7), diverifikasi model referensi (18/18 vektor, uji properti, 2 uji mutasi) |

---

## A. Amandemen Teks TDD

### A1. Kontrol dokumen
**Sebelum:** `Versi | 1.1 (Draft for Review): menambahkan Bagian 25 ...`
**Sesudah:** `Versi | 1.2 (Draft for Review): + Bagian 25 Modular; koreksi erratum E-1..E-7 (ledger); keputusan T1 (pnpm), T2 (Prisma + SQL mentah)`

### A2. §7.2 Skema Inti: tambah banner dan koreksi DDL
**Tambahkan di bawah judul §7.2:**
> **DDL final yang berlaku adalah migrasi di repositori.** Blok di bawah adalah acuan desain yang telah dikoreksi pada E-3 dan E-5. Verifikasi migrasi dengan *Schema Conformance Checklist* (Bagian B dokumen ini).

**`invoices` (E-5)**
- Sebelum: `total bigint NOT NULL CHECK (total >= 0),`
- Sesudah: `total bigint NOT NULL CHECK (total > 0),  -- invoice harus > 0 (ledger butuh debit > 0)`

**`payment_allocations` (E-3)**
- Sebelum: `invoice_id uuid NOT NULL REFERENCES invoices(id),`
- Sesudah:
```sql
  invoice_id       uuid REFERENCES invoices(id),
  refund_ledger_id uuid REFERENCES ledger_entries(id),   -- alokasi menuju invoice ATAU refund
  ...
  CHECK ((invoice_id IS NULL) <> (refund_ledger_id IS NULL))
```
Alasan: pemakaian deposit untuk refund tidak dapat dicatat bila `invoice_id` wajib terisi.

**`ledger_type` (E-4):** `PENYESUAIAN_DEBIT` tetap ada di enum, tetapi **tidak dipakai di Fase 1**. Debit tambahan (denda, biaya) dibuat sebagai invoice `MANUAL`.

### A3. §7.4 Invarian: ganti seluruh tabel
| ID | Invarian |
| :--- | :--- |
| I-1 | `balance_after` entri terakhir pelanggan = Σ`kredit` − Σ`debit` (semua entri), dan berurutan per entri |
| I-2 | `invoices.allocated` = Σ`payment_allocations.amount` (**bertanda**) untuk invoice itu, dan `0 ≤ allocated ≤ total` |
| I-3 | **saldo = (Σ dana bebas dari sumber kredit yang belum dibalik) − (Σ sisa tagihan terbuka bukan BATAL)**. Entri `REVERSAL` tidak pernah menjadi sumber dana (E-1) |
| I-4 | Per sumber: `0 ≤ Σ alokasi ≤ kredit` |
| I-5 | Tidak ada invoice teralokasi melebihi `total`. Invoice `BATAL` memiliki alokasi bersih 0 |
| I-6 | Ledger & alokasi tidak pernah berubah/terhapus (trigger) |
| **I-7** (baru) | Dana bebas > 0 hanya bila tidak ada invoice terbuka |
| **I-8** (baru) | Status tiap invoice konsisten dengan alokasi (`BELUM_LUNAS` / `DIBAYAR_SEBAGIAN` / `LUNAS` / `BATAL`) |

### A4. §8.2 Query sumber dana bebas (E-1: perbaikan bug)
Tambahkan satu baris pada klausa `WHERE`:
```sql
  AND l.kredit > 0
  AND l.type IN ('PEMBAYARAN', 'PENYESUAIAN_KREDIT', 'SALDO_AWAL')   -- E-1: REVERSAL bukan sumber dana
  AND NOT EXISTS (SELECT 1 FROM ledger_reversals r WHERE r.original_ledger_id = l.id)
```
**Bukti bug:** tanpa filter tipe, void tagihan membuat entri `REVERSAL` kredit yang terhitung sebagai deposit. Uji mutasi menangkapnya pada langkah ke-1 s.d. ke-2 urutan acak (I-3 dilanggar).

### A5. §8 (judul "Algoritma Inti"): tambah banner
> **Algoritma kanonik: SPEC-LEDGER-001 §4.1** (fungsi tunggal `reallocate`). Pseudo-kode di bagian ini adalah gambaran awal. Bila berbeda, SPEC-LEDGER-001 yang berlaku. Model referensi tervalidasi: `docs/test-plan/reference-model/`.

### A6. §8.3 Void: tambah aturan BR-V6 (E-7)
Tambahkan pada "Void pembayaran":
> Void **ditolak** `409 PAYMENT_PARTIALLY_REFUNDED` bila ada alokasi netto > 0 dari kredit pembayaran itu menuju refund. Tanpa aturan ini saldo tidak lagi sesuai (I-3 dilanggar) karena uang sudah keluar.

### A7. Referensi invarian
- §8.6 "invarian I-1 s.d. I-5" → "**I-1 s.d. I-8**"
- §15.2 "invarian I-1..I-6" → "**I-1..I-8**"

### A8. §2.2 Catatan keputusan arsitektur
- ADR-06: status → **Diterima** (OQ-5 FINAL). ADR-10: status → **Diterima** (OQ-1 FINAL).
- Tambahkan **ADR-19** (model referensi ledger), **ADR-20** (Documentation-First), **ADR-21** (pnpm, T1), **ADR-22** (Prisma untuk CRUD + SQL mentah untuk ledger, T2). Lihat `ADR-Register.md`.
- ADR-08: perjelas "pdfmake" (alternatif react-pdf).

### A9. §4 Tech Stack: baris "Akses data"
- Sebelum: `Prisma atau Kysely (SQL mentah untuk bagian kritis ledger)`
- Sesudah: `Prisma untuk CRUD; **SQL mentah** ($queryRaw/$executeRaw dalam transaksi interaktif) untuk seluruh penulisan ledger/alokasi (T2, ADR-22). Package manager: pnpm (T1, ADR-21)`

### A10. §24.3 Kode error: tambah
| Kode | HTTP | Arti |
| :--- | :--- | :--- |
| `PAYMENT_PARTIALLY_REFUNDED` | 409 | Void ditolak: dana pembayaran sudah (sebagian) di-refund |
| `ALREADY_VOIDED` | 409 | Objek sudah di-void |
| `SETTLEMENT_CONFIRMED` | 409 | Void ditolak: pembayaran sudah masuk setoran kolektor terkonfirmasi |
| `INSUFFICIENT_DEPOSIT` | 409 | Refund melebihi dana bebas |

### A11. §24.5 Pustaka skenario uji: hindari tabrakan penomoran
TDD §24.5 memakai T-9..T-20 dengan makna berbeda dari ID vektor di SPEC-LEDGER (`T-16` = refund, `T-17` = IDOR, dst.). Agar tidak tabrakan, vektor baru diberi ID **T21** dan **T22**. Tambahkan baris:

| # | Skenario tambahan |
| :--- | :--- |
| T-21 | Void pembayaran yang dananya sudah di-refund ditolak (`PAYMENT_PARTIALLY_REFUNDED`), ledger tidak berubah |
| T-22 | Void tagihan yang sudah lunas: dana kembali menjadi deposit; entri `REVERSAL` kredit **bukan** sumber dana |

Pemetaan ID vektor ↔ skenario TDD: S8 = T-16 (refund); T12a/T12b = T-12; T13 = T-13; T15 = T-15; T11 = T-11; S7 = T-20. T-14 (generator ganda), T-17 s.d. T-19 bukan vektor ledger dan diuji pada spec/modul masing-masing.

### A12. §16 Roadmap & gerbang
- Tambahkan **fase Documentation-First** sebagai prasyarat G1 dan petakan Tahap A/B/C0-C3 ke S1-S3 (lihat tabel di `STATE.md`).
- Kriteria **G1 (Ledger Proven)** tambahkan: model referensi berjalan di CI, skor mutasi zona merah ≥ ambang, 18 vektor + N-1..N-13 lulus, tes ditinjau manusia.

---

## B. Schema Conformance Checklist (untuk Migrasi Prisma Tahap C0-C1)

> **Migrasi C1 dibekukan.** Bila pemeriksaan menunjukkan skema belum memuat E-3/E-5, perbaikannya adalah **migrasi baru forward-only** (mis. `C1b`) yang membutuhkan otorisasi IMPLEMENTATION tersendiri dan keputusan Owner (E-3 hanya diperlukan untuk refund P1; E-5 adalah usulan aturan bisnis). Jangan mengedit migrasi C1.

Jalankan pada database hasil `prisma migrate deploy` (lokal/Testcontainers). **Nama tabel di bawah memakai snake_case**: sesuaikan bila model Prisma Anda dipetakan lain (`@@map`). Semua kueri memakai katalog standar PostgreSQL.

| # | Pemeriksaan | Kueri | Hasil yang diharapkan |
| :--- | :--- | :--- | :--- |
| B1 | Trigger append-only dan guard | `SELECT c.relname, t.tgname, pg_get_triggerdef(t.oid) FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid WHERE NOT t.tgisinternal AND c.relname IN ('ledger_entries','payment_allocations','audit_logs','invoices','payments') ORDER BY 1,2;` | `ledger_entries`, `payment_allocations`, `audit_logs`: trigger `BEFORE UPDATE OR DELETE` yang melempar galat. `invoices`: guard yang menolak ubah `total/number/customer_id/snapshot/type/period` |
| B2 | CHECK constraint | `SELECT conrelid::regclass AS tabel, conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE contype='c' AND conrelid::regclass::text IN ('ledger_entries','payment_allocations','invoices','payments') ORDER BY 1,2;` | `ledger_entries`: `(debit = 0) <> (kredit = 0)`, `debit >= 0`, `kredit >= 0`. `payment_allocations`: `amount <> 0` dan `(invoice_id IS NULL) <> (refund_ledger_id IS NULL)` **(E-3)**. `invoices`: `total > 0` **(E-5)**, `allocated >= 0 AND allocated <= total`. `payments`: `amount > 0` |
| B3 | Kolom alokasi | `SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name='payment_allocations' ORDER BY ordinal_position;` | `invoice_id` = YES, `refund_ledger_id` ada dan = YES |
| B4 | Index penting | `SELECT tablename, indexname, indexdef FROM pg_indexes WHERE tablename IN ('invoices','payments','ledger_entries','payment_allocations') ORDER BY 1,2;` | Unique **parsial** pada `invoices(customer_id, period) WHERE type='BULANAN' AND status <> 'BATAL'`. Unique pada `payments.idempotency_key`. Index `ledger_entries(customer_id, seq DESC)`. Index alokasi pada `invoice_id` dan `source_ledger_id` |
| B5 | Semua kolom uang bertipe `bigint` | `SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND column_name IN ('amount','total','debit','kredit','balance_after','price','allocated','install_fee') AND data_type <> 'bigint';` | **0 baris** |
| B6 | Hak peran aplikasi | `SELECT grantee, table_name, privilege_type FROM information_schema.role_table_grants WHERE table_name IN ('ledger_entries','payment_allocations','ledger_reversals','audit_logs') AND privilege_type IN ('UPDATE','DELETE','TRUNCATE') AND grantee NOT IN ('postgres');` | **0 baris** untuk peran yang dipakai aplikasi |
| B7 | `request_hash` & idempotensi | Periksa kolom `payments.request_hash` (atau tabel kunci idempotensi) | Ada (deteksi kunci sama dengan payload berbeda) |
| B8a | Statement-level `TRUNCATE` | `SELECT c.relname, t.tgname FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid WHERE NOT t.tgisinternal AND (t.tgtype & 32) = 32;` | Trigger `BEFORE TRUNCATE` pada tabel ledger (usulan), atau pastikan peran aplikasi tanpa hak TRUNCATE (B6). `TRUNCATE` **tidak** tercegah oleh trigger baris `BEFORE UPDATE OR DELETE` |
| B8 | Tabel pendukung | `ledger_reversals` (PK `original_ledger_id`, unik `reversal_ledger_id`), `outbox_events`, `invoice_counters`, `payment_methods`/`item_kinds` (bila ADR-17 diterima) | Ada |

**Tes perilaku DB (wajib sebagai tes integrasi, N-9 dan terkait):**
1. `UPDATE`/`DELETE` pada `ledger_entries` dan `payment_allocations` → galat.
2. `INSERT` ledger dengan `debit = kredit = 0`, atau keduanya > 0 → galat CHECK.
3. `INSERT` invoice `total = 0` → galat CHECK.
4. `INSERT` alokasi dengan `invoice_id` dan `refund_ledger_id` **keduanya** NULL, atau **keduanya** terisi → galat CHECK.
5. Dua invoice `BULANAN` periode sama untuk pelanggan sama (tidak BATAL) → pelanggaran unique.
6. `UPDATE invoices SET total = ...` pada invoice terbit → galat guard.

---

## C. Aturan Operasional untuk Keputusan T2 (Prisma + SQL Mentah)

| Aturan | Penegakan yang disarankan |
| :--- | :--- |
| Klien Prisma **tidak boleh** menulis `ledger_entries`, `payment_allocations`, `ledger_reversals` di luar modul `ledger` | Aturan ESLint (contoh di bawah). Sesuaikan nama model dengan skema Anda |
| Penulisan ledger memakai transaksi interaktif + SQL mentah (`SELECT ... FOR UPDATE` pada pelanggan terlebih dahulu) | Review zona merah + uji konkurensi (AC-L3) |
| Skema Prisma tidak memakai `Float`/`Decimal` untuk nominal | `! grep -nE '\b(Float\|Decimal)\b' prisma/schema.prisma` di CI |
| Dilarang `prisma db push` selain lokal sekali pakai | Skrip npm dibatasi, review |
| Migrasi baru yang berisi `DROP TRIGGER/CONSTRAINT/INDEX` harus ditinjau manual | `grep -Ei 'drop (trigger\|constraint\|index)' prisma/migrations/<baru>/migration.sql` di CI, gagal bila ada tanpa persetujuan |
| Cek drift antara migrasi dan skema | `prisma migrate diff --from-migrations ... --to-schema-datamodel ... --shadow-database-url ... --exit-code` di CI. **Verifikasi flag sesuai versi Prisma Anda**, dan uji bahwa objek kustom (trigger, CHECK, index parsial) **tidak** diusulkan untuk di-DROP oleh `prisma migrate dev` |
| `BigInt` diserialkan ke JSON sebagai **string** | Uji kontrak API |

```js
// eslint.config.js (potongan): tabel ledger hanya boleh diakses modul ledger
{
  files: ['apps/**/*.ts'],
  ignores: ['apps/api/src/modules/ledger/**'],
  rules: {
    'no-restricted-syntax': ['error', {
      selector: "MemberExpression[property.name=/^(ledgerEntry|paymentAllocation|ledgerReversal)$/]",
      message: 'Tabel ledger hanya boleh diakses modul ledger (ADR-22, SPEC-LEDGER).',
    }],
  },
}
```

---

## D. Daftar Periksa Penerapan
- [ ] A1-A12 diterapkan pada TDD
- [ ] Bagian B dijalankan pada migrasi Prisma, hasil dicatat di `STATE.md`
- [ ] Bagian C: aturan lint dan CI ditambahkan
- [ ] ADR Register v1.1 dan berkas `adr/` menggantikan register lama
