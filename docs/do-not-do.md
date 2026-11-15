# do-not-do.md: Daftar Larangan (v2)

> Dibaca AI bersama `CLAUDE.md` di setiap sesi. Setiap butir punya **alasan** dan **penegak** (mesin/proses yang menolak pelanggaran). Butir dengan penegak "BELUM ADA" adalah tugas yang harus dibuat sebelum zona terkait dibuka.
> Butir bertanda ★ adalah **tambahan** dari review 15 Nov 2026.

## A. Keuangan & ledger (zona merah)
| # | Jangan | Alasan | Penegak |
| :--- | :--- | :--- | :--- |
| 1 | Memakai floating point untuk uang. Uang = integer rupiah (`bigint`) | Galat pembulatan | Lint khusus + tipe BigInt + `CHECK` integer |
| 2 | Meng-`UPDATE`/`DELETE` ledger atau alokasi. Jangan "memperbaiki saldo" langsung di DB | Audit dan integritas | Trigger append-only + peran DB tanpa izin UPDATE/DELETE |
| 3 | Menulis ledger/alokasi dari luar modul `ledger` | Satu pintu aturan | Lint batas modul + izin DB |
| 4 | Menduplikasi logika alokasi. Gunakan satu fungsi `reallocate` | Drift aturan | Review + uji properti |
| 5 | Memperlakukan entri `REVERSAL` sebagai sumber dana | Deposit palsu (E-1). Terbukti oleh uji mutasi | Query sumber dana + vektor T11/T22 + uji properti |
| 6 | Membiarkan deposit menganggur selama ada invoice terbuka (I-7) | Invarian | `checkInvariants` + uji properti |
| 7 | Menerbitkan invoice bernilai 0 | Ledger butuh debit > 0 (E-5) | `CHECK (total > 0)` + validasi |
| 8 | Membuat endpoint finansial tanpa `Idempotency-Key` | Pembayaran ganda | Lint + uji kontrak |
| 9 ★ | Mem-void pembayaran yang dananya sudah (sebagian) di-refund | I-3 dilanggar (BR-V6, E-7). Ditemukan uji properti | Aturan domain + vektor T21 |
| 10 ★ | Mengisi/mengubah status invoice manual | Status diturunkan dari alokasi | Uji invarian I-8 |
| 11 ★ | Mengubah nominal/nomor/snapshot invoice yang sudah terbit | BR-I4 | Trigger guard + tanpa endpoint update |
| 12 ★ | Memakai `PENYESUAIAN_DEBIT` berdiri sendiri di Fase 1 | E-4: debit tambahan = invoice `MANUAL` | Validasi domain |
| 13 ★ | Mengabaikan urutan kunci: pelanggan → counter invoice → invoice (`due_date, issued_at, id`) | Deadlock | Review zona merah + uji konkurensi |

## B. Prisma, DB & migrasi (T2)
| # | Jangan | Alasan | Penegak |
| :--- | :--- | :--- | :--- |
| 14 ★ | Menulis tabel ledger/alokasi lewat klien Prisma (`prisma.ledgerEntry.create`, dst.). Gunakan SQL mentah di modul `ledger` | Keputusan T2 / ADR-22. Butuh `FOR UPDATE` dan kontrol urutan | Lint (larang model ledger di klien Prisma di luar modul ledger) - **BELUM ADA** |
| 15 ★ | Menjalankan `prisma db push` di lingkungan selain lokal sekali pakai | Melewati migrasi sehingga trigger/CHECK hilang | Skrip npm dibatasi + review - **BELUM ADA** |
| 16 ★ | Menerima migrasi hasil `prisma migrate dev` yang berisi `DROP` pada trigger/CHECK/index kustom tanpa tinjau | Prisma mungkin tidak mengenal objek kustom | Gerbang cek drift skema di CI - **BELUM ADA** |
| 17 ★ | Memakai tipe `Float`/`Decimal` Prisma untuk nominal | Aturan uang | Lint skema Prisma - **BELUM ADA** |
| 18 | Mengubah migrasi yang sudah dirilis | Riwayat harus utuh | Lint migrasi + CODEOWNERS |
| 19 ★ | Menyerialkan `BigInt` ke JSON tanpa konversi eksplisit (string) | Galat runtime / kehilangan presisi | Uji kontrak API |

## C. Keamanan
| # | Jangan | Alasan | Penegak |
| :--- | :--- | :--- | :--- |
| 20 | Menerima `customerId` dari klien pada endpoint `/portal/*` | IDOR | Uji otorisasi (peran × endpoint) |
| 21 ★ | Menjawab akses data orang lain dengan `403` (gunakan `404`) | Tidak membocorkan keberadaan data | Uji otorisasi |
| 22 | Menyimpan token/sesi di `localStorage` pada mobile (pakai secure storage) | Pencurian sesi | Review + lint |
| 23 | Menaruh secret di kode, `.env` yang dikomit, atau prompt | Kebocoran | gitleaks + hook pra-komit |
| 24 ★ | Mengembalikan secret gateway/SMTP utuh lewat API atau mencatatnya di log | AC-14 | Uji kontrak + review |
| 25 | Mengirim notifikasi di dalam transaksi database (gunakan outbox) | Kegagalan gateway menggagalkan transaksi | Review (outbox) |
| 26 ★ | Mencatat data pribadi, token, atau OTP di log | UU PDP | Lint + review |
| 27 ★ | **Meletakkan spreadsheet pelanggan asli di repositori, seed, fixture, prompt, atau CI** | Data pribadi. Seed harus sintetis | Kebijakan `ai-usage-policy` + pemindaian berkas data + `.gitignore` |

## D. Proses & kode
| # | Jangan | Alasan | Penegak |
| :--- | :--- | :--- | :--- |
| 28 | Menambah dependensi tanpa izin | Paket palsu, kerentanan, lisensi | Allowlist + audit di CI |
| 29 | Mematikan tes atau lint agar CI hijau | Jaminan palsu | Lint larang `.skip`/`.only`/`eslint-disable` tanpa ID isu + CODEOWNERS |
| 30 ★ | Mengubah/menghapus tes zona merah, vektor uji, atau invarian tanpa persetujuan | Tes salah = jaminan palsu | CODEOWNERS |
| 31 | Mengarang aturan bisnis yang tidak ada di dokumen. Tanyakan | Tebakan = kesalahan | Protokol berhenti-dan-tanya |
| 32 | Melakukan refactor besar dalam PR fitur | Sulit direview | Aturan ukuran diff |
| 33 ★ | Mengimpor dari folder dalam modul lain atau mengakses tabel milik modul lain | Batas modul | Lint batas modul |
| 34 ★ | Memakai `new Date()`/`Date.now()` di domain (pakai `Clock`) | Uji deterministik, zona waktu | Lint |
| 35 ★ | Mengklaim "berhasil" tanpa menampilkan hasil tes | Bukti | Template PR |
| 36 ★ | Satu sesi AI untuk banyak tugas; sesi baru tanpa membaca `STATE.md` | Kehilangan konteks | Playbook §8 |
| 37 ★ | Merge ke `main` oleh AI; membuka zona merah (C3) tanpa checklist gerbang di `STATE.md` terpenuhi | Akuntabilitas | Branch protection + `STATE.md` |
