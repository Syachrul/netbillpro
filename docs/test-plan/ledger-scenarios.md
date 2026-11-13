# Test Plan: Ledger, Alokasi, & Void (S1-S8, T9-T15)

**Sumber:** SPEC-LEDGER-001 §8 (Kunci Jawaban Berangka)
**Status:** DRAFT — Menunggu implementasi C3

Dokumen ini mengekstrak skenario uji dari spesifikasi untuk memastikan tes di C2-3 sesuai dengan aturan bisnis, bukan asumsi implementasi.

## Skenario Vektor

| ID | Skenario | Saldo Awal | Aksi | Saldo Akhir | Status Invoice |
| :--- | :--- | :--- | :--- | :--- | :--- |
| S1 | Bayar penuh | 0 | Tagih 150k, Bayar 150k | 0 | Lunas |
| S2 | Cicilan | 0 | Tagih 150k, Bayar 100k | -50k | Dibayar Sebagian |
| S3 | Lebih bayar | 0 | Tagih 150k, Bayar 200k | +50k | Lunas (Deposit 50k) |
| S4 | Deposit terpakai | +50k | Tagih 150k | -100k | Dibayar Sebagian (Deposit 50k terpakai) |
| S5 | Tunggakan terbawa | -50k | Tagih 150k | -200k | Belum Lunas (Tunggakan 50k + 150k) |
| S6 | Bayar FIFO | -200k | Bayar 200k | 0 | Lunas (Tertua lunas dulu) |
| S7 | Void pembayaran | -200k | Void P2 (200k) | -200k | Kembali ke S5 |
| S8 | Refund deposit | +50k | Refund 50k | 0 | Lunas |
| T9 | 3 tagihan FIFO | 0 | Tagih 3x150k, Bayar 400k | -50k | INV1 & INV2 Lunas, INV3 Sebagian |
| T9b | Sisa jadi deposit | -50k | Bayar 70k | +20k | INV3 Lunas, Deposit 20k |
| T10 | Bayar bertarget | 0 | Tagih 2x150k, Bayar 200k (target INV2) | -100k | INV2 Lunas, INV1 Sebagian |
| T11 | Void tagihan | -50k | Tagih INV1, Bayar 100k, Tagih INV2, Void INV1 | -50k | INV1 Batal, dana pindah ke INV2 |
| T12a | 50 bayar paralel | 0 | Tagih 150k, 50x bayar 3k | 0 | Lunas (Locking bekerja) |
| T12b | 2 bayar paralel | 0 | Tagih 150k, 2x bayar 100k | +50k | Lunas, Deposit 50k |
| T13 | Idempotensi | 0 | Tagih 150k, Bayar 150k (K1), Bayar 150k (K1) | 0 | Hanya 1 pembayaran tercatat |
| T15 | Impor saldo awal | -300k | Tagih 150k | -450k | Tunggakan + Tagihan baru |

**Catatan:** Detail lengkap (alokasi, status per invoice) ada di SPEC-LEDGER-001 §8.
