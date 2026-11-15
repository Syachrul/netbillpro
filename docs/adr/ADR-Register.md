# Architecture Decision Record (ADR) Register

**Versi:** 1.1 (rekonsiliasi 15 Nov 2026)    **Sumber:** TDD-RTRW-2026-001 §2.2 dan §25.13, Addendum PRD (T1, T2, OQ), STATE.md
**Status dokumen:** Aktif. Berkas ADR individual tersedia di `adr/` (satu berkas per keputusan).

## Aturan status
| Status | Arti |
| :--- | :--- |
| **Diterima** | Berlaku dan boleh dijadikan dasar implementasi. Ada dasar tercatat (OQ FINAL, Addendum, atau sudah diimplementasikan) |
| **Diusulkan** | Belum disetujui. **Tidak boleh dijadikan dasar implementasi** pada area terkait sampai diterima |
| **Digantikan** | Diganti ADR lain (cantumkan nomornya) |

Mengubah ADR = tambah ADR baru yang menggantikan. Jangan mengedit alasan keputusan lama.

## Register
| ID | Keputusan | Status | Dasar | Implementasi |
| :--- | :--- | :--- | :--- | :--- |
| [ADR-01](adr/ADR-0001.md) | Modular monolith | **Diterima** | Struktur repo Tahap B (api, worker, web, shared) | Sebagian: batas modul belum ditegakkan lint (verifikasi di C3) |
| [ADR-02](adr/ADR-0002.md) | PostgreSQL sebagai DB utama | **Diterima** | Tahap C0-C1, Testcontainers (C2-1/2) | Ya |
| [ADR-03](adr/ADR-0003.md) | Ledger append-only + balance_after | **Diterima** | Trigger/CHECK terverifikasi di Tahap C0-C1 (STATE) | Sebagian: skema ada; LedgerService belum (C3) |
| [ADR-04](adr/ADR-0004.md) | Alokasi pembayaran eksplisit (FIFO) + fungsi tunggal reallocate | **Diusulkan** | Menunggu persetujuan **sebelum C3** (gerbang) | Belum (C3) |
| [ADR-05](adr/ADR-0005.md) | Transactional outbox + BullMQ | **Diusulkan** | Menunggu persetujuan sebelum Sprint notifikasi (S5) | Belum |
| [ADR-06](adr/ADR-0006.md) | Mobile: React + Tailwind + Capacitor | **Diterima** | OQ-5 FINAL (D-2026-11-13-OQ-5) | Belum (M4) |
| [ADR-07](adr/ADR-0007.md) | TypeScript di seluruh stack (monorepo) | **Diterima** | Tahap B (monorepo shared/api/web/worker) | Ya |
| [ADR-08](adr/ADR-0008.md) | PDF dengan pustaka dokumen ringan (pdfmake) | **Diusulkan** | Menunggu persetujuan sebelum S5. Diperjelas dari TDD (pdfmake atau react-pdf) menjadi pdfmake | Belum |
| [ADR-09](adr/ADR-0009.md) | Uang sebagai integer rupiah (BIGINT) | **Diterima** | Aturan keras CLAUDE.md; skema Tahap C0-C1 | Sebagian: verifikasi pemetaan BigInt Prisma ↔ TypeScript |
| [ADR-10](adr/ADR-0010.md) | Single-tenant Fase 1 | **Diterima** | OQ-1 FINAL (D-2026-11-13-OQ-1) | Ya (skema tanpa tenant_id) |
| [ADR-11](adr/ADR-0011.md) | JWT access pendek + refresh rotasi | **Diusulkan** | Menunggu persetujuan sebelum modul auth | Belum |
| [ADR-12](adr/ADR-0012.md) | Docker Compose pada satu VPS | **Diterima** | Tahap B (Docker Compose) | Ya (lokal/CI). Produksi belum |
| [ADR-13](adr/ADR-0013.md) | Object storage S3-compatible | **Diusulkan** | Menunggu persetujuan sebelum S5/S7 | Belum |
| [ADR-14](adr/ADR-0014.md) | Modul compile-time + manifest + feature flag | **Diusulkan** | Menunggu persetujuan sebelum C3 | Belum |
| [ADR-15](adr/ADR-0015.md) | Katalog domain event berversi | **Diusulkan** | Menunggu katalog event final (blokir Contracts, lihat STATE) | Belum |
| [ADR-16](adr/ADR-0016.md) | Ports & Adapters (MessageChannel, StorageProvider, PdfRenderer, dst.) | **Diusulkan** | Menunggu persetujuan sebelum S5 | Belum |
| [ADR-17](adr/ADR-0017.md) | Metode bayar/jenis item berbasis data | **Diusulkan** | Menunggu persetujuan sebelum perubahan skema berikutnya | Belum: verifikasi apakah skema C0-C1 memakai enum |
| [ADR-18](adr/ADR-0018.md) | Frontend berbasis fitur (registri modul) | **Diusulkan** | Menunggu persetujuan sebelum S2/S7 | Belum |
| [ADR-19](adr/ADR-0019.md) | Model referensi ledger (oracle) sebagai pagar logika | **Diterima** | Hasil verifikasi: 18/18 vektor lulus, uji properti, 2 mutasi tertangkap | Tersedia di paket review (`ledger/reference-model`); perlu disalin ke repo |
| [ADR-20](adr/ADR-0020.md) | Documentation-First sebagai gerbang sebelum implementasi zona merah | **Diterima** | STATE (fase Documentation-First, HOLD C2-3/C3) | Ya |
| [ADR-21](adr/ADR-0021.md) | Package manager: pnpm (T1) | **Diterima** | Addendum PRD (T1) | Ya |
| [ADR-22](adr/ADR-0022.md) | ORM: Prisma untuk CRUD + SQL mentah untuk ledger (T2) | **Diterima** | Addendum PRD (T2); Tahap C0-C1 | Sebagian: skema ada; ledger raw SQL belum (C3) |

## Gerbang persetujuan sebelum C3 (LedgerService)
ADR yang **harus berstatus Diterima** sebelum C3 dibuka: **ADR-03, ADR-04, ADR-09, ADR-14, ADR-19, ADR-22**. Saat ini **ADR-04 dan ADR-14 masih Diusulkan**: setujui (atau ubah) keduanya lebih dulu.
ADR yang harus Diterima sebelum sprint notifikasi (S5): ADR-05, ADR-08, ADR-13, ADR-16.

## Catatan rekonsiliasi
1. Register v1.0 berstatus DRAFT padahal ADR-01, 02, 03, 07, 12 sudah menjadi dasar kode Tahap B/C. Statusnya kini disesuaikan dengan kenyataan. **Kolom Implementasi diturunkan dari STATE.md dan perlu diverifikasi Eng Lead.**
2. ADR-06 dan ADR-10 tidak lagi "Menunggu OQ": OQ-5 dan OQ-1 sudah FINAL (Addendum PRD).
3. Ditambahkan ADR-19 s.d. ADR-22: model referensi ledger, Documentation-First, pnpm (T1), Prisma + SQL mentah (T2). Keputusan T1/T2 sebelumnya hanya ada di Addendum PRD, belum tercatat sebagai ADR.
4. ADR-08 diperjelas dari "pdfmake atau react-pdf" (TDD) menjadi pdfmake dengan alternatif terdokumentasi.
5. ADR-10: skala diselaraskan dengan PRD §1.5 (2.000 saat go-live, desain hingga 5.000).
