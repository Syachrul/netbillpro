# PRODUCT REQUIREMENTS DOCUMENT (PRD)
## Sistem Manajemen Operasional, Billing, & Portal Pelanggan RT/RW Net (Web & Mobile Native)

---

### Kontrol Dokumen (Document Control)

| Atribut | Detail |
| :--- | :--- |
| **Nama Proyek** | NetBill Pro - RT/RW Net Management & Billing System |
| **ID Dokumen** | PRD-RTRW-2026-001 |
| **Versi Dokumen** | 1.0 (Final Release for Development) |
| **Tanggal Pembuatan** | 13 November 2026 |
| **Status Dokumen** | Approved / Ready for Engineering |
| **Platform Target** | Responsive Web App (Admin & Client), Native Mobile App (Android & iOS) |
| **Penyusun** | Product Management Team |

---

## 1. Ringkasan Eksekutif (Executive Summary)

### 1.1 Latar Belakang
Bisnis penyedia layanan internet lokal skala komunitas (RT/RW Net) mengalami pertumbuhan pesat, namun mayoritas masih dikelola secara manual menggunakan spreadsheet atau pencatatan konvensional. Hal ini sering memicu kesalahan pencatatan piutang, keterlambatan penagihan, kesulitan melacak pembayaran parsial (cicilan) atau deposit (lebih bayar), serta kurangnya transparansi informasi tagihan kepada pelanggan.

### 1.2 Tujuan Produk
Membangun ekosistem perangkat lunak terintegrasi (Web Application dan Mobile Native App) yang mengotomatisasi proses bisnis RT/RW Net, mulai dari manajemen data pelanggan, siklus penagihan bulanan (*billing cycle*), buku besar keuangan per pelanggan (debit, kredit, saldo), pengiriman notifikasi dan *invoice* PDF otomatis melalui WhatsApp/Email, hingga pelaporan keuangan komprehensif.

### 1.3 Ruang Lingkup (Scope)
*   **In-Scope:**
    *   Aplikasi Web responsif dengan pemisahan antarmuka (*Multi-layout*) berdasarkan peran pengguna (**Administrator** dan **Client/Konsumen**).
    *   Aplikasi Mobile Native (Android & iOS) yang fokus pada portal pelanggan (*Self-Service*) dan fitur penagihan lapangan untuk admin/kolektor.
    *   Sistem akuntansi buku besar (*ledger*) per pelanggan yang mendukung pembayaran penuh, pembayaran bertahap (parsial), dan kelebihan bayar (*overpayment*/deposit).
    *   Generator tagihan bulanan otomatis (*recurring billing*) dan generator dokumen PDF *Invoice*.
    *   Integrasi API WhatsApp Gateway dan SMTP Email untuk pengingat tagihan dan pengiriman bukti bayar.
    *   Modul pelaporan dinamis dan pusat pengaturan sistem terpusat.
*   **Out-of-Scope (Fase 1):**
    *   Integrasi langsung dengan perangkat keras router (MikroTik API) untuk *auto-isolate* (direncanakan pada Fase 2).
    *   Integrasi *Payment Gateway* otomatis (Virtual Account/QRIS otomatis; Fase 1 berfokus pada pencatatan transfer manual dan tunai).

---

## 2. Persona Pengguna & Hak Akses (User Personas & RBAC)

Sistem menerapkan arsitektur *Role-Based Access Control* (RBAC) dengan dua ekosistem antarmuka yang terpisah secara logis maupun visual:

### 2.1 Administrator (Admin / Operator / Kolektor)
*   **Deskripsi:** Pemilik usaha RT/RW Net, staf administrasi, atau petugas penagih lapangan.
*   **Akses Antarmuka:** **Admin Workspace Layout** (Dashboard penuh, sidebar navigasi lengkap, manajemen master data, laporan keuangan, dan pengaturan sistem).
*   **Tujuan Utama:** Mengelola pelanggan, memantau arus kas, menerbitkan tagihan, mencatat pembayaran, mengirim *invoice*, dan menganalisis performa bisnis.

### 2.2 Client / Konsumen (Pelanggan)
*   **Deskripsi:** Pengguna akhir layanan internet RT/RW Net.
*   **Akses Antarmuka:** **Client Portal Layout** (Antarmuka bersih dan terfokus pada informasi pribadi pelanggan baik di Web maupun Mobile Native App).
*   **Tujuan Utama:** Melihat status langganan, memeriksa rincian tagihan berjalan, melihat riwayat pembayaran dan mutasi saldo, mengunduh *invoice* PDF, serta memperbarui profil akun.

---

## 3. Arsitektur Antarmuka & Pengalaman Pengguna (UI/UX & Layout)

### 3.1 Pemisahan Layout Berdasarkan Level User
Sistem harus mendeteksi `role` pengguna saat proses autentikasi (*login*) dan mengarahkan pengguna ke *layout* yang sesuai:

1.  **Layout Administrator (`/admin/*`):**
    *   **Struktur:** *Persistent Left Sidebar*, *Top Navigation Bar* (notifikasi sistem, profil admin, *quick search* pelanggan), dan *Main Content Area* berbasis kartu (*card*) dan tabel data interaktif.
    *   **Fokus UX:** Efisiensi entri data, kepadatan informasi yang terstruktur, filter cepat, dan aksi massal (*bulk actions*).
2.  **Layout Client (`/portal/*` & Mobile App):**
    *   **Struktur:** *Simplified Top Header* (Web) atau *Bottom Navigation Bar* (Mobile Native) dengan menu: *Beranda (Ringkasan Tagihan), Riwayat & Mutasi, Paket Saya, dan Profil*.
    *   **Fokus UX:** Kemudahan membaca status tagihan (*Paid/Unpaid/Partial*), satu klik untuk mengunduh *invoice*, dan tampilan *mobile-first* yang ramah pengguna awam.

---

## 4. Spesifikasi Fungsional Mendalam (Functional Requirements)

### 4.1 Modul 1: Daftar Konsumen & Buku Besar Keuangan (Customer Ledger)
Modul ini mengelola data profil teknis/administratif pelanggan sekaligus bertindak sebagai buku besar akuntansi individu.

*   **Manajemen Data Pelanggan:**
    *   Informasi Dasar: ID Pelanggan (Auto-generate, misal: `CUST-0001`), Nama Lengkap, Nomor WhatsApp (validasi format internasional `628xxx`), Email, Alamat Pemasangan, Titik Koordinat (Latitude/Longitude), Tanggal Aktivasi, dan Status Pelanggan (`Aktif`, `Isolir/Ditangguhkan`, `Berhenti`).
    *   Informasi Layanan: Paket Internet yang dipilih, Tanggal Jatuh Tempo Bulanan.
*   **Pencatatan Keuangan Pelanggan (Debit, Kredit, & Saldo):**
    Setiap pelanggan memiliki tabel mutasi keuangan (*Customer Ledger*) yang mencatat setiap pergerakan finansial secara kronologis:
    *   **Debit (+):** Mencatat kewajiban/tagihan yang muncul (misal: Tagihan bulanan Rp 150.000, biaya pemasangan Rp 100.000). Nilai Debit menambah beban tagihan/mengurangi saldo pelanggan.
    *   **Kredit (-):** Mencatat pembayaran yang dilakukan oleh pelanggan (Tunai/Transfer). Nilai Kredit mengurangi beban tagihan/menambah saldo pelanggan.
    *   **Saldo Akhir (*Running Balance*):** Dihitung secara *real-time* dengan rumus:
        $$\text{Saldo Akhir} = \text{Saldo Sebelumnya} + \text{Kredit} - \text{Debit}$$
*   **Skenario Pembayaran yang Didukung:**
    1.  **Pembayaran Penuh (*Full Payment*):** Pelanggan membayar sesuai nominal tagihan. Saldo menjadi `0` (Lunas).
    2.  **Pembayaran Bertahap (*Partial Payment* / Cicilan):** Misal tagihan Rp 150.000, pelanggan membayar Rp 100.000. Sistem mencatat Kredit Rp 100.000, status tagihan berubah menjadi `Dibayar Sebagian (Partial)`, dan Saldo tercatat `-Rp 50.000` (Hutang/Piutang usaha).
    3.  **Pembayaran Lebih (*Overpayment* / Deposit):** Misal tagihan Rp 150.000, pelanggan membayar Rp 200.000. Sistem mencatat Kredit Rp 200.000, status tagihan menjadi `Lunas (Paid)`, dan Saldo tercatat `+Rp 50.000` (Deposit). Saldo positif ini akan otomatis memotong tagihan pada periode bulan berikutnya.

### 4.2 Modul 2: Daftar Paket Internet (Service Packages)
Mengelola katalog produk layanan internet yang ditawarkan kepada konsumen.

*   **Atribut Paket:**
    *   Kode Paket (misal: `PKT-10M`), Nama Paket (misal: *Paket Keluarga 10 Mbps*), Kecepatan Download/Upload (untuk informasi deskriptif), Harga Bulanan (IDR), Biaya Instalasi Default (Opsional), Deskripsi/Keterangan Paket, dan Status Paket (`Aktif` / `Arsip`).
*   **Aturan Bisnis:**
    *   Perubahan harga paket di master data dapat diterapkan secara opsional: hanya untuk pelanggan baru atau memperbarui seluruh pelanggan eksisting pada siklus tagihan berikutnya.
    *   Paket yang sedang digunakan oleh pelanggan aktif tidak dapat dihapus secara permanen (*soft delete* / arsip).

### 4.3 Modul 3: Daftar Transaksi, Penagihan, & Penerbitan Invoice
Jantung operasional untuk siklus penagihan bulanan dan pencatatan pembayaran.

*   **Generasi Tagihan Bulanan (*Monthly Billing Cycle*):**
    *   Sistem secara otomatis (via *Cron Job* sesuai tanggal pengaturan) atau manual oleh Admin menghasilkan tagihan untuk seluruh pelanggan berstatus `Aktif` berdasarkan periode bulan (contoh: `Periode November 2026`).
    *   Jika pelanggan memiliki **Saldo Deposit (+)**, sistem otomatis mengkompensasi nilai tagihan dengan saldo deposit tersebut.
    *   Jika pelanggan memiliki **Tunggakan (-)** dari bulan sebelumnya, sistem menampilkan akumulasi tunggakan secara jelas pada rincian tagihan.
*   **Pengingat Tagihan (*Billing Reminder*):**
    *   Admin dapat mengirim pengingat tagihan secara satuan maupun massal (*broadcast*) kepada pelanggan yang berstatus `Belum Lunas` atau `Jatuh Tempo`.
    *   Integrasi template pesan dinamis (menggunakan variabel seperti `{nama_pelanggan}`, `{periode}`, `{jumlah_tagihan}`, `{jatuh_tempo}`).
*   **Pencatatan Pembayaran:**
    *   Form input pembayaran cepat: Pilih Pelanggan/Nomor Tagihan, Nominal Bayar (dapat diedit untuk cicilan atau lebih bayar), Metode Pembayaran (Tunai, Transfer Bank, E-Wallet), Tanggal Bayar, Bukti Transfer (Upload gambar opsional), dan Catatan.
    *   Setiap pencatatan pembayaran otomatis memperbarui Buku Besar Keuangan (Modul 4.1).
*   **Penerbitan & Pengiriman Invoice PDF:**
    *   Sistem men-generate dokumen **Invoice / Kuitansi Pembayaran resmi dalam format PDF** yang berisi: Kop/Logo Usaha RT/RW Net, Nomor Invoice, Tanggal Terbit, Detail Pelanggan, Rincian Tagihan, Riwayat Pembayaran pada tagihan tersebut, Sisa Tagihan / Saldo Deposit, serta Status (`LUNAS`, `CICILAN`, `BELUM LUNAS`).
    *   **Distribusi Satu Klik:** Tombol kirim langsung via **WhatsApp** (mengirim pesan beserta *attachment* atau *secure link* unduhan PDF) dan **Email** (mengirim email resmi dengan lampiran file `.pdf`).

### 4.4 Modul 4: Daftar Laporan (Reporting & Analytics)
Menyediakan berbagai model dan metode pelaporan untuk mendukung pengambilan keputusan bisnis.

*   **Model & Jenis Laporan:**
    1.  **Laporan Pendapatan (*Revenue Report*):** Total pemasukan berdasarkan rentang tanggal, dikelompokkan berdasarkan metode pembayaran (Tunai vs Transfer) dan per paket internet.
    2.  **Laporan Piutang & Tunggakan (*Accounts Receivable / Aging Report*):** Daftar pelanggan yang menunggak beserta lama keterlambatan (1-30 hari, 31-60 hari, >60 hari) dan total nilai piutang.
    3.  **Laporan Buku Besar Pelanggan (*Customer Ledger Statement*):** Rekapitulasi mutasi debit, kredit, dan saldo akhir seluruh pelanggan dalam periode tertentu.
    4.  **Laporan Rekapitulasi Tagihan Bulanan:** Perbandingan antara total tagihan yang diterbitkan (*billed*) vs total tagihan yang tertagih (*collected*) dalam persentase (%).
*   **Metode Pelaporan & Ekspor:**
    *   **Visualisasi Interaktif:** Grafik batang/garis dan kartu KPI di layar aplikasi dengan filter dinamis (Harian, Bulanan, Tahunan, Custom Date Range, Filter Status).
    *   **Ekspor Dokumen:** Semua laporan dapat diunduh dalam format **PDF** (siap cetak dengan kop resmi) dan **Excel/CSV** (untuk pengolahan data lanjutan).

### 4.5 Modul 5: Pengaturan Terpusat (Centralized System Settings)
Pusat kendali untuk mengatur perilaku (*behavior*), identitas, dan konfigurasi teknis aplikasi.

1.  **Profil Usaha (Identitas RT/RW Net):** Nama Usaha/Brand, Alamat Kantor, Nomor Telepon/WA Admin, Email Resmi, Logo Usaha (ditampilkan pada header aplikasi dan *Invoice* PDF), serta Tanda Tangan/Stempel Digital untuk *Invoice*.
2.  **Konfigurasi Billing & Siklus Penagihan:**
    *   Tanggal pembuatan tagihan otomatis setiap bulan (misal: setiap tanggal 1).
    *   Tanggal jatuh tempo default (misal: tanggal 10 setiap bulan).
    *   Format penomoran otomatis untuk ID Pelanggan dan Nomor Invoice (misal: `INV/{YYYY}/{MM}/{0001}`).
    *   Aturan pembulatan nominal dan kebijakan kompensasi deposit otomatis.
3.  **Konfigurasi Gateway Komunikasi:**
    *   **WhatsApp Gateway:** Pengaturan API Key / Endpoint URL / Session Token dari penyedia WA Gateway pihak ketiga, serta fitur *Test Connection*.
    *   **Email SMTP:** Pengaturan Host, Port, Username, Password, dan Enkripsi (TLS/SSL) untuk pengiriman email.
4.  **Manajemen Template Pesan:** Editor teks untuk menyesuaikan template pesan WhatsApp & Email pada kondisi: *Tagihan Baru Terbit*, *Pengingat Jatuh Tempo*, dan *Konfirmasi Pembayaran Lunas/Cicilan*.
5.  **Manajemen Pengguna & Hak Akses:** Tambah/Edit akun Admin/Operator dan pengaturan reset kata sandi pelanggan.

---

## 5. Spesifikasi Mobile Native App (Android & iOS)

Aplikasi mobile native dirancang menggunakan kerangka kerja lintas platform (seperti Flutter atau React Native) untuk memastikan performa native di Android dan iOS dengan basis kode yang efisien.

*   **Fitur Utama (Mode Client):**
    *   Login menggunakan Nomor WhatsApp/Email dan Password (atau OTP).
    *   *Push Notification* (FCM/APNs) saat tagihan baru terbit atau pembayaran dikonfirmasi.
    *   Kartu status tagihan bulan berjalan secara *real-time*.
    *   Riwayat pembayaran lengkap dan tombol unduh/bagikan *Invoice* PDF langsung ke penyimpanan perangkat.
    *   Informasi akun bank/metode pembayaran milik RT/RW Net beserta tombol salin nomor rekening.
*   **Fitur Utama (Mode Admin/Kolektor Lapangan):**
    *   Pencarian cepat pelanggan di lapangan.
    *   Input pembayaran tunai langsung di rumah pelanggan dan kirim struk/invoice PDF via WhatsApp seketika.

---

## 6. Persyaratan Non-Fungsional (Non-Functional Requirements)

| Kategori | Spesifikasi Kebutuhan |
| :--- | :--- |
| **Keamanan (Security)** | Autentikasi berbasis JWT (*JSON Web Token*) dengan *Refresh Token*. Enkripsi kata sandi menggunakan Bcrypt/Argon2. Pemisahan otorisasi ketat di level API (*Middleware Role Check*) agar Client tidak dapat mengakses endpoint Admin. |
| **Integritas Data** | Operasi pencatatan transaksi (Debit/Kredit/Saldo) wajib menggunakan *Database Transactions (ACID)* untuk mencegah ketidaksesuaian saldo akibat *race condition*. |
| **Performa (Performance)** | Waktu muat halaman dashboard < 2 detik. Generasi file PDF *Invoice* < 1.5 detik per dokumen. |
| **Ketersediaan (Availability)** | Uptime sistem minimal 99.5% dengan mekanisme *automated daily database backup*. |
| **Kompatibilitas** | Web App mendukung browser modern (Chrome, Firefox, Safari, Edge) di Desktop maupun Mobile. Mobile App mendukung minimal Android 9.0 (API 28) dan iOS 14.0. |

---

## 7. Alur Data Utama (Core User Flows)

### 7.1 Alur Siklus Tagihan & Pembayaran Bertahap/Lebih
1.  **Sistem** menjalankan *cron job* pada tanggal 1 -> Membuat tagihan Rp 150.000 untuk Pelanggan A -> Mencatat **Debit Rp 150.000** pada Buku Besar Pelanggan A (Saldo menjadi `-Rp 150.000`).
2.  **Sistem** mengirim notifikasi WhatsApp & Push Notification ke aplikasi Mobile Pelanggan A.
3.  **Pelanggan A** membayar tunai Rp 200.000 kepada Admin.
4.  **Admin** menginput pembayaran Rp 200.000 di aplikasi -> Sistem mencatat **Kredit Rp 200.000** -> Saldo Pelanggan A diperbarui menjadi **`+Rp 50.000` (Deposit)** -> Status tagihan berubah menjadi **`Lunas`**.
5.  **Admin** menekan tombol *"Kirim Invoice"* -> Sistem membuat file PDF yang mencantumkan pembayaran Rp 200.000 dan sisa deposit Rp 50.000 -> Mengirim file PDF ke WhatsApp & Email Pelanggan A.

---

## 8. Kriteria Penerimaan Proyek (Acceptance Criteria)

Proyek dinyatakan selesai dan siap rilis (*Production Ready*) apabila memenuhi kriteria berikut:
1.  Pengguna Admin dan Client diarahkan ke *layout* yang berbeda sesuai level aksesnya dengan isolasi keamanan data 100%.
2.  Perhitungan Debit, Kredit, dan Saldo berjalan akurat untuk seluruh skenario (bayar penuh, bayar sebagian/cicilan, dan bayar lebih/deposit).
3.  Tagihan bulanan dapat diterbitkan secara otomatis sesuai jadwal yang diatur di menu Pengaturan.
4.  Dokumen PDF *Invoice* berhasil dibuat dengan format rapi dan terkirim ke WhatsApp serta Email pelanggan.
5.  Seluruh jenis laporan dapat difilter dan diekspor ke dalam format PDF dan Excel tanpa kesalahan data.
6.  Aplikasi Mobile Native (Android & iOS) terhubung dengan basis data yang sama secara *real-time* dengan aplikasi Web.