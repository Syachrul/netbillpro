# STATE.md — Status Proyek

**Terakhir diperbarui:** 15 November 2026 (C4 Completed)

## Fase saat ini
**C3 & C4 COMPLETED.** LedgerService lulus 18 vektor dan 50 urutan properti acak.

## Selesai
- **C1:** Schema & Migration.
- **C2:** Testcontainers, Fixtures, dan Test-First (18 Vektor).
- **C3:** LedgerService (postPayment, issueInvoice, voidPayment, voidInvoice, refundDeposit, importOpeningBalance).
- **C4:** Property Testing (fast-check, 50 urutan acak).

## Sedang Dikerjakan
- **C5:** Mutation Testing (Persiapan).

## Blokir / Keterbatasan
- Spreadsheet data pelanggan asli belum tersedia (untuk migrasi/seeds).

## Langkah Berikutnya
1. Commit lokal C4.
2. Implementasi C5 (Stryker) atau tutup fase C dan push ke GitHub.
