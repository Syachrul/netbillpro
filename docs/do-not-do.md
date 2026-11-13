# do-not-do.md — Daftar Larangan

- Jangan memakai floating point untuk uang. Uang = integer rupiah (bigint).
- Jangan meng-UPDATE/DELETE ledger atau alokasi. Jangan "memperbaiki saldo" langsung di DB.
- Jangan menulis ledger/alokasi dari luar modul `ledger`.
- Jangan menerima customerId dari klien pada endpoint /portal/*.
- Jangan membuat endpoint finansial tanpa Idempotency-Key.
- Jangan menduplikasi logika alokasi; gunakan satu fungsi `reallocate`.
- Jangan memperlakukan entri REVERSAL sebagai sumber dana.
- Jangan mengirim notifikasi di dalam transaksi database (gunakan outbox).
- Jangan menambah dependensi tanpa izin.
- Jangan mematikan tes atau lint agar CI hijau.
- Jangan mengubah migrasi yang sudah dirilis.
- Jangan menyimpan token/sesi di localStorage pada mobile (pakai secure storage).
- Jangan menaruh secret di kode, .env yang dikomit, atau prompt.
- Jangan mengarang aturan bisnis yang tidak ada di dokumen. Tanyakan.
- Jangan melakukan refactor besar dalam PR fitur.
- Jangan menerbitkan invoice bernilai 0.
- Jangan membiarkan deposit menganggur selama ada invoice terbuka (invarian I-7).
