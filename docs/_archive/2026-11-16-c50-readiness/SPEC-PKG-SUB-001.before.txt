# SPEC-PKG-SUB-001: Packages & Subscriptions Design

**Zona risiko:** 🟡 Kuning | **Prioritas:** P0 | **Modul:** packages, subscriptions
**Fase:** C5.0 (documentary) → C5.1 (billing)
**Sumber:** PRD v1.2 §5.2, TDD v1.1 §7.2, decisions.log (Q-1, Q-2, Q-3, OQ-3)
**Status:** DRAFT untuk review Owner

---

## 1. Tujuan

Mendefinisikan model data dan aturan bisnis untuk katalog paket internet dan langganan pelanggan, sebagai fondasi modul Billing.

## 2. Entity: packages

| Field | Tipe | Wajib | Constraint |
| :--- | :--- | :---: | :--- |
| id | UUID | Ya | PK |
| code | TEXT | Ya | UNIQUE (mis: PKT-10M) |
| name | TEXT | Ya | Mis: Paket Keluarga 10 Mbps |
| speed_down | INT | Tidak | Deskriptif |
| speed_up | INT | Tidak | Deskriptif |
| price | BIGINT | Ya | CHECK (price >= 0) |
| install_fee | BIGINT | Ya | CHECK (install_fee >= 0) DEFAULT 0 |
| description | TEXT | Tidak | |
| status | ENUM | Ya | AKTIF / ARSIP |
| created_at | TIMESTAMPTZ | Ya | DEFAULT now() |
| updated_at | TIMESTAMPTZ | Ya | |

### Aturan Bisnis Packages
- BR-PKG-1: `code` unik dan tidak diubah setelah dibuat.
- BR-PKG-2: Harga boleh berubah; berlaku periode berikutnya (FR-PKG-02).
- BR-PKG-3: Paket yang dipakai pelanggan aktif hanya bisa diarsipkan.
- BR-PKG-4: Arsip paket tidak mengubah invoice lama (snapshot).

## 3. Entity: subscriptions

| Field | Tipe | Wajib | Constraint |
| :--- | :--- | :---: | :--- |
| id | UUID | Ya | PK |
| customer_id | UUID | Ya | FK customers(id) |
| package_id | UUID | Ya | FK packages(id) |
| price_at_start | BIGINT | Ya | CHECK (price_at_start >= 0) |
| start_date | DATE | Ya | |
| end_date | DATE | Tidak | CHECK (end_date IS NULL OR end_date >= start_date) |
| created_at | TIMESTAMPTZ | Ya | DEFAULT now() |

### Aturan Bisnis Subscriptions
- BR-SUB-1: Satu pelanggan hanya punya SATU langganan aktif (partial unique index: `WHERE end_date IS NULL`).
- BR-SUB-2: Pindah paket = tutup langganan lama (isi end_date) + buat baru.
- BR-SUB-3: Harga invoice mengikuti `price_at_start` (snapshot), bukan harga paket terkini.
- BR-SUB-4: Pelanggan tanpa langganan aktif tidak dapat ditagih.

## 4. Field Tambahan: customers.username_hotspot

| Field | Tipe | Wajib | Constraint |
| :--- | :--- | :---: | :--- |
| username_hotspot | TEXT | (OQ-A) | UNIQUE |

### Aturan Bisnis username_hotspot
- BR-HOT-1: Unik dalam scope sistem (single-tenant).
- BR-HOT-2: Normalisasi ke lowercase, trim spasi.
- BR-HOT-3: Jangan asumsikan sama dengan `customers.code`.
- BR-HOT-4: Perubahan username tercatat di audit log.

## 5. Relasi Customer–Subscription–Invoice

- `customers` 1 ──── 0..1 `subscriptions` (aktif)
- `subscriptions` 1 ──── N `invoices` (via field baru `invoices.subscription_id` NULLABLE)
- `customers` 1 ──── N `invoices`

### Field Tambahan di invoices
| Field | Tipe | Keterangan |
| :--- | :--- | :--- |
| subscription_id | UUID NULL | Referensi langganan yang ditagih |

### Snapshot Invoice wajib memuat:
- Nama paket, kecepatan, harga (saat terbit)
- due_date, grace_period_days
- Data pelanggan (nama, alamat, ID member, username hotspot)
- Arrears sebelumnya (jika ada)

## 6. Prorata Rules (OQ-3 REVISED)

### 6.1 Kapan Prorata
- Aktivasi tanggal 1 (awal periode): PENUH
- Aktivasi di tengah periode: PRORATA

### 6.2 Formula
```
prorata_amount = round((remaining_days / total_days_in_period) * monthly_price)
```

### 6.3 Parameter
- remaining_days = total_days_in_period - (activation_day - 1)
- total_days_in_period = actual (28/29/30/31)
- monthly_price = subscriptions.price_at_start
- Rounding: ke Rp 1 (konfigurabel)

### 6.4 Catatan Discrepancy Sample
Statement sample: Mei 2026 (31 hari) aktivasi 20 Mei, price 110k → seharusnya prorata 42.581. Namun tertulis 20.000. **Kemungkinan ada diskon/kebijakan khusus sistem lama.** Perlu klarifikasi (OQ-D).

## 7. Arrears Handling
- Billing menerbitkan invoice periode baru meski ada tunggakan lama.
- Statement menampilkan: (Σ tunggakan lama) + (tagihan periode ini).
- Aging report menggunakan due_date invoice tertua yang belum lunas.

## 8. Grace Period (Q-3)
- Default: 14 hari
- Configurable via settings (key: billing.grace_period_days)
- IsolationDate = DueDate + GracePeriodDays
- Disimpan di invoice snapshot (tidak retroaktif)

## 9. Hubungan dengan Ledger (C3)
- Modul billing memanggil `LedgerService.issueInvoice` (sudah ada).
- Ledger tidak tahu packages/subscriptions. Ia hanya menerima total, dueDate, number, period.
- Snapshot dibangun oleh Billing sebelum memanggil Ledger.

## 10. Dampak Skema (PROPOSAL — BELUM DIIMPLEMENTASIKAN)

```sql
-- (Proposal, bukan migrasi aktif)
CREATE TABLE packages (...);
CREATE TABLE subscriptions (...);
ALTER TABLE customers ADD COLUMN username_hotspot TEXT UNIQUE;
ALTER TABLE invoices ADD COLUMN subscription_id UUID NULL REFERENCES subscriptions(id);
CREATE UNIQUE INDEX uq_active_subscription ON subscriptions(customer_id) WHERE end_date IS NULL;
```

## 11. Open Questions untuk Owner

| # | Pertanyaan | Rekomendasi |
| :--- | :--- | :--- |
| OQ-A | username_hotspot wajib atau opsional? | Opsional (bisa diisi nanti) |
| OQ-B | Prorata sebelum atau setelah diskon? | Sebelum diskon (diskon item terpisah) |
| OQ-C | Grace period global atau per-customer? | Global (Fase 1), override di Fase 2 |
| OQ-D | Sample: Mei=20k bukan 42.581. Ada diskon khusus? | Perlu klarifikasi sistem lama |
| OQ-E | Format invoice number per periode atau global? | Per periode (reset tiap bulan) |

## 12. Acceptance Criteria (untuk implementasi nanti)

- AC-PKG-1: Paket dapat dibuat, diubah, diarsipkan tanpa merusak invoice lama.
- AC-SUB-1: Satu pelanggan = satu langganan aktif.
- AC-SUB-2: Pindah paket menghasilkan langganan baru + end_date pada lama.
- AC-PRO-1: Aktivasi tgl 1 = PENUH; tgl 15 = PRORATA (formula §6.2).
- AC-BIL-1: Billing menghasilkan invoice per periode untuk pelanggan AKTIF.
- AC-BIL-2: Statement snapshot tidak berubah retroaktif.

---

*Proposal desain. Implementasi menunggu otorisasi Owner.*

---

## 13. Owner Decisions (15 November 2026)

| # | Keputusan |
| :--- | :--- |
| OQ-A | `username_hotspot` OPSIONAL. Partial unique index: `WHERE username_hotspot IS NOT NULL`. |
| OQ-B | PRORATA dihitung dari harga dasar (sebelum diskon). Diskon = item terpisah. |
| OQ-C | Grace period GLOBAL 14 hari (Fase 1). Override per-customer = Fase 2. |
| OQ-D | Diskon Mei 2026 = TBD (perlu data historis). Billing = prorata murni sementara. |
| OQ-E | Invoice number PER PERIODE (reset tiap bulan). |

**Status:** Disetujui. Siap untuk implementasi schema (C5.0-impl).

---

## 13. Owner Decisions (15 November 2026)

| # | Keputusan |
| :--- | :--- |
| OQ-A | `username_hotspot` OPSIONAL. Partial unique index: `WHERE username_hotspot IS NOT NULL`. |
| OQ-B | PRORATA dihitung dari harga dasar (sebelum diskon). Diskon = item terpisah. |
| OQ-C | Grace period GLOBAL 14 hari (Fase 1). Override per-customer = Fase 2. |
| OQ-D | Diskon Mei 2026 = TBD (perlu data historis). Billing = prorata murni sementara. |
| OQ-E | Invoice number PER PERIODE (reset tiap bulan). |

**Status:** Disetujui. Siap untuk implementasi schema (C5.0-impl).

## 13. Owner Decisions (15 November 2026)
| # | Keputusan |
| :--- | :--- |
| OQ-A | `username_hotspot` OPSIONAL. Partial unique index: `WHERE username_hotspot IS NOT NULL`. |
| OQ-B | PRORATA dihitung dari harga dasar (sebelum diskon). Diskon = item terpisah. |
| OQ-C | Grace period GLOBAL 14 hari (Fase 1). |
| OQ-D | Diskon Mei 2026 = TBD. Billing = prorata murni sementara. |
| OQ-E | Invoice number PER PERIODE. |
**Status:** Disetujui. Siap untuk implementasi schema.
