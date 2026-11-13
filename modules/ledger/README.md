# Modul: ledger

**Zona risiko:** MERAH  **Prioritas:** P0  **Sprint:** S3-S4
**Sumber aturan:** SPEC-LEDGER-001 (kanonik), PRD 6, TDD 7-8.

## Tanggung jawab
- Satu-satunya modul yang boleh menulis `ledger_entries` dan `payment_allocations`.
- Menyediakan service publik: `issueInvoice`, `postPayment`, `voidPayment`, `voidInvoice`, `importOpeningBalance`, `refundDeposit`, `getLedger`, `getPosition`, `checkInvariants`.
- Menegakkan invarian I-1..I-8 (SPEC-LEDGER 6) setelah setiap operasi.
- Menjalankan satu fungsi `reallocate` di akhir setiap operasi.

## Kontrak publik (index.ts)
Lihat SPEC-LEDGER 4. Tidak boleh mengekspos repository/tabel mentah.

## Yang tidak boleh dilakukan modul lain
- Query/tulis langsung ke `ledger_entries` atau `payment_allocations`.
- Menghitung status invoice sendiri (gunakan hasil `ledger`).
- Menyalin logika alokasi.

## Aturan transaksi
1. Buka transaksi.
2. Kunci pelanggan (`SELECT ... FOR UPDATE`).
3. Lakukan operasi (validasi -> insert -> alokasi).
4. Panggil `reallocate`.
5. Tulis outbox event.
6. Commit.

Urutan kunci: pelanggan -> counter nomor invoice -> invoice (due_date, issued_at, id).

## Invarian (dicek setelah tiap operasi dan harian)
- I-1 saldo = sum(kredit) - sum(debit)
- I-2 invoices.allocated = sum alokasi bersih, 0 <= allocated <= total
- I-3 saldo = sum(dana bebas) - sum(remaining invoice terbuka)
- I-4 per sumber: 0 <= sum alokasi <= kredit
- I-5 tidak ada invoice over-allocated; invoice BATAL alokasi bersih 0
- I-6 ledger/alokasi tidak pernah berubah/terhapus
- I-7 dana bebas > 0 hanya bila tidak ada invoice terbuka
- I-8 status invoice konsisten dengan SPEC 3.3

## Vektor uji wajib
S1-S8, T9-T15, N-1..N-12 (SPEC-LEDGER 8 & 8.1). Nama tes memuat ID vektor.

## Event yang diterbitkan
`invoice.issued`, `invoice.voided`, `payment.posted`, `payment.voided` (lewat outbox, dalam transaksi yang sama).

## Cara kerja dengan agen AI
1. Agen baca README ini + SPEC-LEDGER-001 + CLAUDE.md.
2. Agen ajukan rencana, tunggu persetujuan.
3. Tulis tes dari vektor (harus gagal).
4. Implementasi sampai lulus.
5. Jangan ubah vektor/invarian. Bila tampak keliru, berhenti dan tanya.
