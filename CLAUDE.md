# NetBill Pro: Aturan untuk Agen AI

## Konteks proyek
Sistem billing RT/RW Net (web + mobile). Aplikasi KEUANGAN: kebenaran lebih penting daripada kecepatan.
Dokumen acuan: docs/ (PRD, TDD, Playbook, SPEC-LEDGER), docs/decisions.log, docs/STATE.md, docs/do-not-do.md.
Hierarki sumber kebenaran: keputusan Owner > PRD > TDD/ADR > spec > kontrak > tes > kode.
JANGAN mengubah dokumen peringkat atas tanpa persetujuan. Bila dokumen ambigu atau bertentangan: BERHENTI DAN TANYA.

## Stack (target)
TypeScript strict; React + Vite + Tailwind; Capacitor; NestJS; PostgreSQL; Redis + BullMQ; pnpm monorepo.
ORM: Prisma untuk CRUD, SQL mentah (Kysely/$queryRaw) untuk ledger.

## Perintah (setelah Tahap B)
- Instal: `pnpm install`
- Lint/tipe: `pnpm lint && pnpm typecheck`
- Tes unit/integrasi: `pnpm test` (butuh Docker untuk Postgres)
- Tes ledger saja: `pnpm test --filter ledger`
- Build: `pnpm build`

## ATURAN KERAS (tidak boleh dilanggar)
1. Uang = integer rupiah (bigint). DILARANG float/Number pecahan. Pakai util `money` bersama.
2. `ledger_entries` & `payment_allocations` HANYA ditulis oleh modul `ledger`. Append-only. Koreksi = entri baru (reversal), bukan update/delete.
3. Setiap tulis ledger+alokasi dalam SATU transaksi, kunci baris pelanggan (FOR UPDATE). Urutan kunci: pelanggan -> counter nomor invoice -> invoice (due_date, issued_at, id).
4. Pembayaran: wajib Idempotency-Key. Semua sumber pembayaran lewat `ledger.postPayment`. Satu fungsi `reallocate` untuk alokasi.
5. Otorisasi di API: periksa peran DAN kepemilikan data. Endpoint /portal/* tidak menerima customerId dari klien.
6. Modul lain hanya mengimpor dari `modules/<x>/index.ts`. Tabel dimiliki satu modul.
7. Waktu lewat `Clock`; simpan UTC, tampil WIB. Jangan `new Date()` di domain.
8. Jangan log data pribadi, token, OTP, atau secret.
9. Teks UI Bahasa Indonesia; kode & komentar Inggris.
10. Sumber dana bebas = kredit tipe PEMBAYARAN / PENYESUAIAN_KREDIT / SALDO_AWAL yang belum dibalik. Entri REVERSAL tidak pernah menjadi sumber (SPEC-LEDGER E-1).
11. Tidak ada deposit menganggur selama ada invoice terbuka (invarian I-7). Panggil `reallocate` di akhir setiap operasi.

## Larangan tanpa izin eksplisit
- Menambah/mengubah dependensi (npm). Tanyakan dulu dengan alasan, nama paket, versi, pemelihara.
- Mengubah migrasi lama; migrasi baru harus kompatibel mundur (expand/contract).
- Mengubah, menonaktifkan (.skip/.only), atau menghapus tes yang ada. Jika tes tampak salah: berhenti dan tanya.
- Mematikan aturan lint/tipe (any, @ts-ignore, eslint-disable) tanpa alasan + ID isu.
- Mengubah kontrak API (contracts/openapi.yaml) atau skema event tanpa persetujuan.
- Menyentuh zona merah di luar tugas. Refactor bercampur fitur.
- Memasukkan data pelanggan nyata atau secret ke mana pun.

## Alur kerja wajib (per tugas)
1. Baca spec FR yang ditugaskan + README modul + berkas terkait. Cari pola/utilitas yang sudah ada.
2. Ajukan RENCANA singkat (berkas, tes, asumsi, risiko). TUNGGU persetujuan.
3. Tulis TES lebih dulu dari acceptance criteria; tunjukkan bahwa tes GAGAL.
4. Implementasi minimal sampai tes LULUS. Jangan menambah fitur di luar spec.
5. Jalankan lint, tipe, tes; tampilkan hasilnya. Jangan klaim "berhasil" tanpa bukti.
6. Review diri secara adversarial (kasus tepi, konkurensi, otorisasi, uang).
7. Perbarui spec/dokumen/STATE.md bila perilaku berubah. Catat keputusan di decisions.log.
8. PR kecil, judul memuat ID FR. Sebutkan apa yang TIDAK diverifikasi.

## Zona risiko
Merah (ledger, alokasi, billing, payments, auth, RBAC, secret, migrasi): ekstra hati-hati, tes dulu, review manusia wajib.
Kuning (CRUD, laporan, notifikasi, impor, PDF). Hijau (UI presentasi, dokumentasi).

## Gaya
Ikuti golden example di `modules/packages` (akan dibuat). Fungsi kecil, nama jelas, tanpa abstraksi prematur.

## ATURAN KERAS #12: @Inject() eksplisit WAJIB

Setiap file di `apps/api/src/modules/` yang memakai dependency injection WAJIB pakai `@Inject()` eksplisit di constructor:

```typescript
// BENAR:
constructor(
  @Inject(PrismaClient) private readonly prisma: PrismaClient,
  @Inject(LedgerService) private readonly ledger: LedgerService,
) {}

// SALAH (error "Cannot read properties of undefined"):
constructor(
  private readonly prisma: PrismaClient,
  private readonly ledger: LedgerService,
) {}
Berlaku untuk semua: PrismaClient, JwtService, Reflector, dan setiap service yang di-inject. Kombinasi emitDecoratorMetadata + Fastify adapter gagal resolve tipe otomatis.

Jika menemui error Cannot read properties of undefined (reading 'x') di runtime/HTTP test: gejala klasik DI. Perbaiki dengan @Inject().
