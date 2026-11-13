# AGENTS.md

Berkas ini untuk alat AI selain Claude Code (Cursor, Aider, dll).

**Sumber aturan tunggal: `CLAUDE.md`.** Baca berkas itu lebih dulu.
Bila alat Anda tidak membaca `CLAUDE.md` otomatis, salin isinya atau buat tautan.

## Ringkas aturan yang paling sering dilanggar
- Uang = integer rupiah; dilarang float.
- Ledger append-only; hanya modul `ledger` yang menulis; koreksi via reversal.
- Pembayaran wajib Idempotency-Key; satu fungsi `reallocate`.
- Otorisasi peran + kepemilikan data di API.
- Tes dulu, kode kemudian; jangan ubah tes tanpa izin.
- Berhenti dan tanya bila dokumen ambigu.

## Alur kerja
Ikuti Playbook Bagian 5 (`docs/NetBill-Pro_AI-Assisted-Development-Playbook_v1.0.md`):
Rencana -> persetujuan -> tes (gagal) -> implementasi (lulus) -> CI -> review -> PR kecil.
