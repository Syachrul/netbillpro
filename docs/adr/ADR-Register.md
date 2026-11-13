# Architecture Decision Record (ADR) Register

**Sumber:** TDD-RTRW-2026-001 v1.1 §2.2 dan §25.13
**Status:** DRAFT — Menunggu rekonsiliasi formal

Dokumen ini mengekstrak keputusan arsitektur dari TDD ke dalam register terpusat.

| ID | Keputusan | Alasan | Status |
| :--- | :--- | :--- | :--- |
| ADR-01 | Modular monolith | Tim kecil, skala kecil, ACID lintas modul | Diusulkan |
| ADR-02 | PostgreSQL sebagai DB utama | ACID kuat, FOR UPDATE, partial unique index | Diusulkan |
| ADR-03 | Ledger append-only + balance_after | Audit, anti-manipulasi, rekonsiliasi | Diusulkan |
| ADR-04 | Alokasi pembayaran eksplisit (FIFO) | Status per tagihan tidak bisa diturunkan dari saldo total | Diusulkan |
| ADR-05 | Transactional Outbox + BullMQ | Gangguan gateway tidak menggagalkan transaksi | Diusulkan |
| ADR-06 | Mobile: React + Capacitor | Satu basis kode dengan web | Menunggu OQ-5 |
| ADR-07 | TypeScript di seluruh stack | Tipe dan validasi dibagi (Zod) | Diusulkan |
| ADR-08 | PDF dengan pustaka ringan (pdfmake) | p95 < 1,5 detik, memori kecil | Diusulkan |
| ADR-09 | Integer rupiah (BIGINT) | IDR tanpa desimal, hindari galat pembulatan | Diusulkan |
| ADR-10 | Single-tenant Fase 1 | Skala <= 2000 pelanggan | Menunggu OQ-1 |
| ADR-11 | JWT access pendek + refresh rotasi | Cocok web+mobile, dapat dicabut | Diusulkan |
| ADR-12 | Docker Compose satu VPS | Biaya & kompleksitas minimal | Diusulkan |
| ADR-13 | Object storage S3-compatible | Backup & akses terkontrol | Diusulkan |
| ADR-14 | Modul compile-time + manifest | Bukan plugin runtime dinamis | Diusulkan |
| ADR-15 | Katalog domain event berversi | Kontrak antar modul | Diusulkan |
| ADR-16 | Ports & Adapters (MessageChannel, dll) | Penyedia eksternal mudah diganti | Diusulkan |
| ADR-17 | Metode bayar/jenis item berbasis data | Tidak kaku seperti enum | Diusulkan |
| ADR-18 | Frontend berbasis fitur (registri modul) | Code-splitting & modularitas | Diusulkan |

**Catatan:** File ADR individual akan dibuat saat rekonsiliasi final.
