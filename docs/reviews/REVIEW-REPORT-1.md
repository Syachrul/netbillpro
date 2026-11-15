# Laporan Review Dokumen (15 November 2026)

**Dokumen ditinjau:** `PRD-RTRW-2026-001_v1_1.md` (+ Addendum Rekonsiliasi), `DEV-RTRW-2026-001_v1_0_Playbook.md`, `ADR-Register.md`, `do-not-do.md`, `glossary.md`, `STATE.md`.
**Metode:** pembacaan penuh, pemeriksaan otomatis rujukan silang dan tabel pada PRD, perbandingan dengan versi sebelumnya (diff), serta verifikasi aturan ledger dengan model referensi.
**Tingkat:** 🔴 tinggi (dapat menyebabkan salah implementasi/kebocoran data) · 🟠 sedang · 🟡 rendah.

## 1. Ringkasan
Dokumen sudah menunjukkan disiplin yang baik: hierarki sumber kebenaran, fase Documentation-First, dan penahanan (HOLD) kode zona merah sebelum dokumen direkonsiliasi. Strukturnya juga bersih (lihat bukti di bagian 5). Masalah utamanya bukan pada struktur, melainkan pada **isi yang tidak selaras dengan hasil verifikasi terbaru**: PRD yang berstatus "Disetujui" masih memuat satu skenario yang salah dan belum memuat satu aturan wajib, sedangkan dokumen operasional (`do-not-do`, `glossary`, `STATE`, ADR) belum mencerminkan keputusan Prisma/pnpm dan belum memberi gerbang yang jelas untuk membuka C3.

**Tiga hal yang paling mendesak:**
1. **Tes C2-3 (16 file) dibuat dari spec versi lama.** Spec kini 18 vektor + aturan BR-V6 + koreksi E-1. Tes harus diperbarui sebelum direview (F-22).
2. **Migrasi Prisma kemungkinan belum memuat koreksi skema E-3 dan E-5**, dan TDD §8.2 memuat bug E-1. Jalankan *Schema Conformance Checklist* (F-26).
3. **Spreadsheet pelanggan asli tidak boleh dipakai sebagai seed** atau masuk repositori/prompt (F-21).

## 2. Temuan per Dokumen
| ID | Dok | Tingkat | Temuan | Bukti | Perbaikan (berkas di paket ini) |
| :--- | :--- | :---: | :--- | :--- | :--- |
| F-01 | PRD | 🔴 | **Status bertentangan:** header "Draft for Review" (baris 14), Addendum "Disetujui" (baris 530) | Pemeriksaan teks | Header diselaraskan; syarat OQ DEFAULT dicantumkan (`PRD v1_2`) |
| F-02 | PRD | 🔴 | **S4 masih "Belum Lunas"** (baris 282). Deposit yang teralokasi membuat status `Dibayar Sebagian`. Kunci jawaban spec dan model menyatakan hal berbeda | Vektor S4 lulus pada model dengan `DIBAYAR_SEBAGIAN` | S4 dikoreksi (E-2, perlu konfirmasi Owner: D-1) |
| F-03 | PRD | 🔴 | **Tidak ada BR-V6.** Void pembayaran yang dananya sudah di-refund merusak invarian I-3 | Ditemukan uji properti; mutasi menghapus aturan ini tertangkap | FR-PAY-06 diperbarui; vektor T21 |
| F-04 | PRD | 🟠 | "Disetujui" sementara 7 dari 11 OQ belum ditetapkan; Bagian 15 masih berupa daftar pertanyaan tanpa status. Addendum hanya memuat OQ-1, 3, 5, 6 | Bagian 15 vs Addendum | Kolom Status/Keputusan; OQ lain = DEFAULT (usulan) menunggu konfirmasi |
| F-05 | PRD | 🟠 | Addendum merujuk ID `D-2026-11-13-OQ-n` pada `decisions.log` yang **tidak ikut diunggah**. Skema ID berbeda dari Playbook (`D-001`) | Daftar unggahan | Playbook P2: samakan ke `D-<tanggal>-<kode>`. **Mohon pastikan entri itu ada** |
| F-06 | PRD | 🟠 | FR-BIL-03 tanpa batas total > 0 (ledger butuh debit > 0) | Spec BR-I1 | Ditambahkan (E-5) |
| F-07 | PRD | 🟡 | Versi tetap 1.1 padahal isi berubah (Addendum); riwayat revisi tidak mencatatnya | Riwayat revisi | Versi 1.2 + baris revisi |
| F-08 | PRD | 🟡 | Keputusan T1 (pnpm) dan T2 (Prisma + SQL mentah) hanya di Addendum, tidak menjadi ADR | ADR Register | ADR-21, ADR-22 |
| F-09 | ADR | 🟠 | Status "DRAFT" dan 16 butir "Diusulkan", padahal ADR-01/02/03/07/12 sudah menjadi dasar kode Tahap B/C | STATE vs Register | Status disesuaikan, ada kolom Dasar dan Implementasi |
| F-10 | ADR | 🟠 | ADR-06 dan ADR-10 "Menunggu OQ" padahal OQ-5 dan OQ-1 sudah FINAL | Addendum | Menjadi Diterima |
| F-11 | ADR | 🟠 | Hanya satu kolom alasan, tanpa konteks, alternatif, konsekuensi, dan berkas individual | Register | 22 berkas ADR dengan format lengkap |
| F-12 | ADR | 🟠 | **ADR-04 (alokasi FIFO) dan ADR-14 masih Diusulkan**, padahal C3 bergantung padanya | Register | Gerbang eksplisit "harus Diterima sebelum C3" |
| F-13 | ADR | 🟡 | ADR-10 ("≤ 2000") berbeda dari PRD (target awal 2.000, desain hingga 5.000); ADR-08 menyempit dari TDD tanpa catatan | TDD vs Register | Diselaraskan dan dicatat |
| F-14 | ADR | 🟡 | Tidak ada ADR untuk model referensi dan Documentation-First | - | ADR-19, ADR-20 |
| F-15 | do-not-do | 🟠 | Daftar tanpa alasan dan penegak | Berkas | Tabel dengan Alasan + Penegak; yang belum ada penegaknya ditandai |
| F-16 | do-not-do | 🔴 | **Tidak ada larangan khusus Prisma** (T2): tulis ledger via klien Prisma, `db push`, DROP objek kustom oleh `migrate dev`, `Float/Decimal`, serialisasi BigInt | ADR-22 | Bagian B (butir 14-19) |
| F-17 | do-not-do | 🔴 | **Tidak ada larangan data pelanggan asli** di repo/seed/prompt | Lihat F-21 | Butir 27 |
| F-18 | do-not-do | 🟠 | Hilang: BR-V6, status manual, invoice immutable, `404` vs `403`, urutan kunci, `Clock`, batas modul, klaim tanpa bukti, gerbang C3 | Perbandingan | Butir tambahan bertanda ★ |
| F-19 | glossary | 🟠 | Definisi kurang presisi: "Dana bebas" tidak mengecualikan `REVERSAL` (inilah akar bug E-1); "Saldo" tanpa rumus; "Alokasi" tanpa refund/tanda; FIFO ambigu | Perbandingan dengan spec | Didefinisikan ulang |
| F-20 | glossary | 🟡 | Istilah hilang: reallocate, sumber dana, saldo awal, refund, invarian, vektor, oracle, DEFAULT/FINAL, HOLD, Documentation-First | - | Ditambahkan (★) |
| F-21 | STATE | 🔴 | "Seeds menunggu data spreadsheet asli" dicatat sebagai **blokir**. Seed harus **sintetis**; data asli hanya untuk migrasi di lingkungan privat | Kebijakan data (Playbook, TDD §18-20, UU PDP) | Dikoreksi: bukan blokir |
| F-22 | STATE | 🟠 | **Drift spec ↔ tes:** 16 file tes dari spec v1.0; spec v1.1 = 18 vektor + N-13 + E-1 | Jumlah vektor | Tindakan wajib 1-7 + `check-vector-coverage.mjs` |
| F-23 | STATE | 🟠 | Tidak ada pemetaan Tahap A-C ke Roadmap/gerbang, dan "jika disetujui buka C3" tanpa kriteria | Berkas | Pemetaan + Checklist Pembukaan C3 |
| F-24 | STATE | 🟠 | Klaim selesai tanpa bukti (hash commit, jumlah tes, status CI); "terverifikasi trigger/CHECK" tanpa rujukan | Berkas | Disclaimer + kewajiban mencatat bukti |
| F-25 | STATE | 🟡 | Rekonsiliasi TDD tertunda | Langkah #2 | `TDD-Amendment-Notes.md` |
| F-26 | Lintas | 🔴 | TDD §8.2 memuat **bug E-1**, dan skema (E-3, E-5) mungkin belum benar di migrasi Prisma | Uji mutasi; DDL TDD lama | TDD-Amendment A2-A4 + Checklist B |
| F-27 | Lintas | 🟠 | **Tabrakan penomoran** skenario: TDD T-16 (refund)/T-17 (IDOR) vs vektor baru | Perbandingan ID | Vektor baru diberi ID T21 dan T22 |
| F-28 | Playbook | 🟠 | Identik v1.0; belum mencerminkan Prisma/pnpm, gerbang Documentation-First, drift spec-tes, ID keputusan, kebijakan seed | Diff = 0 | `PLAYBOOK-Amendment-Notes.md` (P1-P10) |

## 3. Bukti Verifikasi
| Pemeriksaan | Hasil |
| :--- | :--- |
| Rujukan silang ID pada PRD (FR/MOB/AC/OQ/R) | 101 terdefinisi, **0 menggantung, 0 ganda** |
| Integritas tabel markdown pada PRD | **0** baris dengan jumlah kolom berbeda |
| Model referensi ledger: 18 vektor (S1-S8, T9-T15, T21-T22) | **18/18 lulus** |
| Uji properti (3 seed × 3.000 urutan × 40 langkah, invarian I-1..I-8 setelah tiap langkah) | **Lulus** |
| Uji mutasi 1: aturan BR-V6 dimatikan | **Tertangkap** (I-3 dilanggar) |
| Uji mutasi 2: filter tipe `REVERSAL` (E-1) dimatikan | **Tertangkap** pada langkah ke-1 s.d. ke-2 |
| `check-vector-coverage.mjs` pada simulasi 16 tes lama | Menandai T21, T22, N-13 sebagai belum bertes; setelah dilengkapi: lulus |

## 4. Yang TIDAK Dapat Saya Verifikasi
- **TDD terbaru, `decisions.log`, skema/migrasi Prisma, 16 file tes, konfigurasi CI** tidak diunggah. Klaim di STATE (trigger/CHECK terverifikasi, 4/4 tes lulus) saya perlakukan sebagai belum terverifikasi.
- **SQL tidak dijalankan pada PostgreSQL** di lingkungan saya (tidak tersedia). Checklist B memakai katalog standar PostgreSQL tetapi belum dieksekusi. Nama tabel mungkin perlu disesuaikan dengan pemetaan Prisma Anda.
- Model referensi membuktikan **desain aturan** konsisten. Ia **tidak** membuktikan kode LedgerService benar. Itu tugas C3 dengan tes DB, uji konkurensi, dan mutasi.
- Perilaku `prisma migrate dev` terhadap objek DB kustom perlu diuji di versi Prisma Anda (saya tidak mengasumsikan hasilnya).
- Kolom "Implementasi" pada ADR Register diturunkan dari STATE, bukan dari kode.

## 5. Yang Sudah Baik (Dipertahankan)
Hierarki sumber kebenaran dan disiplin HOLD pada zona merah; PRD terstruktur rapi dengan ID konsisten; keputusan Owner dicatat bertanggal; fixtures/Testcontainers disiapkan sebelum implementasi; penggunaan jalur "dokumen dulu, kode kemudian" sesuai Playbook.

## 6. Urutan Penerapan yang Disarankan
1. Ganti PRD v1_1 → **v1_2**; ganti `ADR-Register`, `do-not-do`, `glossary`, `STATE`; tambahkan 22 berkas `adr/`.
2. Terapkan **TDD-Amendment-Notes** (Bagian A) ke TDD; jalankan **Bagian B** pada migrasi Prisma, catat hasilnya di STATE.
3. Gantikan spec ledger dengan **v1.1**; salin `ledger-vectors.json` dan `reference-model/`; jalankan model di CI.
4. Perbarui 16 file tes → 18 vektor + N-1..N-13; pasang `check-vector-coverage.mjs` di CI.
5. Terapkan **PLAYBOOK-Amendment-Notes**; tambahkan lint/CI untuk ADR-22 (Bagian C).
6. Owner: konfirmasi OQ-2 dan OQ-8 (dan D-1), setujui ADR-04/14, centang *Checklist Pembukaan C3*, tulis persetujuan di `decisions.log`.
7. Baru buka C2-3 (review tes) lalu C3.
