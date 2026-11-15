# STATE.md: Status Proyek (v2)

**Terakhir diperbarui:** 15 November 2026 (revisi hasil review dokumen)
**Fase:** Documentation-First. Kode zona merah (C2-3 review tes, C3 LedgerService) **ditahan (HOLD)**.
**Gerbang berikutnya:** G1 "Ledger Proven" (lihat Roadmap TDD §16.4). Untuk membukanya, penuhi *Checklist Pembukaan C3* di bawah.

> ⚠️ **KONFLIK SUMBER STATUS (belum terselesaikan).** Usulan DEV-RTRW (bagian 4.2) menyatakan C2-2-1 masih menunggu review, C2-2-2/3 belum dimulai, C2-3 tidak diotorisasi. Versi STATE sebelumnya menyatakan C2-2 selesai dan 16 file tes C2-3 sudah dibuat. **Buktikan dari `git log`/`git status`/hasil tes lalu koreksi berkas ini** (lihat `governance-alignment.md` §4). Sampai itu dilakukan, status berkas ini diperlakukan **BLOCKED**.
>
> **Koreksi E-2, E-5, E-7 berstatus PROPOSED**, bukan keputusan (lihat `governance-alignment.md` §6).

> Fakta pada bagian "Selesai" diturunkan dari STATE sebelumnya (13 Nov 2026) dan **belum diverifikasi ulang oleh reviewer**. Perbarui bagian ini dengan hasil nyata (hash commit, jumlah tes, status CI) di akhir setiap sesi.

## Pemetaan Tahap ke Roadmap
| Tahap (istilah proyek) | Setara Roadmap TDD | Catatan |
| :--- | :--- | :--- |
| A: Harness & Git Init | S1 (M0 Fondasi) | |
| B: Monorepo (shared, api, web, worker), CI, Docker Compose | S1 (M0 Fondasi) | |
| C0-C1: Prisma schema & migrasi | S1-S2 | Trigger/CHECK terverifikasi menurut catatan lama. Wajib lulus *Schema Conformance Checklist* (lihat `TDD-Amendment-Notes.md` §B) |
| C2-1/C2-2: Testcontainers & fixtures | S3 (persiapan) | 4/4 tes lulus menurut catatan lama |
| C2-3: Tes vektor ledger | S3 | 16 file tes dibuat, **menunggu review**. Perlu diperluas ke 18 vektor |
| C3: Implementasi LedgerService | S3 | **Belum diotorisasi** |

## Selesai
- [x] **Tahap A:** Harness & Git Init
- [x] **Tahap B:** Monorepo, CI, Docker Compose
- [x] **Tahap C0-C1:** Prisma Schema & Migrasi (menurut catatan: trigger/CHECK terverifikasi)
- [x] **Tahap C2-1 & C2-2:** Testcontainers & Fixtures (4/4 tes lulus)
- [x] **Doc-1:** Reorganisasi `docs/`
- [x] **Doc-2:** Ekstraksi ADR Register & Ledger Test Plan
- [x] **Doc-3:** Rekonsiliasi PRD
- [x] **Review dokumen (15 Nov):** PRD v1.2, ADR Register v1.1 + 22 ADR, do-not-do v2, glosarium v2, catatan amandemen TDD & Playbook, SPEC-LEDGER v1.1 + 18 vektor + model referensi (18/18 lulus; uji properti 3×3.000 urutan lulus; 2 mutasi tertangkap)

## Sedang Dikendalikan (HOLD)
- **C2-3:** 16 file tes vektor sudah dibuat, menunggu review. **Harus diperbarui** (lihat tindakan di bawah).
- **Contracts:** menunggu katalog event final (ADR-15 masih Diusulkan).
- **Seeds:** lihat Blokir. Seed **wajib sintetis**.

## Tindakan Wajib Sebelum Review C2-3
| # | Tindakan | Alasan |
| :--- | :--- | :--- |
| 1 | Terapkan `TDD-Amendment-Notes.md` ke TDD (E-1, E-3, E-5, I-2/I-3/I-7/I-8, banner) | TDD belum direkonsiliasi; query sumber dana TDD §8.2 memuat bug E-1 |
| 2 | Ganti SPEC-LEDGER v1.0 dengan **v1.1** | Menambah BR-V6, E-7, T16, T17 |
| 3 | Tambah tes untuk **T21, T22, N-13** dan tes khusus E-1 (void tagihan tidak membuat deposit palsu) pada 16 file tes yang ada | 16 file tes dibuat dari spec v1.0 (16 vektor); sekarang 18 vektor |
| 4 | Salin `ledger/reference-model/` ke repo dan jalankan di CI (`run-vectors.mjs`, `property-test.mjs`) | Pagar logika independen |
| 5 | Jalankan *Schema Conformance Checklist* pada migrasi Prisma | Memastikan E-3 (`invoice_id` nullable + `refund_ledger_id` + CHECK), E-5 (`total > 0`), trigger, unique parsial |
| 6 | Setujui/ubah **ADR-04 dan ADR-14** (masih Diusulkan) | Prasyarat C3 |
| 7 | Konfirmasi OQ-2 dan OQ-8 di `decisions.log` (FINAL atau tetap DEFAULT) | OQ-8 sebelum S5; OQ-2 sebelum uji beban |

## Blokir / Keterbatasan
- **Spreadsheet data pelanggan asli belum tersedia.** Catatan penting: data asli **tidak boleh** masuk repositori, seed, fixture, prompt, atau CI. Seed pengembangan harus **sintetis**. Data asli hanya dipakai pada tahap migrasi (S11) di lingkungan privat, didahului dry-run dengan data teranonimisasi (TDD §18). Dengan demikian "Seeds menunggu spreadsheet asli" **bukan blokir** untuk pengembangan.
- Kode LedgerService (C3) belum diotorisasi.
- Berkas yang tidak ikut ditinjau karena tidak diunggah: TDD terbaru, `decisions.log`, skema Prisma, 16 file tes, konfigurasi CI.

## Checklist Pembukaan C3 (gerbang)
- [ ] PRD v1.2 dipakai sebagai baseline (tanpa konflik S4/BR-V6)
- [ ] TDD diamandemen sesuai `TDD-Amendment-Notes.md`
- [ ] SPEC-LEDGER v1.1 menjadi spec yang berlaku (18 vektor)
- [ ] ADR-03, 04, 09, 14, 19, 22 berstatus **Diterima**
- [ ] Skema lolos *Schema Conformance Checklist*
- [ ] 18 vektor + N-1..N-13 ada sebagai tes, **ditinjau manusia** terhadap kunci jawaban
- [ ] Model referensi berjalan di CI
- [ ] Gerbang CI minimal aktif: lint batas modul, larangan tulis ledger via klien Prisma, cek drift skema, pemindaian secret, larangan `.skip`
- [ ] `decisions.log` memuat keputusan Owner `APPROVED` atas BR-V6 dan "REVERSAL bukan sumber dana" (saat ini hanya `PROPOSED`)
- [ ] Owner menyetujui pembukaan C3 secara tertulis di `decisions.log`

## Langkah Berikutnya
1. Terapkan tindakan wajib 1-7 di atas (berurutan).
2. Owner mereview kelengkapan dokumentasi dan menyetujui checklist gerbang.
3. Bila disetujui: buka C2-3 (review tes), lalu C3 (implementasi LedgerService dengan `reallocate`), satu sesi per tugas.
4. Setelah C3 lulus semua vektor + uji properti + mutasi: tutup G1, lanjut S4 (billing & pembayaran).

## Keputusan Terbaru
Lihat `docs/decisions.log`. Usulan dari review yang menunggu persetujuan Owner (`PROPOSED`): BR-V6, REVERSAL bukan sumber dana, status S4, `total > 0`. Skema ID keputusan: lihat `governance-alignment.md` §3.
