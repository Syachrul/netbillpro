# Analisis Celah Dokumen NetBill Pro

**Tanggal:** 16 November 2026    **Status:** DRAFT (usulan, bukan keputusan)
**Dasar:** daftar folder `docs/` (nama, ukuran, tanggal ubah), laporan W-1, `decisions.log`, dan dokumen yang sudah ditinjau sebelumnya.
**Batas:** isi berkas selain yang pernah saya baca **tidak diperiksa**. Penilaian "usang" didasarkan pada tanggal ubah dibanding peristiwa lain, jadi perlu dikonfirmasi.

---

## 1. Kesimpulan Singkat

Dokumentasi Anda sudah jauh di atas rata-rata: ada hierarki sumber kebenaran, 22 ADR, empat spec fitur, vektor ledger, model referensi, log keputusan, dan **arsip bukti** per tahap di `_archive/` (diff, hasil tes, `before/after`). Itu pola yang baik dan perlu dipertahankan.

Masalahnya satu: **kode berjalan lebih cepat daripada dokumen**. Tiga hal tampak dari struktur folder:

1. Kode sudah ada untuk area yang **belum punya spec**: auth (`auth-api.test`), pembayaran (`payments-api.test`, perbaikan keamanan SEC-002/003), dan pelanggan (`customers-api.test`). Spec yang ada hanya ledger, billing, paket+langganan, dan invoice-docs.
2. Dokumen induk **tertinggal dari keputusan Owner** setelah 15 Nov: PRD terakhir diubah 15 Nov 21:35, TDD masih v1.1 (14 Nov), padahal sudah ada keputusan prorata, `username_hotspot`, grace period 14 hari, dan format nomor invoice.
3. Dokumen status **sudah tidak mencerminkan kenyataan**: `STATE.md` hanya 736 byte (terakhir 15 Nov 17:21), sedangkan pekerjaan 16 Nov mencakup B1-1 s.d. B1-5, kesiapan C5.0, ratifikasi, dan push. `artifact-register.md` dan `traceability-matrix.md` terakhir diubah 15 Nov 14:18, sebelum tiga spec baru muncul.

Prinsip yang saya sarankan: **spec diturunkan dari PRD (niat), bukan dari kode.** Untuk area yang kodenya sudah ada, tulis spec dari PRD, lalu bandingkan dengan kode (*conformance review*) dan catat selisihnya. Menulis spec dari kode hanya membekukan kesalahan yang sudah ada.

---

## 2. Prioritas P0: Kerjakan Sekarang

Alasan P0: kode sudah ada tanpa acuan, atau dokumen yang dibaca AI di setiap sesi sudah usang.

| # | Dokumen | Mengapa mendesak (bukti) | Isi minimum |
| :--- | :--- | :--- | :--- |
| P0-1 | **`STATE.md` ditulis ulang** | 736 byte, terakhir 15 Nov 17:21. AI membacanya di awal tiap sesi, jadi status usang = keputusan salah | Hash commit terkini, status push ke remote, tahap/tugas yang **diotorisasi**, jumlah dan hasil tes (dari `_archive/2026-11-16-verify/full-test-suite.log`), tindakan yang tertunda, tautan ke bukti di `_archive/`, daftar yang **belum terverifikasi** |
| P0-2 | **SPEC-AUTH-001** (auth, OTP, token, RBAC) | Zona merah. `auth-api.test` ada (C5.5), spec tidak | Matriks peran × endpoint, siklus token (rotasi, reuse detection), OTP (umur, percobaan, rate limit), lockout, kode error, contoh berangka, tes negatif |
| P0-3 | **SPEC-PAYMENTS-001** (endpoint pembayaran, kolektor, persetujuan void, setoran) | Zona merah. `payments-api.test` ada dan ada perbaikan keamanan SEC-002/003. SPEC-LEDGER hanya mengatur aturan domain, bukan kontrak API dan peran | Kontrak `POST /payments` dan void, aturan peran (kolektor hanya tunai), `Idempotency-Key`, alur approval Owner, setoran kolektor, kode error |
| P0-4 | **SPEC-CUSTOMERS-001** (pelanggan, status, impor, pencarian) | `customers-api.test` ada (C5.6). Keputusan Q-1 (`CUST-0001`) dan OQ-A (`username_hotspot` opsional, unique parsial) belum punya spec | CRUD, status Aktif/Isolir/Berhenti, aturan arsip (tanpa hapus permanen), impor CSV + saldo awal (merujuk SPEC-LEDGER §3.7), validasi nomor WA |
| P0-3b | **Conformance review kode vs spec** (untuk P0-2..P0-4 dan SPEC-LEDGER) | Menutup risiko "spec ditulis setelah kode" | Tabel: aturan → lokasi kode → tes → **sesuai / menyimpang / tidak ada**. Selisih menjadi daftar temuan, bukan langsung perubahan kode |
| P0-5 | **PRD v1.3 (amandemen keputusan Owner)** | PRD peringkat 2 tertinggal dari spec peringkat 4. Sudah diputuskan: prorata untuk aktivasi tengah periode (mengganti OQ-3 awal), `username_hotspot`, grace period global 14 hari disimpan di snapshot invoice, nomor invoice per periode | Ubah FR-BIL-04, FR-CUS-01, FR-RPT-05, FR-BIL-09, tabel OQ (§15); tiap perubahan menunjuk ID keputusan di log |
| P0-6 | **TDD v1.2** (terapkan `TDD-Amendment-Notes.md`) | TDD berstatus v1.1 (14 Nov) dan masih memuat query sumber dana yang cacat (E-1) serta invarian lama | Terapkan A1-A12, tambahkan keputusan teknis sesudah 14 Nov |
| P0-7 | **SECURITY-REGISTER.md + authz test matrix** | Ada fase keamanan (`2026-11-16-security-10`, SEC-002/003). Tanpa register, status temuan hanya tersebar di log dan diff | Tabel SEC-nnn: temuan, tingkat, status, bukti perbaikan, tes penguncinya; matriks peran × endpoint sebagai sumber CI-09 |
| P0-8 | **Segarkan `traceability-matrix.md` dan `artifact-register.md`** | Dibuat sebelum 3 spec baru dan puluhan tes | Naikkan status per FR dengan bukti. Idealnya dihasilkan otomatis dari ID di nama tes (CI-14) |

---

## 3. Prioritas P1: Sebelum Fase Berikutnya Dimulai

| # | Dokumen | Dibutuhkan sebelum | Isi minimum |
| :--- | :--- | :--- | :--- |
| P1-1 | **Kontrak API (as-built) + katalog kode error + matriks izin** | Web/mobile mengonsumsi API. Sudah ada banyak endpoint | `openapi.yaml` (idealnya dihasilkan dari kode/Zod lalu direview), katalog error, uji kontrak CI-08 |
| P1-2 | **Katalog event + skema** (ADR-15) | Notifikasi/outbox. Ditandai BLOCKED di STATE lama | Daftar event berversi dan muatannya, pendengar, jaminan idempoten |
| P1-3 | **SPEC-NOTIFICATIONS-001** | Notifikasi WA/Email/push | Outbox, antrean, rate limit WA, retry, template dan variabel, log status, adapter tiruan, aturan jadwal pengingat |
| P1-4 | **SPEC-REPORTS-001** (laporan + dashboard) | Fase laporan | Definisi tiap laporan (basis kas, aging, billed vs collected, kandidat isolir memakai ambang dari **snapshot**), ekspor |
| P1-5 | **SPEC-SETTINGS-AUDIT-001** | Pengaturan dan gateway | Enkripsi secret, audit log (hanya tambah), pengaturan berskema, `payment_methods` |
| P1-6 | **UI-SPEC** (`docs/ui/` masih kosong) | Pengembangan web/portal/mobile | Layar per peran, label status baku, keadaan kosong/error/muat, komponen, aksesibilitas dasar |
| P1-7 | **SPEC-PORTAL-MOBILE-001** | Capacitor | Alur login/OTP, layar pelanggan dan kolektor, push, cache baca-saja, perilaku offline/online |
| P1-8 | **Kamus data + ERD** | Sebelum skema bertambah lagi (C5.0) | Dihasilkan dari `schema.prisma`, dengan makna kolom dan status |
| P1-9 | **TEST-MASTER-PLAN** + katalog data uji sintetis | Perluasan tes | Pemetaan AC → tes, strategi per zona, data uji sintetis (tanpa data asli), kriteria G1 (properti ≥ 1.000 urutan, konkurensi, mutasi) dan hasilnya |
| P1-10 | **RISK-REGISTER hidup** | Rutin | Risiko PRD §13 dan TDD §22 yang diperbarui: pemilik, status, tanggal tinjau |
| P1-11 | **ROADMAP-ACTUAL** | Segera: kemajuan jauh di depan rencana | Peta rencana vs kenyataan, jadwal ulang, sisa pekerjaan |
| P1-12 | **Konteks per modul** (`docs/modules/<x>/README.md` atau di `src`) | Konsistensi sesi AI | Tanggung jawab, kontrak publik, tabel yang dimiliki, larangan (satu lokasi tunggal) |

---

## 4. Prioritas P2: Sebelum Go-Live

| # | Dokumen | Catatan |
| :--- | :--- | :--- |
| P2-1 | **MIGRATION-PLAN + paritas dengan sistem lama** | Pemetaan kolom spreadsheet, uji paritas rumus (prorata, diskon "Mei 2026" yang masih TBD), dry-run dengan **data sintetis/anonim**, kriteria selisih nol, rollback. Data historis asli tidak boleh masuk repo atau prompt |
| P2-2 | **Runbook operasi** | Deploy, konfigurasi lingkungan (`.env.example` tanpa nilai), backup dan restore (dengan bukti restore test), pemantauan/alarm, insiden |
| P2-3 | **RELEASE-CHECKLIST + CHANGELOG** | Gerbang go-live (TDD §18.4), catatan rilis per versi |
| P2-4 | **Dokumen kepatuhan** | Kebijakan privasi, ketentuan layanan, catatan pemrosesan data pribadi (UU PDP), retensi, prosedur penghapusan akun. Wajib untuk rilis toko aplikasi |
| P2-5 | **Dokumentasi pengguna** | Panduan admin, kolektor, pelanggan, FAQ, template pesan WA final, rencana pelatihan |
| P2-6 | **SOP dukungan dan operasional rutin** | Harian/bulanan/kuartalan (TDD §19.1), eskalasi |
| P2-7 | **Register dependensi/lisensi** | Mendukung CI-11 (allowlist) |
| P2-8 | **Paket pengajuan toko aplikasi** | Aset, deskripsi, data safety/privacy label, akun demo |
| P2-9 | **Rencana uji beban dan kapasitas** | AC-04/05: generator 2.000 invoice, pembayaran paralel |

---

## 5. Dokumen yang Ada tetapi Perlu Dirapikan

| Berkas | Masalah (dari struktur/tanggal) | Tindakan |
| :--- | :--- | :--- |
| `STATE.md` | Lihat P0-1 | Tulis ulang |
| `artifact-register.md`, `traceability-matrix.md` | Usang | P0-8 |
| `TDD-RTRW-2026-001_v1.1.md` | Amandemen belum diterapkan | P0-6 |
| `PRD-RTRW-2026-001.md` | Tertinggal dari keputusan | P0-5. Nama berkas tidak memuat versi, sebaiknya versi tertera di header dan riwayat revisi |
| `test-plan/ledger-scenarios.md` (1,9 KB, 14 Nov) | Salinan manual dari vektor, berisiko melenceng dari `ledger-vectors.json` | Hasilkan dari JSON atau hapus, satu sumber saja |
| `governance-alignment.md` | Berisi gagasan dari proposal yang oleh Owner **belum diotorisasi untuk integrasi**, dan rekomendasi ID `D-NB-###` yang tidak sesuai skema log aktual | **Pindahkan ke `docs/proposals/`** sampai rekonsiliasi tata kelola dibuka. Rekomendasi `D-NB-###` saya cabut. Ikuti skema yang sudah berjalan di log Anda |
| `DEV-RTRW-2026-001_v1.0_Playbook.md` | Masih v1.0. Catatan amandemen ada, tetapi integrasi memang belum diotorisasi | Biarkan sampai rekonsiliasi tata kelola yang dijadwalkan setelah checkpoint C3 |
| `proposals/DEV-RTRW-2026-001 v1.0.md` | Nama/ID sama dengan Playbook, memakai spasi pada nama berkas | Ganti nama (mis. `PROPOSAL-GOV-001.md`) agar ID tidak bertabrakan. Perhatikan: keputusan di log bertanggal 13 Nov, sedangkan dokumen itu baru muncul 15 Nov, periksa tanggalnya |
| Penamaan versi spec | `SPEC-LEDGER-001_v1_1.md` vs `SPEC-BILLING-001_v1.0.md` | Pilih satu gaya (`_v1.1`) |
| `_archive/` | Berisi puluhan berkas `.before/.diff` tanpa indeks | Tambah `_archive/README.md` berisi indeks per tahap dan kebijakan retensi. **Jangan dihapus**, itu jejak bukti Anda |
| `decisions.log` (21 KB) | Sudah dibersihkan menurut arsip | Pertahankan pemeriksa `check-decisions-log` di CI |

---

## 6. Yang Tidak Perlu Ditambah (Hindari Dokumentasi Berlebih)

- **Dokumen arsitektur baru yang menduplikasi TDD.** Cukup TDD v1.2 dan ADR. Tambah hanya bila kode menyimpang dari TDD.
- **Dokumen uji ledger terpisah** (skenario, properti, konkurensi, negatif). Sumber tunggal: SPEC-LEDGER + `ledger-vectors.json`.
- **ADR untuk setiap keputusan kecil.** Keputusan bisnis cukup di `decisions.log`. ADR hanya untuk keputusan arsitektur.
- **Spec untuk fitur Fase 2** (MikroTik, payment gateway) sebelum Fase 1 stabil.

---

## 7. Urutan Pengerjaan yang Disarankan

1. **P0-1** STATE.md (cepat, dampak langsung pada setiap sesi AI).
2. **P0-5 dan P0-6**: samakan PRD/TDD dengan keputusan Owner (cegah dokumen induk bertentangan dengan spec).
3. **P0-2, P0-3, P0-4** berurutan sesuai risiko: payments, auth, customers. Masing-masing diikuti **conformance review**.
4. **P0-7** register keamanan, **P0-8** matriks dan register artefak.
5. **P1-1 dan P1-2** (kontrak API dan event) sebelum notifikasi dan web.
6. P1-3..P1-7 (spec fitur dan UI) mengikuti urutan roadmap yang diperbarui (**P1-11**).
7. P2 mulai dikerjakan paralel **P2-1 (migrasi)** lebih awal, karena data lama dan paritas rumus adalah risiko terbesar di akhir.

---

## 8. Catatan Kualitas untuk Semua Dokumen Baru

- Pakai `docs/specs/TEMPLATE.md`, dengan tambahan **versi spec** dan **ID vektor/tes** pada setiap acceptance criteria.
- Setiap spec zona merah wajib memiliki **contoh berangka** (kunci jawaban) dan tes negatif.
- Setiap klaim status menunjuk bukti (hash commit, log tes, atau berkas di `_archive/`).
- Aturan yang diputuskan Owner dikutip dengan ID dari `decisions.log`, bukan disalin ulang.
- Aturan bisnis baru yang ditemukan saat menulis spec dicatat sebagai **usulan** dan menunggu keputusan Owner.
