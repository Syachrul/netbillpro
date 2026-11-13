# SPEC-LEDGER-001: Ledger, Alokasi Pembayaran, Penerbitan Tagihan & Void

Zona risiko: 🔴 **Merah**    Prioritas: **P0**    Modul: `ledger` (+ pemanggil dari `billing`, `payments`)    Sprint: **S3-S4**

| Atribut | Detail |
| :--- | :--- |
| **ID Dokumen** | SPEC-LEDGER-001 |
| **Versi** | 1.0 (Draft for Review) |
| **Tanggal** | 13 November 2026 |
| **Mencakup** | FR-PAY-02, FR-PAY-03, FR-PAY-04, FR-PAY-06, FR-BIL-02, FR-BIL-05, FR-BIL-06, FR-BIL-08, FR-BIL-09, FR-CUS-06 (saldo awal), FR-CUS-08 (refund, P1) |
| **Sumber** | PRD v1.1 §6 dan §5.3-5.4, TDD v1.1 §7-8, Playbook §4-6 |
| **Fungsi dokumen** | Kunci jawaban objektif untuk tes. AI **tidak boleh** menafsirkan aturan di luar dokumen ini |

> **Cara memakai.** Tes ditulis lebih dulu dari Bagian 8 (vektor uji) dan Bagian 9 (acceptance criteria), ditinjau manusia, lalu implementasi. Bila ada yang ambigu, **berhenti dan tanya** (Playbook 5.4). Nilai uang selalu integer rupiah.

---

## 0. Koreksi terhadap Dokumen Sebelumnya (Erratum)

Saat merinci aturan, ditemukan beberapa hal pada PRD v1.1 / TDD v1.1 yang harus diperbaiki agar konsisten. **Dokumen ini yang berlaku** untuk poin-poin di bawah, dan dokumen induk harus diperbarui.

| # | Dokumen | Masalah | Perbaikan yang berlaku |
| :--- | :--- | :--- | :--- |
| E-1 | TDD §8.2 (query sumber kredit bebas) | Entri `REVERSAL` bertipe kredit (hasil void tagihan) ikut terhitung sebagai "deposit" | Sumber kredit **hanya** bertipe `PEMBAYARAN`, `PENYESUAIAN_KREDIT`, `SALDO_AWAL` (kredit). Entri bertipe `REVERSAL` **tidak pernah** menjadi sumber |
| E-2 | PRD §6.5 skenario S4 | Menyebut status `Belum Lunas`, padahal deposit yang dialokasikan menjadikan 0 < alokasi < total | Status mengikuti alokasi, jadi **`Dibayar Sebagian`** (lihat D-1, perlu konfirmasi Owner) |
| E-3 | TDD §7.2 `payment_allocations` | `invoice_id NOT NULL` tidak dapat mencatat pemakaian deposit untuk **refund** | `invoice_id` boleh NULL, tambah `refund_ledger_id` NULL, dengan `CHECK ((invoice_id IS NULL) <> (refund_ledger_id IS NULL))` |
| E-4 | TDD §7.2 `ledger_type` | `PENYESUAIAN_DEBIT` berdiri sendiri akan memerlukan aturan alokasi tambahan | Fase 1: **tidak dipakai**. Debit tambahan (denda, biaya) dibuat sebagai **invoice tipe `MANUAL`** |
| E-5 | PRD §5.3 / DDL `invoices.total >= 0` | Invoice bernilai 0 tidak dapat membuat entri ledger (CHECK debit/kredit) | Total invoice **harus > 0** (D-3) |
| E-6 | TDD §7.4 invarian | I-3 belum memperhitungkan refund & entri reversal. Belum ada invarian "deposit tidak boleh menganggur" | Invarian diperbarui di Bagian 6 (I-1..I-8) |

---

## 1. Tujuan

Menjamin bahwa seluruh pergerakan uang per pelanggan **benar, dapat diaudit, tidak dapat diubah diam-diam, dan aman dari pemrosesan ganda maupun balapan (race condition)**, serta bahwa status tiap tagihan dapat diturunkan secara deterministik.

## 2. Peran & Otorisasi

| Operasi | Owner | Admin | Kolektor | Client |
| :--- | :---: | :---: | :---: | :---: |
| Terbitkan tagihan (manual/generator) | ✔ | ✔ | ✖ | ✖ |
| Catat pembayaran | ✔ | ✔ | ◐ (hanya `TUNAI`) | ✖ |
| Ajukan void pembayaran / tagihan | ✔ | ✔ (butuh persetujuan Owner) | ✖ | ✖ |
| Setujui void | ✔ | ✖ | ✖ | ✖ |
| Refund deposit (P1) | ✔ | ◐ (butuh persetujuan Owner) | ✖ | ✖ |
| Lihat ledger sendiri | - | - | - | ✔ (hanya miliknya) |

Modul lain **tidak boleh** menulis `ledger_entries` / `payment_allocations`. Semua lewat service publik modul `ledger` (Bagian 4).

---

## 3. Aturan Bisnis (Dapat Diuji)

### 3.1 Ledger
- **BR-L1.** Kolom `debit` dan `kredit` non-negatif, **tepat satu** bernilai > 0 per entri.
- **BR-L2.** `balance_after = balance_after entri sebelumnya (pelanggan yang sama) + kredit − debit`. Entri pertama pelanggan berangkat dari 0.
- **BR-L3.** Saldo > 0 = deposit, saldo < 0 = tunggakan. **Total yang harus dibayar = max(0, −saldo)**.
- **BR-L4.** Ledger **append-only**. Koreksi hanya lewat entri baru (`REVERSAL`, `PENYESUAIAN_KREDIT`, `REFUND_DEPOSIT`).
- **BR-L5.** Seluruh penulisan ledger + alokasi + perubahan status invoice terjadi dalam **satu transaksi** yang diawali **penguncian baris pelanggan** (`SELECT ... FOR UPDATE`).
- **BR-L6.** Urutan penguncian seragam untuk mencegah deadlock: **pelanggan → (counter nomor invoice) → invoice terurut `due_date, issued_at, id`**.

### 3.2 Tagihan (Invoice)
- **BR-I1.** `total` > 0 (D-3). `total` = jumlah item (item boleh negatif untuk diskon, jumlahnya tetap > 0).
- **BR-I2.** Penerbitan membuat entri **debit** sebesar `total` (tipe `TAGIHAN`, atau `SALDO_AWAL` untuk invoice saldo awal).
- **BR-I3.** Satu pelanggan maksimal satu invoice `BULANAN` per periode yang tidak `BATAL` (unique index).
- **BR-I4.** Nilai tagihan yang sudah terbit tidak diubah. Koreksi = void + terbit ulang, atau invoice `MANUAL`.
- **BR-I5.** Nomor invoice berurutan tanpa celah per periode (counter di dalam transaksi yang sama).

### 3.3 Status Tagihan (Diturunkan, Bukan Diisi Manual)
Dengan `alokasi` = Σ alokasi (bertanda) ke invoice itu:

| Kondisi | Status |
| :--- | :--- |
| `voided_at` terisi | `BATAL` |
| alokasi = 0 | `BELUM_LUNAS` |
| 0 < alokasi < total | `DIBAYAR_SEBAGIAN` |
| alokasi = total | `LUNAS` |

`Jatuh Tempo` = penanda turunan: status ∈ {`BELUM_LUNAS`, `DIBAYAR_SEBAGIAN`} dan hari ini (WIB) > `due_date`. Bukan status tersimpan.

### 3.4 Alokasi
- **BR-A1. Sumber dana** (kredit bebas) = entri kredit bertipe `PEMBAYARAN` / `PENYESUAIAN_KREDIT` / `SALDO_AWAL` yang **belum dibalik** (tidak ada di `ledger_reversals`). `free = kredit − Σ alokasi bersumber darinya`.
- **BR-A2. Target** = invoice yang belum lunas dan tidak `BATAL`. `remaining = total − alokasi`.
- **BR-A3. Urutan FIFO:** sumber dana urut `seq` menaik. Target urut `due_date`, `issued_at`, `id` menaik.
- **BR-A4. Fungsi tunggal `reallocate(customer)`** menyalurkan dana bebas ke target sesuai BR-A3 sampai salah satunya habis. Fungsi ini **dipanggil di akhir setiap operasi** (terbit, bayar, void) sehingga invarian I-7 selalu terjaga.
- **BR-A5. Pembayaran bertarget** (`invoiceId` diberikan): dana pembayaran itu dialokasikan **lebih dulu** ke invoice tersebut (maksimal `remaining`), **sisanya** disalurkan lewat `reallocate` (FIFO ke invoice lain, baru sisa menjadi deposit).
- **BR-A6.** Alokasi bersifat **append-only dan bertanda**: `+` menyalurkan, `−` membatalkan. Nilai efektif = penjumlahan.
- **BR-A7.** Tidak ada sumber yang dialokasikan melebihi `kredit`-nya, tidak ada invoice yang dialokasikan melebihi `total`.

### 3.5 Pembayaran
- **BR-P1.** `amount` integer > 0, `paidAt` ≤ hari ini (WIB), `method` ∈ metode aktif. Kolektor hanya `TUNAI`.
- **BR-P2. Idempotensi:** header `Idempotency-Key` wajib. Kunci sama + payload sama → kembalikan hasil lama (HTTP 200, tanpa efek baru). Kunci sama + payload berbeda → `409 IDEMPOTENCY_CONFLICT`.
- **BR-P3. Peringatan duplikat:** pembayaran dengan pelanggan + nominal sama dalam 5 menit terakhir ditolak `409 PAYMENT_DUPLICATE_SUSPECTED` kecuali `confirmDuplicate: true`.
- **BR-P4.** Peringatan (bukan penolakan) bila `amount` > 3× total yang harus dibayar. UI meminta konfirmasi.
- **BR-P5.** Pembayaran ke pelanggan berstatus `BERHENTI` **diizinkan** (melunasi tunggakan) (D-4).
- **BR-P6.** `invoiceId` target harus milik pelanggan yang sama dan tidak `BATAL`, jika tidak → `404` / `409 INVOICE_VOIDED`.

### 3.6 Void (Pembatalan)
- **BR-V1. Void pembayaran:** hanya untuk pembayaran yang belum di-void. Membuat entri `REVERSAL` **debit** sebesar pembayaran, mencatat pasangan di `ledger_reversals`, membuat alokasi **negatif** untuk seluruh alokasi bersumber dari kredit itu, menghitung ulang status invoice terdampak, mengisi `payments.voided_at`. Pembayaran asli tetap terlihat.
- **BR-V2. Void tagihan:** hanya untuk invoice yang belum `BATAL`. Membuat entri `REVERSAL` **kredit** sebesar `total` (entri `REVERSAL` ini **bukan sumber dana**, E-1), alokasi negatif untuk seluruh alokasi ke invoice, set `BATAL`. Dana yang terlepas menjadi bebas lalu **disalurkan ulang** ke invoice terbuka lain (BR-A4).
- **BR-V3.** Void wajib: alasan (min 5 karakter), persetujuan Owner (jika diajukan Admin), audit log (sebelum/sesudah).
- **BR-V4.** Void pembayaran yang sudah masuk **setoran kolektor terkonfirmasi** ditolak `409 SETTLEMENT_CONFIRMED`, kecuali Owner membuka kembali setoran (D-2).
- **BR-V5.** Void bersifat **idempoten dan aman paralel**: dua void bersamaan pada objek sama → satu berhasil, satu `409 ALREADY_VOIDED`.

### 3.7 Saldo Awal (Impor)
- **BR-S1.** Tunggakan awal → **invoice tipe `SALDO_AWAL`** dengan satu item `SALDO_AWAL` (agar aging & alokasi konsisten), `due_date` dari data impor atau tanggal cut-off. Ledger: debit tipe `SALDO_AWAL`.
- **BR-S2.** Deposit awal → entri kredit tipe `SALDO_AWAL` (sumber dana bebas).
- **BR-S3.** Satu pelanggan hanya memiliki **satu** nilai saldo awal bertanda (tidak boleh keduanya sekaligus).
- **BR-S4.** Setelah impor jalankan `reallocate`. Seluruh impor dalam transaksi per pelanggan.

### 3.8 Refund Deposit (P1, FR-CUS-08)
- **BR-R1.** Hanya bila Σ dana bebas ≥ nominal. Membuat debit `REFUND_DEPOSIT` + alokasi (dengan `refund_ledger_id`) dari sumber FIFO sebesar nominal. Persetujuan Owner.

---

## 4. Kontrak Layanan Internal (Modul `ledger`)

```ts
// index.ts (pintu publik modul ledger). Dilarang mengekspos repository/tabel.
export interface LedgerService {
  issueInvoice(input: IssueInvoiceInput, actor: Actor): Promise<IssueInvoiceResult>;
  postPayment(input: PostPaymentInput, actor: Actor): Promise<PostPaymentResult>;
  voidPayment(paymentId: string, reason: string, actor: Actor): Promise<VoidResult>;
  voidInvoice(invoiceId: string, reason: string, actor: Actor): Promise<VoidResult>;
  importOpeningBalance(input: OpeningBalanceInput, actor: Actor): Promise<void>;     // FR-CUS-06
  refundDeposit(input: RefundInput, actor: Actor): Promise<void>;                    // P1
  getLedger(customerId: string, range?: Range): Promise<LedgerPage>;
  getPosition(customerId: string): Promise<{ balance: bigint; totalDue: bigint; freeCredit: bigint }>;
  checkInvariants(customerId?: string): Promise<InvariantReport>;                    // dipakai job harian & tes
}
```

### 4.1 Algoritma (Kanonik)

```ts
// Semua operasi dijalankan di dalam db.transaction(...) dan diawali lockCustomer()

async function issueInvoice(tx, input, actor) {
  await lockCustomer(tx, input.customerId);                          // BR-L5
  assert(input.total > 0);                                           // BR-I1
  const number = await nextInvoiceNumber(tx, input.period);          // BR-I5 (counter terkunci)
  const inv = await insertInvoice(tx, { ...input, number, snapshot: buildSnapshot(input) });
  await insertItems(tx, inv.id, input.items);
  await appendLedger(tx, { customerId: input.customerId, type: input.type === 'SALDO_AWAL' ? 'SALDO_AWAL' : 'TAGIHAN',
                           debit: input.total, kredit: 0, refType: 'INVOICE', refId: inv.id });
  await reallocate(tx, input.customerId);                            // BR-A4 (pakai deposit bila ada)
  await outbox(tx, 'invoice.issued', { invoiceId: inv.id });
  return loadResult(tx, inv.id);
}

async function postPayment(tx, input, actor) {
  const prior = await findByIdempotencyKey(tx, input.idempotencyKey);
  if (prior) return prior.samePayload(input) ? prior.result : throw409('IDEMPOTENCY_CONFLICT');   // BR-P2
  await lockCustomer(tx, input.customerId);
  validatePayment(input);                                            // BR-P1, BR-P6
  await rejectSuspectedDuplicate(tx, input);                         // BR-P3
  const pay    = await insertPayment(tx, input, actor);
  const credit = await appendLedger(tx, { customerId: input.customerId, type: 'PEMBAYARAN',
                                          debit: 0, kredit: input.amount, refType: 'PAYMENT', refId: pay.id });
  if (input.invoiceId) await allocateTargeted(tx, credit, input.invoiceId);   // BR-A5
  await reallocate(tx, input.customerId);                            // sisa -> FIFO -> deposit
  await outbox(tx, 'payment.posted', { paymentId: pay.id });
  return saveResult(tx, input.idempotencyKey, loadPaymentResult(tx, pay.id));
}

async function voidPayment(tx, paymentId, reason, actor) {
  const pay = await getPayment(tx, paymentId);
  await lockCustomer(tx, pay.customerId);
  if (pay.voidedAt) throw409('ALREADY_VOIDED');                      // BR-V5
  assertNotInConfirmedSettlement(tx, pay);                           // BR-V4
  const rev = await appendLedger(tx, { customerId: pay.customerId, type: 'REVERSAL',
                                       debit: pay.amount, kredit: 0, refType: 'PAYMENT', refId: pay.id });
  await markReversal(tx, pay.ledgerEntryId, rev.id, reason);
  await negateAllocationsFromSource(tx, pay.ledgerEntryId);          // alokasi bertanda negatif
  await recomputeInvoiceStatuses(tx, pay.customerId);
  await reallocate(tx, pay.customerId);                              // pengaman invarian I-7
  await setVoided(tx, pay.id);
  await audit(tx, 'PAYMENT_VOIDED', pay, reason, actor);
  await outbox(tx, 'payment.voided', { paymentId: pay.id });
}

async function voidInvoice(tx, invoiceId, reason, actor) {
  const inv = await getInvoice(tx, invoiceId);
  await lockCustomer(tx, inv.customerId);
  if (inv.status === 'BATAL') throw409('ALREADY_VOIDED');
  const rev = await appendLedger(tx, { customerId: inv.customerId, type: 'REVERSAL',
                                       debit: 0, kredit: inv.total, refType: 'INVOICE', refId: inv.id });
  await markReversal(tx, inv.ledgerEntryId, rev.id, reason);
  await negateAllocationsToInvoice(tx, inv.id);                      // dana terlepas menjadi bebas
  await setInvoiceVoided(tx, inv.id, reason);                        // status BATAL
  await reallocate(tx, inv.customerId);                              // salurkan ulang ke invoice lain
  await audit(tx, 'INVOICE_VOIDED', inv, reason, actor);
  await outbox(tx, 'invoice.voided', { invoiceId: inv.id });
}

// ---- inti tunggal penjaga invarian I-7 ----
async function reallocate(tx, customerId) {
  const sources = await freeCreditSources(tx, customerId);           // BR-A1, urut seq ASC (query §5.3)
  const targets = await lockOpenInvoices(tx, customerId);            // due_date, issued_at, id ASC, FOR UPDATE
  let i = 0, j = 0;
  while (i < sources.length && j < targets.length) {
    const use = min(sources[i].free, targets[j].remaining);
    await insertAllocation(tx, { sourceLedgerId: sources[i].id, invoiceId: targets[j].id, amount: use });
    await bumpInvoiceAllocated(tx, targets[j].id, use);              // update allocated + status (§3.3)
    sources[i].free -= use; targets[j].remaining -= use;
    if (sources[i].free === 0n) i++;
    if (targets[j].remaining === 0n) j++;
  }
}
```

**Catatan implementasi (wajib):**
- `appendLedger` menghitung `balance_after` dari entri terakhir pelanggan **di dalam transaksi yang sudah mengunci pelanggan**.
- Jangan mengirim WA/Email/PDF di dalam transaksi. Hanya menulis `outbox`.
- Semua angka bertipe `bigint` / integer. Dilarang `number` pecahan.
- `Clock` diinjeksi (tidak memakai `new Date()` langsung).

---

## 5. Data

### 5.1 Perubahan Skema terhadap TDD §7.2
```sql
-- E-3: alokasi bisa menuju invoice ATAU refund
ALTER TABLE payment_allocations ALTER COLUMN invoice_id DROP NOT NULL;
ALTER TABLE payment_allocations ADD COLUMN refund_ledger_id uuid REFERENCES ledger_entries(id);
ALTER TABLE payment_allocations ADD CONSTRAINT ck_alloc_target
  CHECK ((invoice_id IS NULL) <> (refund_ledger_id IS NULL));

-- E-5: invoice harus bernilai positif
ALTER TABLE invoices ADD CONSTRAINT ck_invoice_total_pos CHECK (total > 0);
```
*(Dalam migrasi awal, gabungkan langsung ke `CREATE TABLE` agar tidak ada ALTER.)*

### 5.2 Constraint & Index Wajib (Pagar Terakhir)
- Trigger append-only pada `ledger_entries`, `payment_allocations` (TDD §7.2).
- `CHECK ((debit = 0) <> (kredit = 0))`, nominal non-negatif.
- `UNIQUE (idempotency_key)` pada `payments`. Simpan juga `request_hash` untuk deteksi payload berbeda.
- `UNIQUE INDEX uq_invoice_monthly` (BR-I3).
- Aplikasi **tidak punya** hak `UPDATE/DELETE` pada tabel ledger/alokasi (peran DB terpisah).

### 5.3 Query Sumber Dana Bebas (menggantikan TDD §8.2)
```sql
SELECT l.id, l.kredit - COALESCE(SUM(a.amount), 0) AS free
FROM ledger_entries l
LEFT JOIN payment_allocations a ON a.source_ledger_id = l.id
WHERE l.customer_id = $1
  AND l.kredit > 0
  AND l.type IN ('PEMBAYARAN', 'PENYESUAIAN_KREDIT', 'SALDO_AWAL')       -- E-1
  AND NOT EXISTS (SELECT 1 FROM ledger_reversals r WHERE r.original_ledger_id = l.id)
GROUP BY l.id, l.kredit, l.seq
HAVING l.kredit - COALESCE(SUM(a.amount), 0) > 0
ORDER BY l.seq;
```

---

## 6. Invarian (Diuji Setelah **Setiap** Operasi pada Uji Properti, dan Harian di Produksi)

Definisi bantu: **kredit efektif** = kredit yang bukan tipe `REVERSAL` dan belum dibalik. **debit efektif** = debit yang bukan tipe `REVERSAL` dan belum dibalik.

| ID | Invarian |
| :--- | :--- |
| **I-1** | `balance_after` entri terakhir pelanggan = Σ`kredit` − Σ`debit` (semua entri) |
| **I-2** | `invoices.allocated` = Σ alokasi bertanda ke invoice itu, dan `0 ≤ allocated ≤ total` |
| **I-3** | **saldo = Σ dana bebas − Σ sisa (remaining) invoice terbuka** (refund dianggap sudah teralokasi penuh) |
| **I-4** | Per sumber: `0 ≤ Σ alokasi ≤ kredit` |
| **I-5** | Tidak ada invoice yang dialokasikan melebihi `total`. Invoice `BATAL` memiliki alokasi bersih 0 |
| **I-6** | Ledger & alokasi tidak pernah berubah/terhapus (dijaga trigger dan uji) |
| **I-7** | **Dana bebas > 0 hanya bila tidak ada invoice terbuka** (tidak ada deposit menganggur selagi ada tagihan) |
| **I-8** | Status setiap invoice konsisten dengan tabel §3.3 |

```sql
-- I-1: harus mengembalikan 0 baris
WITH last AS (
  SELECT DISTINCT ON (customer_id) customer_id, balance_after
  FROM ledger_entries ORDER BY customer_id, seq DESC),
sums AS (
  SELECT customer_id, SUM(kredit) - SUM(debit) AS s FROM ledger_entries GROUP BY customer_id)
SELECT l.customer_id, l.balance_after, s.s
FROM last l JOIN sums s USING (customer_id)
WHERE l.balance_after <> s.s;

-- I-2: harus mengembalikan 0 baris
SELECT i.id, i.allocated, COALESCE(a.sum, 0) AS actual
FROM invoices i
LEFT JOIN (SELECT invoice_id, SUM(amount) AS sum FROM payment_allocations
           WHERE invoice_id IS NOT NULL GROUP BY invoice_id) a ON a.invoice_id = i.id
WHERE i.allocated <> COALESCE(a.sum, 0) OR i.allocated < 0 OR i.allocated > i.total;

-- I-4: harus mengembalikan 0 baris
SELECT l.id FROM ledger_entries l
JOIN payment_allocations a ON a.source_ledger_id = l.id
GROUP BY l.id, l.kredit
HAVING SUM(a.amount) > l.kredit OR SUM(a.amount) < 0;
```
I-3, I-7, I-8 diimplementasikan di `checkInvariants()` (kode aplikasi) karena membutuhkan definisi "efektif".

---

## 7. Kontrak API Terkait

### 7.1 `POST /api/v1/payments`
Header: `Authorization`, **`Idempotency-Key`** (wajib), `X-App-Version` (mobile).

```json
// Request
{
  "customerId": "uuid",
  "amount": 200000,
  "method": "TUNAI",
  "paidAt": "2026-12-01",
  "invoiceId": null,
  "note": "Bayar di rumah",
  "proofKey": null,
  "confirmDuplicate": false
}
// Response 201 (contoh skenario S3)
{
  "payment":  { "id": "uuid", "amount": 200000, "method": "TUNAI", "paidAt": "2026-12-01" },
  "ledger":   { "seq": 2, "type": "PEMBAYARAN", "kredit": 200000, "balanceAfter": 50000 },
  "allocations": [ { "invoiceId": "uuid", "invoiceNumber": "INV/2026/12/0001", "amount": 150000 } ],
  "invoices": [ { "id": "uuid", "status": "LUNAS", "allocated": 150000, "total": 150000 } ],
  "position": { "balance": 50000, "totalDue": 0, "freeCredit": 50000 }
}
```

| Kode error | HTTP | Kondisi |
| :--- | :--- | :--- |
| `PAYMENT_AMOUNT_INVALID` | 422 | `amount` ≤ 0 atau bukan integer |
| `PAYMENT_DATE_FUTURE` | 422 | `paidAt` > hari ini (WIB) |
| `FORBIDDEN_ROLE` | 403 | Kolektor memakai metode non-tunai |
| `NOT_FOUND` | 404 | Pelanggan/invoice target bukan milik pelanggan tersebut |
| `INVOICE_VOIDED` | 409 | Invoice target `BATAL` |
| `PAYMENT_DUPLICATE_SUSPECTED` | 409 | Lihat BR-P3 |
| `IDEMPOTENCY_CONFLICT` | 409 | Kunci sama, payload berbeda |
| `IDEMPOTENCY_KEY_REQUIRED` | 400 | Header tidak ada |

### 7.2 Void
`POST /payments/{id}/void-requests` dan `POST /invoices/{id}/void` (butuh `reason`). Admin → `202 APPROVAL_REQUIRED`, Owner menyetujui via `POST /approvals/{id}/approve` yang mengeksekusi void. Error: `ALREADY_VOIDED` (409), `SETTLEMENT_CONFIRMED` (409).

---

## 8. Kunci Jawaban: Vektor Uji Berangka

Semua nominal rupiah (integer). Pelanggan awal: saldo 0, tanpa invoice. Format langkah: `issueInvoice`, `postPayment` (opsi `target`), `voidPayment`, `voidInvoice`, `refund`. `P1`, `INV1` dst. adalah label alias di tes. `allocations` = alokasi **bersih**.

```json
[
  {
    "id": "S1-pembayaran-penuh",
    "steps": [
      { "op": "issueInvoice", "as": "INV1", "total": 150000, "dueDate": "2026-11-10" },
      { "op": "postPayment",  "as": "P1",   "amount": 150000 }
    ],
    "expect": {
      "balance": 0, "freeCredit": 0, "totalDue": 0,
      "invoices": { "INV1": { "allocated": 150000, "status": "LUNAS" } },
      "allocations": [ { "source": "P1", "invoice": "INV1", "amount": 150000 } ]
    }
  },
  {
    "id": "S2-cicilan",
    "steps": [
      { "op": "issueInvoice", "as": "INV1", "total": 150000, "dueDate": "2026-11-10" },
      { "op": "postPayment",  "as": "P1",   "amount": 100000 }
    ],
    "expect": {
      "balance": -50000, "freeCredit": 0, "totalDue": 50000,
      "invoices": { "INV1": { "allocated": 100000, "status": "DIBAYAR_SEBAGIAN" } },
      "allocations": [ { "source": "P1", "invoice": "INV1", "amount": 100000 } ]
    }
  },
  {
    "id": "S3-lebih-bayar",
    "steps": [
      { "op": "issueInvoice", "as": "INV1", "total": 150000, "dueDate": "2026-11-10" },
      { "op": "postPayment",  "as": "P1",   "amount": 200000 }
    ],
    "expect": {
      "balance": 50000, "freeCredit": 50000, "totalDue": 0,
      "invoices": { "INV1": { "allocated": 150000, "status": "LUNAS" } },
      "allocations": [ { "source": "P1", "invoice": "INV1", "amount": 150000 } ]
    }
  },
  {
    "id": "S4-deposit-terpakai-bulan-berikut",
    "steps": [
      { "op": "issueInvoice", "as": "INV1", "total": 150000, "dueDate": "2026-11-10" },
      { "op": "postPayment",  "as": "P1",   "amount": 200000 },
      { "op": "issueInvoice", "as": "INV2", "total": 150000, "dueDate": "2026-12-10" }
    ],
    "expect": {
      "balance": -100000, "freeCredit": 0, "totalDue": 100000,
      "invoices": {
        "INV1": { "allocated": 150000, "status": "LUNAS" },
        "INV2": { "allocated": 50000,  "status": "DIBAYAR_SEBAGIAN" }
      },
      "allocations": [
        { "source": "P1", "invoice": "INV1", "amount": 150000 },
        { "source": "P1", "invoice": "INV2", "amount": 50000 }
      ]
    },
    "note": "E-2/D-1: status INV2 = DIBAYAR_SEBAGIAN karena deposit teralokasi. Konfirmasi Owner."
  },
  {
    "id": "S5-tunggakan-terbawa",
    "steps": [
      { "op": "issueInvoice", "as": "INV1", "total": 150000, "dueDate": "2026-11-10" },
      { "op": "postPayment",  "as": "P1",   "amount": 100000 },
      { "op": "issueInvoice", "as": "INV2", "total": 150000, "dueDate": "2026-12-10" }
    ],
    "expect": {
      "balance": -200000, "freeCredit": 0, "totalDue": 200000,
      "invoices": {
        "INV1": { "allocated": 100000, "status": "DIBAYAR_SEBAGIAN" },
        "INV2": { "allocated": 0,      "status": "BELUM_LUNAS" }
      }
    }
  },
  {
    "id": "S6-bayar-FIFO-dua-tagihan",
    "steps": [
      { "op": "issueInvoice", "as": "INV1", "total": 150000, "dueDate": "2026-11-10" },
      { "op": "postPayment",  "as": "P1",   "amount": 100000 },
      { "op": "issueInvoice", "as": "INV2", "total": 150000, "dueDate": "2026-12-10" },
      { "op": "postPayment",  "as": "P2",   "amount": 200000 }
    ],
    "expect": {
      "balance": 0, "freeCredit": 0, "totalDue": 0,
      "invoices": {
        "INV1": { "allocated": 150000, "status": "LUNAS" },
        "INV2": { "allocated": 150000, "status": "LUNAS" }
      },
      "allocations": [
        { "source": "P1", "invoice": "INV1", "amount": 100000 },
        { "source": "P2", "invoice": "INV1", "amount": 50000 },
        { "source": "P2", "invoice": "INV2", "amount": 150000 }
      ]
    }
  },
  {
    "id": "S7-void-pembayaran-dua-tagihan",
    "steps": [
      { "op": "issueInvoice", "as": "INV1", "total": 150000, "dueDate": "2026-11-10" },
      { "op": "postPayment",  "as": "P1",   "amount": 100000 },
      { "op": "issueInvoice", "as": "INV2", "total": 150000, "dueDate": "2026-12-10" },
      { "op": "postPayment",  "as": "P2",   "amount": 200000 },
      { "op": "voidPayment",  "target": "P2", "reason": "Salah input nominal" }
    ],
    "expect": {
      "balance": -200000, "freeCredit": 0, "totalDue": 200000, "ledgerEntryCount": 5,
      "invoices": {
        "INV1": { "allocated": 100000, "status": "DIBAYAR_SEBAGIAN" },
        "INV2": { "allocated": 0,      "status": "BELUM_LUNAS" }
      },
      "allocations": [ { "source": "P1", "invoice": "INV1", "amount": 100000 } ],
      "payments": { "P2": { "voided": true } }
    }
  },
  {
    "id": "S8-refund-deposit (P1)",
    "steps": [
      { "op": "issueInvoice", "as": "INV1", "total": 150000, "dueDate": "2026-11-10" },
      { "op": "postPayment",  "as": "P1",   "amount": 200000 },
      { "op": "refund", "amount": 50000 }
    ],
    "expect": { "balance": 0, "freeCredit": 0, "totalDue": 0,
                "invoices": { "INV1": { "allocated": 150000, "status": "LUNAS" } } }
  },
  {
    "id": "T9-tiga-tagihan-terbuka-FIFO",
    "steps": [
      { "op": "issueInvoice", "as": "INV1", "total": 150000, "dueDate": "2027-01-10" },
      { "op": "issueInvoice", "as": "INV2", "total": 150000, "dueDate": "2027-02-10" },
      { "op": "issueInvoice", "as": "INV3", "total": 150000, "dueDate": "2027-03-10" },
      { "op": "postPayment",  "as": "P1",   "amount": 400000 }
    ],
    "expect": {
      "balance": -50000, "freeCredit": 0, "totalDue": 50000,
      "invoices": {
        "INV1": { "allocated": 150000, "status": "LUNAS" },
        "INV2": { "allocated": 150000, "status": "LUNAS" },
        "INV3": { "allocated": 100000, "status": "DIBAYAR_SEBAGIAN" }
      }
    }
  },
  {
    "id": "T9b-lanjutan-sisa-jadi-deposit",
    "steps": [
      { "op": "issueInvoice", "as": "INV1", "total": 150000, "dueDate": "2027-01-10" },
      { "op": "issueInvoice", "as": "INV2", "total": 150000, "dueDate": "2027-02-10" },
      { "op": "issueInvoice", "as": "INV3", "total": 150000, "dueDate": "2027-03-10" },
      { "op": "postPayment",  "as": "P1",   "amount": 400000 },
      { "op": "postPayment",  "as": "P2",   "amount": 70000 }
    ],
    "expect": {
      "balance": 20000, "freeCredit": 20000, "totalDue": 0,
      "invoices": { "INV3": { "allocated": 150000, "status": "LUNAS" } },
      "allocations": [ { "source": "P2", "invoice": "INV3", "amount": 50000 } ]
    }
  },
  {
    "id": "T10-pembayaran-bertarget",
    "steps": [
      { "op": "issueInvoice", "as": "INV1", "total": 150000, "dueDate": "2027-01-10" },
      { "op": "issueInvoice", "as": "INV2", "total": 150000, "dueDate": "2027-02-10" },
      { "op": "postPayment",  "as": "P1",   "amount": 200000, "target": "INV2" }
    ],
    "expect": {
      "balance": -100000, "freeCredit": 0, "totalDue": 100000,
      "invoices": {
        "INV2": { "allocated": 150000, "status": "LUNAS" },
        "INV1": { "allocated": 50000,  "status": "DIBAYAR_SEBAGIAN" }
      },
      "allocations": [
        { "source": "P1", "invoice": "INV2", "amount": 150000 },
        { "source": "P1", "invoice": "INV1", "amount": 50000 }
      ]
    }
  },
  {
    "id": "T11-void-tagihan-sebagian-dibayar",
    "steps": [
      { "op": "issueInvoice", "as": "INV1", "total": 150000, "dueDate": "2027-01-10" },
      { "op": "postPayment",  "as": "P1",   "amount": 100000 },
      { "op": "issueInvoice", "as": "INV2", "total": 150000, "dueDate": "2027-02-10" },
      { "op": "voidInvoice",  "target": "INV1", "reason": "Salah periode" }
    ],
    "expect": {
      "balance": -50000, "freeCredit": 0, "totalDue": 50000,
      "invoices": {
        "INV1": { "allocated": 0,      "status": "BATAL" },
        "INV2": { "allocated": 100000, "status": "DIBAYAR_SEBAGIAN" }
      },
      "allocations": [ { "source": "P1", "invoice": "INV2", "amount": 100000 } ]
    },
    "note": "Dana P1 terlepas dari INV1 lalu disalurkan ulang ke INV2. Entri REVERSAL kredit BUKAN sumber dana (E-1)."
  },
  {
    "id": "T12a-50-pembayaran-paralel",
    "steps": [
      { "op": "issueInvoice", "as": "INV1", "total": 150000, "dueDate": "2027-01-10" },
      { "op": "parallel", "repeat": 50, "step": { "op": "postPayment", "amount": 3000 } }
    ],
    "expect": {
      "balance": 0, "freeCredit": 0, "ledgerEntryCount": 51,
      "invoices": { "INV1": { "allocated": 150000, "status": "LUNAS" } },
      "balanceAfterStrictlySequential": true
    }
  },
  {
    "id": "T12b-2-pembayaran-paralel-lebih",
    "steps": [
      { "op": "issueInvoice", "as": "INV1", "total": 150000, "dueDate": "2027-01-10" },
      { "op": "parallel", "repeat": 2, "step": { "op": "postPayment", "amount": 100000 } }
    ],
    "expect": {
      "balance": 50000, "freeCredit": 50000,
      "invoices": { "INV1": { "allocated": 150000, "status": "LUNAS" } },
      "paymentCount": 2
    }
  },
  {
    "id": "T13-idempotensi",
    "steps": [
      { "op": "issueInvoice", "as": "INV1", "total": 150000, "dueDate": "2027-01-10" },
      { "op": "postPayment", "as": "P1", "amount": 150000, "idempotencyKey": "K1" },
      { "op": "postPayment", "amount": 150000, "idempotencyKey": "K1", "expectSameResponseAs": "P1" },
      { "op": "postPayment", "amount": 999000, "idempotencyKey": "K1", "expectError": "IDEMPOTENCY_CONFLICT" }
    ],
    "expect": { "paymentCount": 1, "balance": 0, "ledgerEntryCount": 2 }
  },
  {
    "id": "T15-impor-saldo-awal",
    "customers": {
      "A": { "openingBalance": -300000, "dueDate": "2026-11-30" },
      "B": { "openingBalance":  80000 }
    },
    "steps": [
      { "op": "issueInvoice", "customer": "A", "as": "A-INV1", "total": 150000, "dueDate": "2026-12-10" },
      { "op": "issueInvoice", "customer": "B", "as": "B-INV1", "total": 150000, "dueDate": "2026-12-10" }
    ],
    "expect": {
      "A": { "balance": -450000, "totalDue": 450000, "freeCredit": 0 },
      "B": { "balance": -70000,  "totalDue": 70000,  "freeCredit": 0,
             "invoices": { "B-INV1": { "allocated": 80000, "status": "DIBAYAR_SEBAGIAN" } } }
    }
  }
]
```

### 8.1 Tes Negatif Wajib

| # | Kondisi | Hasil |
| :--- | :--- | :--- |
| N-1 | `amount = 0` atau negatif atau pecahan | 422 `PAYMENT_AMOUNT_INVALID`, ledger tidak berubah |
| N-2 | `paidAt` di masa depan | 422 `PAYMENT_DATE_FUTURE` |
| N-3 | `invoiceId` milik pelanggan lain | 404, tidak ada efek |
| N-4 | `invoiceId` berstatus `BATAL` | 409 `INVOICE_VOIDED` |
| N-5 | Kolektor dengan metode non-tunai / mencoba void | 403 |
| N-6 | Void kedua pada objek yang sama (berurutan **dan** paralel) | 409 `ALREADY_VOIDED`, ledger tidak bertambah |
| N-7 | Terbit invoice periode sama dua kali (`BULANAN`) | Ditolak unique index, tidak ada duplikat |
| N-8 | Terbit invoice `total = 0` | 422 |
| N-9 | Percobaan `UPDATE`/`DELETE` langsung ke `ledger_entries` & `payment_allocations` | Ditolak trigger |
| N-10 | Transaksi gagal di tengah (injeksi galat setelah ledger, sebelum alokasi) | Rollback penuh. Tidak ada entri/ nomor invoice yang tersisa |
| N-11 | Pembayaran duplikat serupa < 5 menit tanpa `confirmDuplicate` | 409 `PAYMENT_DUPLICATE_SUSPECTED` |
| N-12 | Void pembayaran pada setoran terkonfirmasi | 409 `SETTLEMENT_CONFIRMED` |

---

## 9. Acceptance Criteria (Given/When/Then)

| ID | Kriteria |
| :--- | :--- |
| **AC-L1** | **Given** vektor S1-S8, T9-T15 di Bagian 8, **when** dijalankan, **then** seluruh `expect` terpenuhi persis (saldo, status, alokasi, jumlah entri) |
| **AC-L2** | **Given** operasi acak (terbit, bayar penuh/sebagian/lebih/bertarget, void pembayaran, void tagihan, impor saldo awal) minimal 1.000 urutan per eksekusi, **when** invarian I-1..I-8 diperiksa setelah **setiap** operasi, **then** tidak ada pelanggaran |
| **AC-L3** | **Given** 50 pembayaran paralel dan 20 operasi campuran paralel pada satu pelanggan, **when** selesai, **then** invarian terpenuhi, `balance_after` berurutan tanpa celah/duplikat, dan tidak terjadi deadlock |
| **AC-L4** | **Given** `Idempotency-Key` sama dikirim 10× paralel, **when** diproses, **then** tepat satu pembayaran terbentuk dan semua respons identik |
| **AC-L5** | **Given** kegagalan disuntik pada setiap langkah transaksi, **when** terjadi, **then** tidak ada efek sebagian (atomik) |
| **AC-L6** | **Given** akses langsung ke DB sebagai peran aplikasi, **when** mencoba `UPDATE/DELETE` ledger/alokasi, **then** ditolak |
| **AC-L7** | **Given** generator dijalankan dua kali pada periode yang sama, **when** selesai, **then** jumlah invoice = jumlah pelanggan aktif, tanpa duplikat |
| **AC-L8** | **Given** mutation testing pada `modules/ledger`, **when** dijalankan, **then** skor mutasi ≥ 70% (ambang awal, dapat dinaikkan) |
| **AC-L9** | **Given** impor saldo awal 500 pelanggan campuran tunggakan/deposit, **when** selesai, **then** Σ saldo sistem = Σ sumber, tanpa selisih rupiah |
| **AC-L10** | **Given** job rekonsiliasi harian dengan data yang sengaja dirusak (di lingkungan uji), **when** berjalan, **then** pelanggaran terdeteksi dan alarm kritis terkirim |

## 10. Tes yang Wajib Ada

| Jenis | Lokasi / alat |
| :--- | :--- |
| Unit murni (`reallocate`, urutan FIFO, penurunan status) | Vitest, tanpa DB |
| Integrasi (vektor Bagian 8 + tes negatif) | Postgres nyata via Testcontainers. **Nama tes memuat ID vektor** (mis. `it('S3-lebih-bayar')`) |
| **Properti** | fast-check: generator operasi acak + `checkInvariants` setelah tiap langkah (AC-L2) |
| Konkurensi | Beberapa koneksi DB paralel (AC-L3, AC-L4) |
| Injeksi kegagalan | Atomisitas (AC-L5) |
| Mutation | Stryker pada `modules/ledger/**` (AC-L8) |
| Keamanan DB | Uji hak peran aplikasi (AC-L6) |

## 11. Event yang Diterbitkan

`invoice.issued`, `invoice.voided`, `payment.posted`, `payment.voided` (skema berversi di `contracts/events/`). Diterbitkan lewat outbox **dalam transaksi yang sama**. Tidak ada pendengar yang boleh mengubah ledger secara langsung. Mereka memanggil `LedgerService`.

## 12. Di Luar Lingkup (Eksplisit)

- Denda/PPN otomatis, prorata (hanya sebagai item pada invoice `MANUAL`/`BULANAN`, aturan hitung ada di modul `billing/pricing`).
- Payment gateway & konfirmasi transfer pelanggan (Fase 2, akan memanggil `postPayment`).
- Laporan (membaca ledger, tidak menulis).
- Multi-mata uang dan desimal.
- Mengubah/menghapus entri ledger. Tidak pernah.

## 13. Keputusan yang Dibutuhkan (Beri Default agar AI Tidak Menebak)

Catat jawaban di `docs/decisions.log` sebelum implementasi. **Default** adalah yang dipakai bila Owner belum menjawab.

| ID | Pertanyaan | Default yang diusulkan |
| :--- | :--- | :--- |
| **D-1** | Invoice yang sebagian dibayar **oleh deposit**: tampil `Dibayar Sebagian` atau `Belum Lunas`? | `Dibayar Sebagian`, UI menampilkan "Deposit terpakai Rp X" agar tidak membingungkan pelanggan |
| **D-2** | Void pembayaran yang sudah masuk setoran kolektor terkonfirmasi | Ditolak sampai Owner membuka kembali setoran |
| **D-3** | Invoice bernilai 0 (mis. diskon penuh) | Ditolak. Owner cukup tidak menerbitkan invoice |
| **D-4** | Pembayaran dari pelanggan berstatus `BERHENTI` | Diizinkan |
| **D-5** | `due_date` invoice saldo awal bila tidak ada di data impor | Tanggal cut-off |
| **D-6** | Ambang peringatan nominal berlebih | 3× total yang harus dibayar |
| **D-7** | Batas waktu void pembayaran | Tanpa batas, tetapi selalu dengan persetujuan Owner dan audit |

## 14. Instruksi untuk Agen AI (Ringkas)

1. Baca dokumen ini penuh, `CLAUDE.md`, dan `modules/ledger/README.md`.
2. Ajukan **rencana** (berkas, tes, asumsi). **Jangan menulis kode** sebelum disetujui.
3. Tulis tes dari **Bagian 8, 8.1, dan 9**. Tes harus gagal pada awalnya.
4. Implementasi **hanya** lewat fungsi `reallocate` yang tunggal. Jangan menduplikasi logika alokasi.
5. Jangan mengubah vektor uji, invarian, atau aturan di dokumen ini. Bila tampak keliru, **berhenti dan tanya**.
6. Setelah selesai: tampilkan hasil tes (termasuk properti & konkurensi), daftar yang **tidak** diverifikasi, dan perbarui `STATE.md`.

---

*Dokumen ini adalah sumber kebenaran untuk modul ledger. Perubahan hanya lewat change request dan dicatat di `decisions.log`.*
