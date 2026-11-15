# NetBill Pro: Kontrak Tata Kelola untuk Agen AI (v2)

> Baca berkas ini **penuh** di setiap sesi baru. Lalu baca `docs/STATE.md` (status terkini) dan spec tugas Anda.

## Konteks proyek
Sistem billing RT/RW Net (web + mobile). Aplikasi **KEUANGAN**: kebenaran lebih penting daripada kecepatan.

**Hierarki sumber kebenaran** (yang lebih tinggi menang):
1. `docs/decisions.log` (keputusan Owner) → 2. `docs/prd/` → 3. `docs/tdd/` + `docs/adr/` → 4. `docs/specs/` → 5. `contracts/` + `apps/api/prisma/` (schema dan migrasi) → 6. tes → 7. kode.

Keputusan berstatus `PROPOSED` atau `DEFAULT` **bukan** persetujuan. Hanya `APPROVED` yang mengikat. Usulan koreksi dari review (E-2, E-5, E-7) berstatus `PROPOSED` sampai Owner menyetujuinya.

Dokumen peringkat 1-4 **tidak boleh Anda ubah sepihak**. Bila dokumen ambigu, kosong, atau bertentangan: **BERHENTI DAN TANYA** (format di bawah).

## Otorisasi (tiga tingkat, tidak saling menggantikan)
| Tingkat | Mengizinkan | Tidak otomatis mengizinkan |
| :--- | :--- | :--- |
| **DESIGN** | Menyusun rancangan, spec, dokumen | Implementasi |
| **IMPLEMENTATION** | Menulis kode/tes untuk **satu tahap/tugas yang disebut** di `docs/STATE.md` (Current Task) | Tahap berikutnya, perubahan di luar tugas, release |
| **RELEASE** | `git push`, merge ke `main`, deploy | - |

Sebelum menulis kode, **baca `docs/STATE.md`** dan pastikan tahap/tugas Anda tertulis sebagai diotorisasi. Bila status tidak jelas atau saling bertentangan: **BERHENTI DAN TANYA**.
CI PASS, Human Review ACCEPTED, dan Release GRANTED adalah tiga bukti terpisah. CI hijau **bukan** pengganti persetujuan manusia pada zona merah.

## Peta dokumen
| Kebutuhan | Lokasi |
| :--- | :--- |
| Aturan bisnis & FR | `docs/prd/PRD-RTRW-2026-001.md` |
| Arsitektur, skema, roadmap | `docs/tdd/TDD-RTRW-2026-001.md` |
| Cara kerja dengan AI | `docs/DEV-RTRW-2026-001_AI-Playbook.md` |
| Spec per fitur | `docs/specs/*.md` (indeks: `docs/specs/README.md`) |
| Spec ledger (zona merah) | `docs/specs/SPEC-LEDGER-001_Ledger-Alokasi-Void.md` |
| Vektor uji ledger (kunci jawaban) | `docs/test-plan/ledger-vectors.json` |
| Model referensi ledger | `docs/test-plan/reference-model/` |
| Kontrak API / event | `contracts/openapi.yaml`, `contracts/events/*.schema.json` |
| Skema DB dan migrasi | `apps/api/prisma/schema.prisma`, `apps/api/prisma/migrations/` (lokasi tunggal) |
| Keputusan | `docs/decisions.log`, `docs/adr/` |
| Larangan | `docs/do-not-do.md` |
| Istilah & kamus data | `docs/glossary.md`, `docs/data-dictionary.md` |
| Konteks per modul | `modules/<nama>/README.md` |
| Pola kanonik | `docs/golden-examples.md` |
| Kebijakan data untuk alat AI | `docs/ai-usage-policy.md` |

## Stack
TypeScript strict · React 18 + Vite + Tailwind v4 · Capacitor · NestJS (Fastify) · PostgreSQL 16 · Redis + BullMQ · pnpm monorepo · Vitest · Playwright · fast-check · Stryker.

## Perintah
> Daftar ini adalah gambaran. **Verifikasi terhadap `package.json` yang sebenarnya.** Bila berbeda atau skrip belum ada, **tanyakan**: jangan mengganti nama, jangan membuat skrip baru tanpa persetujuan.

| Tujuan | Perintah |
| :--- | :--- |
| Instal | `pnpm install --frozen-lockfile` |
| Lint + batas modul | `pnpm lint` |
| Tipe | `pnpm typecheck` |
| Tes unit | `pnpm test:unit` |
| Tes integrasi (butuh Docker) | `pnpm test:integration` |
| Tes properti ledger | `pnpm test:property` |
| Tes kontrak API/event | `pnpm test:contract` |
| Tes otorisasi (peran × endpoint) | `pnpm test:authz` |
| Mutation (zona merah) | `pnpm test:mutation` |
| Cek keterlacakan PR | `pnpm check:traceability` |
| **Model referensi ledger** (tanpa DB) | `node docs/test-plan/reference-model/run-vectors.mjs` dan `node docs/test-plan/reference-model/property-test.mjs` |
| Build | `pnpm build` |
| Buat modul baru | `pnpm gen:module <nama>` (lihat `tools/gen-module.mjs`) |

## ATURAN KERAS (tidak boleh dilanggar)
1. **Uang = integer rupiah** (`bigint`). DILARANG float, `parseFloat`, `Number()` pecahan untuk nominal. Pakai util `money` di `packages/shared`.
2. `ledger_entries` dan `payment_allocations` **hanya** ditulis modul `ledger`. **Append-only.** Koreksi = entri baru (reversal), bukan update/delete.
3. Setiap tulis ledger+alokasi dalam **satu transaksi** dan **kunci baris pelanggan** (`FOR UPDATE`) lebih dulu. Urutan kunci: pelanggan → counter invoice → invoice (`due_date, issued_at, id`).
4. Semua pembayaran lewat `ledger.postPayment` dan wajib `Idempotency-Key`. Semua operasi alokasi lewat fungsi tunggal `reallocate` (SPEC-LEDGER-001 §4.1). **Jangan menduplikasi logika alokasi.**
5. Otorisasi di API: periksa **peran DAN kepemilikan data**. Endpoint `/portal/*` tidak menerima `customerId` dari klien. Akses data orang lain → `404`.
6. Modul lain hanya mengimpor dari `modules/<x>/index.ts`. Tiap tabel dimiliki satu modul.
7. Waktu lewat `Clock` (tidak `new Date()` di domain). Simpan UTC, tampil WIB (`Asia/Jakarta`).
8. Notifikasi/PDF/jaringan **tidak** dikirim di dalam transaksi DB. Tulis `outbox_events`, worker yang mengirim.
9. Jangan log data pribadi, token, OTP, secret.
10. Teks UI Bahasa Indonesia. Kode dan komentar Inggris.
11. Status tagihan **diturunkan** dari alokasi (SPEC-LEDGER §3.3), tidak diisi manual.

## Larangan tanpa izin eksplisit
- Menambah/mengubah dependensi. Ajukan: nama paket, versi, alasan, pemelihara, lisensi. Versi dipin dan berumur ≥ 14 hari.
- Mengubah migrasi yang sudah ada. Migrasi baru harus kompatibel mundur (expand/contract).
- Mengubah, menonaktifkan (`.skip`/`.only`), atau menghapus tes yang ada. Tes tampak salah → berhenti dan tanya.
- Mematikan lint/tipe (`any`, `@ts-ignore`, `eslint-disable`) tanpa alasan + ID isu.
- Mengubah `contracts/openapi.yaml`, skema event, vektor uji, atau invarian tanpa persetujuan.
- Menyentuh zona merah di luar tugas. Mencampur refactor dengan fitur.
- Memasukkan data pelanggan nyata atau secret ke prompt, kode, atau log.
- `git push`, merge ke `main`, atau force push tanpa **RELEASE authorization**. Jangan mem-push checkpoint yang gagal.
- Selengkapnya: `docs/do-not-do.md`.

## Batasan terlindungi (Protected constraints)
- Migrasi yang sudah ada (mis. C1) **dibekukan**. Perubahan skema = migrasi baru forward-only dengan otorisasi IMPLEMENTATION tersendiri.
- Aturan bisnis keuangan tidak diubah. Bila menemukan aturan yang tampak salah: laporkan sebagai usulan, jangan menerapkannya.
- Klien Prisma tidak menulis tabel ledger/alokasi. Penulisan ledger memakai SQL mentah di modul `ledger` (ADR-22).
- Jangan memakai data pelanggan nyata. Seed/fixture selalu sintetis.
- Jangan memodifikasi basis data produksi.
- `TRUNCATE ... CASCADE` hanya pada basis data tes.

## Evidence (wajib pada setiap laporan penyelesaian)
Sertakan: sumber berkas penuh yang diubah, `git diff`, hasil typecheck/lint/tes (output nyata), dan daftar yang **tidak** diverifikasi. Tanpa bukti, jangan menyatakan selesai.

## Zona risiko
- 🔴 **Merah:** `ledger`, alokasi, `billing` (generator, penomoran), `payments` (void, idempotensi), `auth`, RBAC, enkripsi secret, `db/migrations`. Tes ditinjau manusia dulu. Review manusia wajib. Tidak ada merge otomatis.
- 🟡 **Kuning:** `customers`, `packages`, `subscriptions`, `reports`, `notifications`, `import`, `invoice-docs`, `settings`.
- 🟢 **Hijau:** presentasi UI, teks, dokumentasi, skrip bantu.

## Alur kerja wajib (per tugas)
1. Baca `docs/STATE.md`, spec FR tugas, `modules/<x>/README.md`, dan berkas terkait. **Cari pola/utilitas yang sudah ada** sebelum membuat baru (`docs/golden-examples.md`).
2. Ajukan **RENCANA** singkat: berkas yang diubah, tes yang ditulis, asumsi, risiko, pertanyaan. **TUNGGU persetujuan.** Jangan menulis kode dulu.
3. Tulis **TES lebih dulu** dari acceptance criteria dan contoh berangka spec. Tunjukkan bahwa tes **GAGAL**.
4. Implementasi **minimal** sampai tes **LULUS**. Tidak menambah fitur di luar spec.
5. Jalankan lint, tipe, tes. **Tampilkan hasilnya.** Jangan klaim "berhasil" tanpa bukti.
6. Review diri adversarial: kasus tepi uang, konkurensi, idempotensi, otorisasi/IDOR, tes yang tak benar-benar menguji.
7. Perbarui spec/dokumen/`docs/STATE.md` bila perilaku berubah. Catat keputusan di `docs/decisions.log`.
8. PR kecil (≤ ~300 baris bermakna), judul memuat ID (`FR-…`/`ADR-…`/`FIX-…`). Tulis apa yang **TIDAK** Anda verifikasi.

## Protokol "Berhenti dan Tanya"
Berhenti dan bertanya bila: spec ambigu/bertentangan; aturan keuangan belum didefinisikan; perlu mengubah skema DB, kontrak API, atau dependensi; tes tampak salah; tugas menyentuh area di luar zona yang ditugaskan.
Format: **Kondisi → Dokumen yang dirujuk → Opsi A/B beserta konsekuensi → Rekomendasi.** Jawaban Owner dicatat di `docs/decisions.log`.

## Gaya
Ikuti `docs/golden-examples.md`. Fungsi kecil, nama jelas, tanpa abstraksi prematur (abstraksi hanya bila ≥ 2 pemakaian atau kebutuhan Fase 2 nyata).

## Akhir sesi
Perbarui `docs/STATE.md` (selesai, belum, blokir, langkah berikutnya) dan keputusan di `docs/decisions.log`. Daftar berkas yang diubah dan tes yang menjaganya.
