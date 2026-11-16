# SPEC-BILLING-001: Billing Module Design — Invoice Generation, Arrears, Statement

**Zona risiko:** 🔴 Merah | **Prioritas:** P0 | **Modul:** `billing`
**Fase:** C5.0 documentary (per `DEC-2026-11-15-BILLINGC5-001`)
**Sumber:** PRD v1.2 §5.2-5.3, TDD v1.1 §7.2, `SPEC-PKG-SUB-001 v1.1`, `SPEC-LEDGER-001 v1.1`, `ADR-0008`, decisions.log (`DEC-2026-11-15-BILLING-001`, `DEC-2026-11-15-BILLINGC5-001`)
**Status:** v1.0 DRAFT (skeleton) — reference vectors deferred to v1.1

| Atribut | Detail |
| :--- | :--- |
| **ID Dokumen** | SPEC-BILLING-001 |
| **Versi** | 1.0 DRAFT (skeleton): struktur + business rules; reference vectors v1.1 |
| **Tanggal** | 2026-11-16 |
| **Mencakup** | FR-BIL-01..FR-BIL-09 (invoice generation, arrears, statement, aging) |
| **Fungsi dokumen** | Functional spec modul Billing; kunci jawaban untuk tes billing (pola sama dengan SPEC-LEDGER) |
| **Referensi wajib** | `DEC-2026-11-15-BILLING-001`, `DEC-2026-11-15-BILLINGC5-001`, `SPEC-PKG-SUB-001 v1.1`, `SPEC-LEDGER-001 v1.1`, `ADR-0008` (proposed) |

---

## 0. Erratum

None (file baru).

---

## 1. Tujuan

Mendefinisikan aturan bisnis, kontrak layanan internal, snapshot model, dan invarian untuk modul `billing` — lapisan yang membangun invoice dari langganan aktif, menghitung prorata, mengelola tunggakan lintas periode, dan menyiapkan statement per periode. Billing **tidak** menulis ledger langsung; semua pergerakan uang lewat `LedgerService`.

---

## 2. Peran & Otorisasi

Mengikuti pola `SPEC-LEDGER-001` §2. Modul `billing` tidak menambah role baru. Eksekusi dijaga oleh role `OWNER`, `ADMIN`; `KOLEKTOR` hanya baca + trigger collect.

| Operasi | Owner | Admin | Kolektor | Client |
| :--- | :---: | :---: | :---: | :---: |
| Trigger batch issue | ✔ | ✔ | ✖ | ✖ |
| Issue invoice individual | ✔ | ✔ | ✖ | ✖ |
| Generate statement | ✔ | ✔ | ◐ (read-only view) | ✔ (milik sendiri) |
| Void invoice | ✔ | ◐ (butuh approve Owner) | ✖ | ✖ |

---

## 3. Aturan Bisnis (Dapat Diuji)

### 3.1 Invoice Generation

- **BR-BILL-1.** Invoice per periode dibuat untuk setiap `Subscription` aktif (`end_date IS NULL`) pada tanggal jatuh tempo batch periode.
- **BR-BILL-2.** Invoice period menggunakan `subscriptions.price_at_start` sebagai `total` dasar (snapshot harga). Perubahan harga paket hanya berlaku untuk invoice periode berikutnya (non-retroaktif).
- **BR-BILL-3.** Aktivasi tanggal 1 = `total = price_at_start` (PENUH); aktivasi tengah periode = `total = prorata_amount` (formula §6.2 `SPEC-PKG-SUB-001 v1.1`).
- **BR-BILL-4.** Invoice number = `INV/YYYY/MM/NNNN`, reset per bulan, per periode (`OQ-E`).

### 3.2 Arrears Lintas Periode

- **BR-BILL-5.** Billing **tetap menerbitkan** invoice periode baru meskipun pelanggan memiliki tunggakan periode sebelumnya (arrears).
- **BR-BILL-6.** Arrears dihitung dari ledger state, **bukan** kolom tersimpan. Konsisten dengan `DEC-2026-11-15-BILLINGC5-001` item #5 (status derived, not stored).

### 3.3 Snapshot & Non-Retroactivity

- **BR-BILL-7.** Setiap invoice menyimpan snapshot: nama paket, harga, `due_date`, `grace_period_days`, `isolation_date = due_date + grace_period_days`, `arrears_at_issue`, data pelanggan. Snapshot **immutable** setelah issue.
- **BR-BILL-8.** Perubahan konfigurasi (`billing.grace_period_days`, harga paket, diskon) **tidak** retroaktif.

### 3.4 Statement

- **BR-BILL-9.** Statement periodik = agregasi (Σ arrears belum lunas) + (Σ invoice periode berjalan) − (Σ pembayaran periode berjalan). Representasi: satu dokumen statement PDF per issue date (immutable) — format PDF di `SPEC-INVOICE-DOCS-001` (belum dibuat).

---

## 4. Kontrak Layanan Internal (Modul `billing`)

Metode publik (interface stabil):

- `issueMonthlyInvoices(period: string)` — generator batch, idempoten per (customer, period).
- `issueInvoiceForSubscription(subscriptionId, period)` — single-issue.
- `computeArrears(customerId)` — derived dari ledger.
- `generateStatement(customerId, period)` — delegate PDF rendering ke `SPEC-INVOICE-DOCS-001`.

**Larangan:** Billing tidak menulis `ledger_entries` atau `payment_allocations` langsung. Semua via `LedgerService` (`SPEC-LEDGER-001` §4).

---

## 5. Data & Snapshot

### 5.1 Tabel yang disentuh

- `invoices` (create + snapshot column)
- `subscriptions` (read)
- `packages` (read — harga via subscription)
- `customers` (read — data snapshot)
- **Tidak menulis** `ledger_entries` / `payments` / `payment_allocations`

### 5.2 Snapshot structure

Refer ke `SPEC-PKG-SUB-001 v1.1` §5. Spec ini konsumsi, tidak mendefinisikan ulang.

### 5.3 Reconstructability

`grace_period_days` dan `isolation_date` di-snapshot per invoice; reconstructable tanpa query config saat ini. Non-retroaktif dijamin di data layer.

---

## 6. Invarian (Ledger Reconciliation)

- **INV-BILL-1.** Total tagihan di statement = Σ `ledger_entries.type='TAGIHAN'` untuk customer + period. Reconciliation ke ledger, bukan arithmetic sum dari `invoices.total`.
- **INV-BILL-2.** Setiap invoice yang di-issue memiliki tepat satu entry `TAGIHAN` di ledger dengan `refType='INVOICE'`, `refId=invoice.id`.
- **INV-BILL-3.** Status invoice (`BELUM_LUNAS`, `DIBAYAR_SEBAGIAN`, `LUNAS`, `BATAL`) diturunkan dari `payment_allocations`, bukan kolom manual (konsisten `SPEC-LEDGER-001` §3.3).

---

## 7. Alur & Kasus Tepi

### 7.1 Alur Utama (batch bulanan)

1. Trigger: cron / manual owner → `issueMonthlyInvoices(period)`.
2. Untuk tiap `Subscription` aktif → `issueInvoiceForSubscription(...)`.
3. Compute prorata jika aktivasi tengah periode.
4. Build snapshot (termasuk `grace_period_days`, `isolation_date`).
5. Call `LedgerService.issueInvoice(...)`.
6. Return summary.

### 7.2 Kasus Tepi

- **Concurrency:** no double-issue per (customer, period) — unique constraint.
- **Retry:** failed customer dapat retry tanpa mempengaruhi yang sudah sukses.
- **Tanpa subscription aktif:** skip.
- **Void invoice:** reversal via `LedgerService.voidInvoice`; snapshot tetap ada.

---

## 8. Kunci Jawaban Berangka (Reference Vectors)

**Status: SKELETON v1.0** — full vectors akan diisi di v1.1 setelah implementasi billing stabil. Format contoh:

| # | Kondisi awal | Aksi | Hasil yang diharapkan |
| :--- | :--- | :--- | :--- |
| TV-BILL-01 | Customer aktif, subscription 110k, period baru | `issueMonthlyInvoices("2026-06")` | Invoice 110k; due_date periode; isolation_date=due+14; ledger TAGIHAN 110k |
| TV-BILL-02 | Aktivasi 20 Mei, period Mei (31 hari), price 110k | `issueInvoiceForSubscription(...)` | total = prorata 42.581; snapshot simpan price 110k, remaining_days=12, total_days=31 |
| (full suite v1.1) | ... | ... | ... |

**Note v1.1 requirement:** ≥10 vectors covering full period, mid-period prorata, month-end boundary (28/29/30/31), leap year, arrears cross-period, void invoice, retry idempotency.

---

## 9. Acceptance Criteria (Given/When/Then)

- **AC-BILL-1.** Given subscription aktif, When batch period dipicu, Then invoice terbit dengan `total = price_at_start` dan ledger entry `TAGIHAN` tercipta.
- **AC-BILL-2.** Given aktivasi tengah periode, When invoice terbit, Then `total = round((remaining_days / total_days_in_period) * price_at_start)` dan snapshot menyimpan parameter.
- **AC-BILL-3.** Given config `billing.grace_period_days` berubah dari 14 → 21, When invoice baru terbit, Then invoice lama tetap 14 di snapshot; invoice baru pakai 21.
- **AC-BILL-4.** Given customer punya arrears periode lampau, When invoice periode baru terbit, Then statement menampilkan (Σ arrears) + (invoice baru) − (pembayaran), total sesuai ledger.
- **AC-BILL-5.** Given batch sudah pernah jalan untuk (customer, period), When dipicu ulang, Then idempotent — tidak ada double invoice.

---

## 10. Tes yang Wajib Ada

- **Unit:** formula prorata (edge: hari 1, hari terakhir, bulan 28/29/30/31, leap year).
- **Integrasi:** `issueMonthlyInvoices` + `LedgerService.issueInvoice` + `reallocate` end-to-end.
- **Idempotency:** trigger batch dua kali → 1 invoice.
- **Non-retroactivity:** snapshot tetap walau config berubah.
- **Reconciliation:** total statement = Σ ledger `TAGIHAN`.
- **Otorisasi:** hanya `OWNER`/`ADMIN` boleh trigger batch.

---

## 11. UI (jika ada)

**Di luar lingkup spec ini.** UI billing (batch trigger, period picker, statement viewer) akan dispesifikasikan di spec terpisah saat fase implementasi UI.

---

## 12. Di Luar Lingkup (Eksplisit)

- **PDF format / secure link / immutable snapshot semantics** → lihat `SPEC-INVOICE-DOCS-001` (belum dibuat; next work unit).
- **Implementasi skema C5.0** (migration, schema change) — governance status per `DLR-06` = "Schema implementation NOT AUTHORIZED"; spec ini documentary saja.
- **OQ-D (Mei 2026 discrepancy — sample 20k vs 42.581):** TBD sampai data historis tersedia (per `DEC-2026-11-15-BILLINGC5-001` OQ-D).
- **Frontend billing UI.**
- **Notification / WhatsApp reminder** (S5).

---

## 13. Pertanyaan Terbuka

| # | Pertanyaan | Status |
| :--- | :--- | :--- |
| OQ-D | Sample Mei 2026 (31 hari) aktivasi tgl 20, price 110k → prorata 42.581, tertulis 20.000. Ada diskon/kebijakan khusus sistem lama? | **TBD** — perlu data historis |
| OQ-F | Boundary prorata: aktivasi **tepat di** `period_start` = PENUH atau PRORATA? | Default PENUH; confirm Owner |
| OQ-G | Retry policy untuk failed customer dalam batch — manual atau auto? | Default manual; confirm Owner |

---

*Skeleton draft v1.0. Reference vectors (§8) akan diisi di v1.1 setelah implementasi billing stabil dan minimal 10 vectors siap. Implementasi butuh otorisasi terpisah per governance (DLR-06, DEC-2026-11-15-BILLINGC5-001).*
