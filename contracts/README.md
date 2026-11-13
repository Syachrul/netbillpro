# Kontrak API & Event

Kontrak adalah sumber kebenaran untuk komunikasi klien-server dan batas antar modul.
Perubahan pada folder ini harus lewat PR dan mendapat persetujuan pemilik (lihat CODEOWNERS).

## openapi.yaml

Draf OpenAPI 3.1. Dibangun bertahap per sprint:

- Sekarang (B4): hanya `/api/v1/health`.
- S1: auth, RBAC.
- S3-S4: ledger, billing, payments (mengikuti SPEC-LEDGER-001 bagian 7).
- S5: invoice, notifikasi.

Perubahan pada kontrak harus:

1. Dicatat di `docs/decisions.log` bila mengubah perilaku.
2. Diuji kompatibilitasnya (kontrak vs implementasi) saat CI siap.
3. Diberi versi (`/api/v2`) bila breaking.

## events/

Skema domain event berversi (TDD bagian 25.4). Format: JSON Schema.
Contoh:

- `invoice.issued.v1.schema.json`
- `payment.posted.v1.schema.json`

Diterbitkan oleh modul penerbit lewat outbox (dalam transaksi),
dikonsumsi oleh subscribers (idempoten).
