# Glosarium

| Istilah | Definisi |
|---|---|
| Tagihan / Invoice | Dokumen kewajiban bayar untuk satu periode, berisi satu atau lebih item |
| Periode | Bulan tagihan, format YYYY-MM (mis. 2026-11) |
| Ledger | Buku besar mutasi keuangan per pelanggan, append-only |
| Saldo | Posisi akun pelanggan. >0 deposit, <0 tunggakan |
| Total yang harus dibayar | max(0, -saldo) |
| Alokasi | Pencocokan nominal pembayaran/deposit ke invoice tertentu |
| Dana bebas (free credit) | Kredit yang belum dialokasikan ke invoice mana pun |
| Void / Reversal | Pembatalan transaksi dengan entri pembalik, bukan penghapusan |
| Deposit | Saldo positif pelanggan (perusahaan berutang layanan) |
| Tunggakan | Saldo negatif pelanggan (piutang usaha) |
| FIFO | Alokasi dari sumber tertua ke invoice tertua (due_date, issued_at, id) |
| Idempotency-Key | Header wajib pada POST finansial untuk mencegah efek ganda |
| Outbox | Tabel event yang diterbitkan dalam transaksi bisnis, diproses async |
| Kolektor | Petugas lapangan yang menerima pembayaran tunai |
| Jatuh Tempo | Penanda turunan (status belum lunas/dibayar sebagian DAN hari ini > due_date), bukan status tersimpan |
| Zona Merah | Area paling berisiko (ledger, billing, payments, auth, migrasi) |
| Zona Kuning | Area sedang (CRUD, laporan, notifikasi, impor, PDF) |
| Zona Hijau | Area rendah risiko (UI presentasi, dokumentasi) |
