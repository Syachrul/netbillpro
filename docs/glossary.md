# Glosarium (v2)

> Istilah baku proyek. Bila istilah di dokumen lain berbeda, glosarium ini yang berlaku. Perubahan dari v1 ditandai ★.

## Keuangan & ledger
| Istilah | Definisi |
| :--- | :--- |
| **Tagihan / Invoice** | Dokumen kewajiban bayar untuk satu periode, berisi satu atau lebih item. Tipe: `BULANAN`, `MANUAL`, `SALDO_AWAL` |
| **Periode** | Bulan tagihan, format `YYYY-MM` (mis. 2026-11) |
| **Ledger** | Buku besar mutasi keuangan per pelanggan, **append-only** |
| **Debit** ★ | Kewajiban muncul (tagihan). Menurunkan saldo |
| **Kredit** ★ | Dana masuk (pembayaran, penyesuaian). Menaikkan saldo |
| **Saldo** ★ | Σkredit − Σdebit. `> 0` deposit, `< 0` tunggakan, `0` lunas |
| **Total yang harus dibayar** | `max(0, −saldo)` |
| **Deposit** | Saldo positif pelanggan (perusahaan berutang layanan) |
| **Tunggakan** | Saldo negatif pelanggan (piutang usaha) |
| **Sumber dana** ★ | Entri kredit bertipe `PEMBAYARAN`, `PENYESUAIAN_KREDIT`, atau `SALDO_AWAL` yang belum dibalik. Entri `REVERSAL` **bukan** sumber dana |
| **Dana bebas (free credit)** ★ | Sisa dari sumber dana: `kredit − Σ alokasi bersumber darinya`. Hanya dari sumber yang sah. Dana bebas > 0 hanya boleh ada bila tidak ada invoice terbuka (I-7) |
| **Alokasi** ★ | Pencocokan dana dari satu sumber ke satu invoice **atau** refund. Bertanda: `+` menyalurkan, `−` membatalkan. Status invoice diturunkan dari alokasi |
| **FIFO** ★ | Sumber dana diurut `seq` menaik; invoice diurut `due_date`, lalu `issued_at`, lalu `id` menaik |
| **reallocate** ★ | Fungsi tunggal yang menyalurkan dana bebas ke invoice terbuka sesuai FIFO. Dipanggil di akhir setiap operasi |
| **Pembayaran bertarget** ★ | Pembayaran yang diarahkan lebih dulu ke satu invoice. Sisanya mengikuti FIFO, baru menjadi deposit |
| **Void / Reversal** | Pembatalan dengan entri pembalik, bukan penghapusan. Entri asal tidak lagi menjadi sumber dana |
| **Refund (deposit)** ★ | Pengembalian deposit: debit `REFUND_DEPOSIT` yang menggunakan dana bebas. Pembayaran yang dananya sudah di-refund tidak dapat di-void (BR-V6) |
| **Saldo awal** ★ | Posisi pelanggan saat migrasi. Tunggakan → invoice `SALDO_AWAL`; deposit → kredit `SALDO_AWAL` |
| **Status invoice** ★ | Diturunkan dari alokasi: `BELUM_LUNAS`, `DIBAYAR_SEBAGIAN`, `LUNAS`, `BATAL`. Deposit yang teralokasi dihitung sebagai alokasi |
| **Jatuh Tempo** | Penanda turunan (status belum lunas/dibayar sebagian **dan** hari ini > `due_date`), bukan status tersimpan |
| **Invarian** ★ | Aturan yang selalu benar (I-1..I-8). Diperiksa setelah tiap operasi pada uji dan harian di produksi |

## Operasional
| Istilah | Definisi |
| :--- | :--- |
| **Idempotency-Key** | Header wajib pada POST finansial. Kunci sama + payload sama = tanpa efek ganda; payload beda = `409` |
| **Outbox** | Tabel event yang ditulis dalam transaksi bisnis, diproses asinkron oleh worker |
| **Kolektor** | Petugas lapangan penerima pembayaran tunai |
| **Setoran** ★ | Penyerahan tunai kolektor ke usaha, direkonsiliasi Owner/Admin |
| **Isolir** ★ | Status pelanggan yang layanannya dihentikan sementara. Manual di Fase 1. Tidak ditagih iuran (OQ-6) |
| **Kandidat isolir** ★ | Pelanggan aktif dengan tunggakan melewati ambang hari |
| **Secure link** ★ | Tautan publik ber-token acak, kedaluwarsa, dapat dicabut, untuk satu invoice |
| **Snapshot** ★ | Salinan data saat invoice terbit agar dokumen lama tidak berubah |

## Proses pengembangan
| Istilah | Definisi |
| :--- | :--- |
| **Zona Merah** | Area paling berisiko (ledger, alokasi, billing, payments, auth, RBAC, secret, migrasi). Tes ditinjau manusia, review wajib |
| **Zona Kuning** | Area sedang (CRUD, laporan, notifikasi, impor, PDF) |
| **Zona Hijau** | Area rendah risiko (UI presentasi, dokumentasi) |
| **Documentation-First** ★ | Fase yang menahan kode zona merah sampai dokumen direkonsiliasi dan checklist gerbang di `STATE.md` terpenuhi |
| **HOLD** ★ | Pekerjaan sengaja ditahan menunggu keputusan/gerbang |
| **Model referensi (oracle)** ★ | Implementasi dalam memori dari aturan ledger untuk memverifikasi vektor dan implementasi nyata |
| **Vektor uji** ★ | Skenario berangka (input → hasil yang diharapkan) di `ledger-vectors.json`. Kunci jawaban tes ledger |
| **Uji mutasi** ★ | Menyuntik cacat kecil ke kode/model untuk memastikan tes benar-benar menangkapnya |
| **Erratum (E-n)** ★ | Koreksi terhadap dokumen sebelumnya, tercatat di SPEC-LEDGER §0 |
| **ADR** ★ | Catatan keputusan arsitektur. Status: Diterima / Diusulkan / Digantikan |
| **Golden example** ★ | Modul/berkas acuan pola kanonik |
| **DEFAULT / FINAL** ★ | Status keputusan di `decisions.log`: DEFAULT dipakai sampai Owner mengonfirmasi; FINAL sudah dikonfirmasi |
