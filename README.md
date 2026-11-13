# NetBill Pro — RT/RW Net Management & Billing System

Sistem manajemen operasional, billing, dan portal pelanggan untuk usaha RT/RW Net.
Web (Admin/Portal) + Mobile (Client/Kolektor), backend modular monolith.

## Status

**Fase:** Sprint 0 / Harness (belum menulis kode fitur)
Lihat `docs/STATE.md` untuk status terkini.

## Peta Dokumen

| Dokumen | Lokasi | Fungsi |
|---|---|---|
| PRD v1.1 | `docs/PRD-RTRW-2026-001_v1.1.md` | Aturan bisnis, RBAC, ledger S1-S8, NFR, AC |
| TDD v1.1 | `docs/NetBill-Pro_Master-Roadmap-Architecture_v1.0.md` | Arsitektur, skema DB, algoritma, roadmap |
| Playbook v1.0 | `docs/NetBill-Pro_AI-Assisted-Development-Playbook_v1.0.md` | Aturan pengembangan berbantuan AI |
| SPEC-LEDGER-001 v1.0 | `docs/SPEC-LEDGER-001_Ledger-Alokasi-Void_v1.0.md` | Aturan kanonik ledger & vektor uji |
| Keputusan | `docs/decisions.log` | Log keputusan Owner/teknis |
| Status proyek | `docs/STATE.md` | Status terkini untuk handover sesi |
| Larangan | `docs/do-not-do.md` | Daftar hal yang tidak boleh dilakukan |
| Glosarium | `docs/glossary.md` | Istilah domain |
| Aturan AI | `CLAUDE.md` | Aturan keras untuk agen AI |

## Hierarki Sumber Kebenaran

Keputusan Owner (decisions.log) > PRD > TDD/ADR > Spec > Kontrak > Tes > Kode.
Bila bertentangan, yang lebih tinggi menang. Kode yang bertentangan = bug.

## Prinsip Inti

1. **Dokumen adalah niat, tes adalah penegak.**
2. **Tes dulu, kode kemudian.**
3. **Potongan kecil, terverifikasi.**
4. **Zona risiko menentukan pengawasan** (Merah/Kuning/Hijau).
5. **Konteks ditulis, bukan diingat.**

## Zona Risiko

- **Merah:** ledger, alokasi, billing, payments, auth, RBAC, secret, migrasi DB.
- **Kuning:** CRUD pelanggan/paket, laporan, notifikasi, impor, PDF.
- **Hijau:** UI presentasi, dokumentasi, skrip bantu.

Baca `CLAUDE.md` sebelum menulis kode.
