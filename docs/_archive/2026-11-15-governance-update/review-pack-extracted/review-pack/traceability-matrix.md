# Traceability Matrix

**ID:** TRACE-NETBILL-001    **Versi:** 0.1 (DRAFT, dihasilkan dari PRD v1.2 pada 15 Nov 2026)

**Aturan:** tidak ada FR yang dinyatakan selesai hanya karena kodenya ada. Status naik satu tingkat hanya dengan bukti.

| Status | Arti | Bukti minimum |
| :--- | :--- | :--- |
| `NOT STARTED` | Belum ada spec | - |
| `SPECIFIED` | Spec + acceptance criteria + contoh berangka ada | ID spec |
| `TESTED` | Tes ditulis dari spec dan **ditinjau manusia** | ID tes + catatan review |
| `IMPLEMENTED` | Kode ada, tes lulus di CI | hash commit + laporan CI |
| `VERIFIED` | Lulus semua gerbang CI yang berlaku + uji properti/mutasi (zona merah) | laporan CI |
| `ACCEPTED` | Review manusia diterima | catatan review |
| `BLOCKED` | Menunggu keputusan | ID keputusan/OQ |

> Kolom **Code** sengaja kosong: kode belum diverifikasi oleh penyusun. Isi dari repositori (modul + berkas).

| Requirement | Ringkasan | Prio | Zona | Spec | Tes / Vektor | Code | Gerbang CI | Status |
| :--- | :--- | :---: | :---: | :--- | :--- | :--- | :--- | :--- |
| FR-CUS-01 | CRUD pelanggan: ID otomatis (CUST-0001), nama, nomor WhatsApp (dinorma… | P0 | YELLOW | - | - | - | CI-04, CI-08, CI-09, CI-14 | NOT STARTED |
| FR-CUS-02 | Status pelanggan: Aktif, Isolir, Berhenti. Perubahan status manual ole… | P0 | YELLOW | - | - | - | CI-04, CI-08, CI-09, CI-14 | NOT STARTED |
| FR-CUS-03 | Pelanggan terhubung ke satu paket aktif dan riwayat langganan (paket, … | P0 | YELLOW | - | - | - | CI-04, CI-08, CI-09, CI-14 | NOT STARTED |
| FR-CUS-04 | Tanggal jatuh tempo per pelanggan (opsional). Jika kosong memakai defa… | P1 | YELLOW | - | - | - | CI-04, CI-08, CI-09, CI-14 | NOT STARTED |
| FR-CUS-05 | Pelanggan tidak pernah dihapus permanen jika memiliki mutasi ledger. H… | P0 | YELLOW | - | - | - | CI-04, CI-08, CI-09, CI-14 | NOT STARTED |
| FR-CUS-06 | Impor massal dari CSV/Excel dengan template, pratinjau validasi per ba… | P0 | YELLOW | SPEC-LEDGER-001 §3.7 (BR-S1..S4) | T15, AC-L9 | - | CI-04, CI-08, CI-09, CI-14 | SPECIFIED |
| FR-CUS-07 | Pencarian cepat berdasarkan nama, ID, nomor WA, alamat | P0 | YELLOW | - | - | - | CI-04, CI-08, CI-09, CI-14 | NOT STARTED |
| FR-CUS-08 | Penghentian layanan: sistem menampilkan sisa saldo. Jika deposit > 0, … | P1 | YELLOW | SPEC-LEDGER-001 §3.8 (BR-R1) | S8, T21 | - | CI-04, CI-08, CI-09, CI-14 | SPECIFIED |
| FR-CUS-09 | Membuat akun portal pelanggan (otomatis saat pelanggan dibuat, kredens… | P0 | YELLOW | - | - | - | CI-04, CI-08, CI-09, CI-14 | NOT STARTED |
| FR-PKG-01 | Atribut: kode (PKT-10M), nama, kecepatan down/up (deskriptif), harga b… | P0 | YELLOW | - | - | - | CI-04, CI-08, CI-09, CI-14 | NOT STARTED |
| FR-PKG-02 | Perubahan harga memberi dua opsi: berlaku hanya untuk pelanggan baru, … | P0 | YELLOW | - | - | - | CI-04, CI-08, CI-09, CI-14 | NOT STARTED |
| FR-PKG-03 | Paket yang dipakai pelanggan aktif tidak dapat dihapus, hanya diarsipk… | P0 | YELLOW | - | - | - | CI-04, CI-08, CI-09, CI-14 | NOT STARTED |
| FR-PKG-04 | Pindah paket (upgrade/downgrade) berlaku mulai periode berikutnya seca… | P1 | YELLOW | - | - | - | CI-04, CI-08, CI-09, CI-14 | NOT STARTED |
| FR-BIL-01 | Generator bulanan via scheduler (zona WIB) pada tanggal yang diatur, a… | P0 | RED | - | - | - | CI-04, CI-05, CI-06, CI-07, CI-09, CI-14 | NOT STARTED |
| FR-BIL-02 | Idempoten: satu pelanggan hanya boleh punya satu tagihan bulanan per p… | P0 | RED | SPEC-LEDGER-001 BR-I3 | N-7 | - | CI-04, CI-05, CI-06, CI-07, CI-09, CI-14 | SPECIFIED |
| FR-BIL-03 | Tagihan terdiri dari item (iuran bulanan, biaya instalasi, penyesuaian… | P0 | RED | - | - | - | CI-04, CI-05, CI-06, CI-07, CI-09, CI-14 | NOT STARTED |
| FR-BIL-04 | Tagihan pertama pelanggan baru: kebijakan penuh atau prorata (dipilih … | P1 | RED | - | - | - | CI-04, CI-05, CI-06, CI-07, CI-09, CI-14 | NOT STARTED |
| FR-BIL-05 | Saat tagihan terbit, saldo deposit/tunggakan otomatis tercermin karena… | P0 | RED | SPEC-LEDGER-001 BR-L3, §3.4 | S4, S5 | - | CI-04, CI-05, CI-06, CI-07, CI-09, CI-14 | SPECIFIED |
| FR-BIL-06 | Status tagihan: Belum Lunas, Dibayar Sebagian, Lunas, Batal (Void). Ja… | P0 | RED | SPEC-LEDGER-001 §3.3 | S1, S2, S3, I-8 | - | CI-04, CI-05, CI-06, CI-07, CI-09, CI-14 | SPECIFIED |
| FR-BIL-07 | Penyesuaian manual (diskon, kompensasi gangguan, denda) sebagai item b… | P1 | RED | - | - | - | CI-04, CI-05, CI-06, CI-07, CI-09, CI-14 | NOT STARTED |
| FR-BIL-08 | Tagihan yang sudah terbit tidak diubah nominalnya. Koreksi dilakukan d… | P0 | RED | SPEC-LEDGER-001 BR-I4, BR-V2 | T11, T22 | - | CI-04, CI-05, CI-06, CI-07, CI-09, CI-14 | SPECIFIED |
| FR-BIL-09 | Nomor invoice berurutan, unik, dan tanpa celah mengikuti format di Pen… | P0 | RED | - | - | - | CI-04, CI-05, CI-06, CI-07, CI-09, CI-14 | NOT STARTED |
| FR-BIL-10 | Pembulatan nominal ke kelipatan yang diatur (default Rp 1, opsi Rp 100… | P2 | RED | - | - | - | CI-04, CI-05, CI-06, CI-07, CI-09, CI-14 | NOT STARTED |
| FR-PAY-01 | Form pembayaran cepat: pelanggan/nomor tagihan, nominal (boleh kurang/… | P0 | RED | - | - | - | CI-04, CI-05, CI-06, CI-07, CI-09, CI-14 | NOT STARTED |
| FR-PAY-02 | Setiap pembayaran membuat entri Kredit di ledger dan alokasi ke tagiha… | P0 | RED | SPEC-LEDGER-001 §3.4,§4.1 | S1-S6, T9, T9b, T10, T12a/b | - | CI-04, CI-05, CI-06, CI-07, CI-09, CI-14 | SPECIFIED |
| FR-PAY-03 | Nominal pembayaran > 0. Tanggal bayar tidak boleh di masa depan. Perin… | P0 | RED | SPEC-LEDGER-001 BR-P1,BR-P4 | N-1, N-2 | - | CI-04, CI-05, CI-06, CI-07, CI-09, CI-14 | SPECIFIED |
| FR-PAY-04 | Perlindungan input ganda: permintaan pembayaran membawa *idempotency k… | P0 | RED | SPEC-LEDGER-001 BR-P2,BR-P3 | T13, N-11 | - | CI-04, CI-05, CI-06, CI-07, CI-09, CI-14 | SPECIFIED |
| FR-PAY-05 | Setelah pembayaran tersimpan, otomatis tersedia struk/invoice terbarui… | P0 | RED | - | - | - | CI-04, CI-05, CI-06, CI-07, CI-09, CI-14 | NOT STARTED |
| FR-PAY-06 | Void pembayaran: hanya lewat entri pembalik (REVERSAL) dengan alasan w… | P0 | RED | SPEC-LEDGER-001 §3.6 (BR-V1..V6) | S7, T11, T21, T22, N-6, N-12, N-13 | - | CI-04, CI-05, CI-06, CI-07, CI-09, CI-14 | SPECIFIED |
| FR-PAY-07 | Setoran kolektor: pembayaran tunai oleh kolektor ditandai Belum Diseto… | P1 | RED | - | - | - | CI-04, CI-05, CI-06, CI-07, CI-09, CI-14 | NOT STARTED |
| FR-PAY-08 | Pelanggan dapat mengunggah konfirmasi transfer (foto bukti) dari porta… | P2 | RED | - | - | - | CI-04, CI-05, CI-06, CI-07, CI-09, CI-14 | NOT STARTED |
| FR-INV-01 | Invoice/kuitansi PDF memuat: logo & kop usaha, nomor invoice, tanggal … | P0 | YELLOW | - | - | - | CI-04, CI-08, CI-09, CI-14 | NOT STARTED |
| FR-INV-02 | Invoice yang sudah terbit bersifat snapshot (data usaha, harga, dan ta… | P0 | YELLOW | - | - | - | CI-04, CI-08, CI-09, CI-14 | NOT STARTED |
| FR-INV-03 | Kirim satu klik via WhatsApp (pesan + lampiran PDF atau *secure link*)… | P0 | YELLOW | - | - | - | CI-04, CI-08, CI-09, CI-14 | NOT STARTED |
| FR-INV-04 | Secure link: token acak, kedaluwarsa (default 7 hari, dapat diatur), d… | P0 | YELLOW | - | - | - | CI-04, CI-08, CI-09, CI-14 | NOT STARTED |
| FR-INV-05 | Setiap pengiriman dicatat di log notifikasi: waktu, kanal, penerima, s… | P0 | YELLOW | - | - | - | CI-04, CI-08, CI-09, CI-14 | NOT STARTED |
| FR-NTF-01 | Pengingat satuan dan massal (*broadcast*) kepada pelanggan Belum Lunas… | P0 | YELLOW | - | - | - | CI-04, CI-08, CI-09, CI-14 | NOT STARTED |
| FR-NTF-02 | Jadwal pengingat otomatis yang dapat diatur (default: H-3, hari-H, H+3… | P1 | YELLOW | - | - | - | CI-04, CI-08, CI-09, CI-14 | NOT STARTED |
| FR-NTF-03 | Template dinamis dengan variabel {nama_pelanggan}, {periode}, {jumlah_… | P0 | YELLOW | - | - | - | CI-04, CI-08, CI-09, CI-14 | NOT STARTED |
| FR-NTF-04 | Pengiriman massal memakai antrean (queue) dengan laju terbatas dan jed… | P0 | YELLOW | - | - | - | CI-04, CI-08, CI-09, CI-14 | NOT STARTED |
| FR-NTF-05 | Push notification (FCM/APNs) untuk tagihan baru, pembayaran dikonfirma… | P0 | YELLOW | - | - | - | CI-04, CI-08, CI-09, CI-14 | NOT STARTED |
| FR-NTF-06 | Pelanggan dapat menonaktifkan pengingat non-transaksional di Profil | P2 | YELLOW | - | - | - | CI-04, CI-08, CI-09, CI-14 | NOT STARTED |
| FR-RPT-01 | Pendapatan | P0 | YELLOW | - | - | - | CI-04, CI-08, CI-09, CI-14 | NOT STARTED |
| FR-RPT-02 | Piutang & Umur Tunggakan (Aging) | P0 | YELLOW | - | - | - | CI-04, CI-08, CI-09, CI-14 | NOT STARTED |
| FR-RPT-03 | Buku Besar Pelanggan | P0 | YELLOW | - | - | - | CI-04, CI-08, CI-09, CI-14 | NOT STARTED |
| FR-RPT-04 | Rekap Tagihan Bulanan | P0 | YELLOW | - | - | - | CI-04, CI-08, CI-09, CI-14 | NOT STARTED |
| FR-RPT-05 | Kandidat Isolir | P1 | YELLOW | - | - | - | CI-04, CI-08, CI-09, CI-14 | NOT STARTED |
| FR-RPT-06 | Rekap Kolektor | P1 | YELLOW | - | - | - | CI-04, CI-08, CI-09, CI-14 | NOT STARTED |
| FR-SET-01 | Profil Usaha: nama/brand, alamat, telepon/WA, email, logo, tanda tanga… | P0 | YELLOW | - | - | - | CI-04, CI-08, CI-09, CI-14 | NOT STARTED |
| FR-SET-02 | Siklus Billing: tanggal generate, jatuh tempo default, format penomora… | P0 | YELLOW | - | - | - | CI-04, CI-08, CI-09, CI-14 | NOT STARTED |
| FR-SET-03 | WhatsApp Gateway: endpoint/API key/session token, tombol *Test Connect… | P0 | RED | - | - | - | CI-04, CI-05, CI-06, CI-07, CI-09, CI-14 | NOT STARTED |
| FR-SET-04 | Email SMTP: host, port, user, password (terenkripsi), enkripsi TLS/SSL… | P0 | YELLOW | - | - | - | CI-04, CI-08, CI-09, CI-14 | NOT STARTED |
| FR-SET-05 | Template pesan WA & Email untuk: Tagihan Baru, Pengingat Jatuh Tempo, … | P0 | YELLOW | - | - | - | CI-04, CI-08, CI-09, CI-14 | NOT STARTED |
| FR-SET-06 | Pengguna & hak akses: kelola akun Owner/Admin/Kolektor, nonaktifkan ak… | P0 | RED | - | - | - | CI-04, CI-05, CI-06, CI-07, CI-09, CI-14 | NOT STARTED |
| FR-SET-07 | Audit log: pencatatan siapa, kapan, apa, nilai sebelum/sesudah untuk p… | P0 | YELLOW | - | - | - | CI-04, CI-08, CI-09, CI-14 | NOT STARTED |
| MOB-C-01 | Login Nomor WA/Email + kata sandi, atau OTP WhatsApp. OTP: 6 digit, be… | P0 | RED | - | - | - | CI-04, CI-05, CI-06, CI-07, CI-09, CI-14 | NOT STARTED |
| MOB-C-02 | Sesi tersimpan aman (Keychain/Keystore), opsi biometrik untuk membuka … | P1 | YELLOW | - | - | - | CI-04, CI-08, CI-09, CI-14 | NOT STARTED |
| MOB-C-03 | Beranda: kartu status tagihan berjalan (total bayar, jatuh tempo, stat… | P0 | YELLOW | - | - | - | CI-04, CI-08, CI-09, CI-14 | NOT STARTED |
| MOB-C-04 | Riwayat tagihan dan mutasi ledger, unduh/bagikan invoice PDF (simpan k… | P0 | YELLOW | - | - | - | CI-04, CI-08, CI-09, CI-14 | NOT STARTED |
| MOB-C-05 | Info rekening/e-wallet usaha dengan tombol salin | P0 | YELLOW | - | - | - | CI-04, CI-08, CI-09, CI-14 | NOT STARTED |
| MOB-C-06 | Push notification dan pengaturan preferensi notifikasi | ? | YELLOW | - | - | - | CI-04, CI-08, CI-09, CI-14 | NOT STARTED |
| MOB-C-07 | Tampilan data terakhir (cache baca-saja) saat offline dengan penanda "… | P1 | YELLOW | - | - | - | CI-04, CI-08, CI-09, CI-14 | NOT STARTED |
| MOB-C-08 | Unggah konfirmasi transfer (terkait FR-PAY-08) | P2 | YELLOW | - | - | - | CI-04, CI-08, CI-09, CI-14 | NOT STARTED |
| MOB-A-01 | Pencarian cepat pelanggan (nama, ID, alamat) dengan tombol buka peta/n… | P0 | YELLOW | - | - | - | CI-04, CI-08, CI-09, CI-14 | NOT STARTED |
| MOB-A-02 | Input pembayaran tunai di lokasi dan kirim struk PDF via WhatsApp seke… | P0 | YELLOW | - | - | - | CI-04, CI-08, CI-09, CI-14 | NOT STARTED |
| MOB-A-03 | Rekap tunai hari ini dan status setoran (terkait FR-PAY-07) | P1 | YELLOW | - | - | - | CI-04, CI-08, CI-09, CI-14 | NOT STARTED |
| MOB-A-04 | Jaringan lemah di lapangan: Fase 1 wajib online. Jika permintaan gagal… | P0 | YELLOW | - | - | - | CI-04, CI-08, CI-09, CI-14 | NOT STARTED |

**Ringkasan:** 67 requirement. SPECIFIED: 10. NOT STARTED: 57. Spec yang masih harus dibuat untuk zona merah: billing generator (FR-BIL-01, 03, 04, 07, 09), pembayaran (FR-PAY-01, 05, 07), auth (MOB-C-01, FR-SET-06), enkripsi secret (FR-SET-03).

Catatan: FR-BIL-09 (penomoran invoice) sudah punya aturan di SPEC-LEDGER BR-I5 tetapi **belum punya vektor uji**, sehingga tetap `NOT STARTED` pada matriks ini.
