# SPEC-INVOICE-DOCS-001: Invoice Documents — PDF, Secure Link, Immutable Snapshot

**Zona risiko:** 🔴 Merah | **Prioritas:** P0 | **Modul:** `invoice-docs`
**Fase:** C5.0 documentary (per `DEC-2026-11-15-BILLINGC5-001` item #6, #9)
**Sumber:** PRD v1.2 §5.4, TDD v1.1 §7.3, `SPEC-BILLING-001 v1.0`, `SPEC-LEDGER-001 v1.1`, `ADR-0008`, decisions.log (`DEC-2026-11-15-BILLING-001`, `DEC-2026-11-15-BILLINGC5-001`)
**Status:** v1.0 DRAFT (skeleton) — reference vectors deferred to v1.1

| Atribut | Detail |
| :--- | :--- |
| **ID Dokumen** | SPEC-INVOICE-DOCS-001 |
| **Versi** | 1.0 DRAFT (skeleton): struktur + business rules; reference vectors v1.1 |
| **Tanggal** | 2026-11-16 |
| **Mencakup** | FR-INV-DOC-01..FR-INV-DOC-06 (PDF generation, secure link, snapshot immutability) |
| **Fungsi dokumen** | Functional spec modul `invoice-docs`; kunci jawaban untuk tes document rendering + link security |
| **Referensi wajib** | `DEC-2026-11-15-BILLINGC5-001` (items #6, #9), `DEC-2026-11-15-BILLING-001`, `SPEC-BILLING-001 v1.0`, `SPEC-LEDGER-001 v1.1`, `ADR-0008` (proposed) |

---

## 0. Erratum

None (file baru).

---

## 1. Tujuan

Mendefinisikan aturan bisnis, kontrak layanan internal, dan invarian untuk modul `invoice-docs` — lapisan yang mengubah **snapshot invoice/statement** menjadi PDF immutable dan menyediakan **secure link** (bearer-token, TTL, revocable) untuk distribusi ke pelanggan. Modul ini **tidak** menghitung billing; ia hanya me-render.

---

## 2. Peran & Otorisasi

| Operasi | Owner | Admin | Kolektor | Client | Public (token) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Trigger generate PDF (internal) | ✔ | ✔ | ✖ | ✖ | ✖ |
| Issue secure link untuk invoice | ✔ | ✔ | ✖ | ✖ | ✖ |
| Revoke secure link | ✔ | ✔ | ✖ | ✖ | ✖ |
| View PDF via secure link | - | - | - | - | ✔ (valid token) |
| View own invoice (auth) | - | - | - | ✔ (hanya miliknya) | ✖ |

Public token = single-purpose, single-invoice, TTL-bounded. Tidak ada listing.

---

## 3. Aturan Bisnis (Dapat Diuji)

### 3.1 PDF Generation

- **BR-INV-1.** PDF di-render dari **snapshot** invoice/statement (immutable). Bukan dari state live.
- **BR-INV-2.** Snapshot wajib memuat: customer (nama, alamat, `customers.code`, username hotspot), period, invoice number, items, total, due_date, isolation_date, arrear statement (jika ada), watermark "SNAPSHOT".
- **BR-INV-3.** PDF binary disimpan di object storage (S3-compatible per `ADR-0013` proposed) dengan key = `invoice-docs/{customerId}/{invoiceId}/{snapshotHash}.pdf`.
- **BR-INV-4.** Rendering menggunakan **pdfmake** (per `ADR-0008`, status proposed — implementation gate).
- **BR-INV-5.** Re-render diizinkan **hanya** jika PDF binary hilang/rusak; **wajib** dari snapshot yang sama → byte-identical atau error (fail loud, bukan regenerate dari state baru).

### 3.2 Secure Link

- **BR-INV-6.** Secure link = URL ber-token acak (≥128-bit entropy), memiliki `invoiceId`, TTL default **7 hari**, dapat dicabut lebih awal.
- **BR-INV-7.** Setiap access wajib mencatat audit: timestamp, IP, UA, token hash. Rate-limited (max N access/jam per token — default 30).
- **BR-INV-8.** Token tidak dapat ditebak (crypto random), disimpan di DB sebagai hash, tidak logged plaintext.

### 3.3 Immutability

- **BR-INV-9.** Setelah invoice issued, snapshot **tidak berubah**. Tidak ada endpoint edit PDF.
- **BR-INV-10.** Void invoice **tidak** menghapus PDF; menambahkan watermark "VOID" pada view (bukan pada binary — binary tetap snapshot saat issue; representasi view yang di-overlay).

---

## 4. Kontrak Layanan Internal (Modul `invoice-docs`)

Metode publik:

- `renderInvoicePdf(invoiceId)` — render dari snapshot; store to object storage; return key + hash.
- `createSecureLink(invoiceId, ttl?)` — generate token, store hash, return URL.
- `revokeSecureLink(tokenId)` — set revoked_at.
- `getSecureLinkPdf(token)` — validate, audit log, return stream.

**Larangan:** Modul ini tidak menghitung billing, tidak menulis ledger, tidak mengubah snapshot. Snapshot boundary = read-only.

---

## 5. Data & Snapshot

### 5.1 Tabel yang disentuh

- `invoice_documents` (create — key, hash, generated_at) — tabel baru
- `invoice_secure_links` (create/revoke — token hash, ttl, revoked_at) — tabel baru
- `invoice_secure_link_accesses` (create — audit) — tabel baru
- `invoices` (read — snapshot) — tidak ditulis
- Object storage (write PDF binary)

### 5.2 Snapshot dependency

Membaca snapshot per `SPEC-LEDGER-001 v1.1` (invoice snapshot structure) dan `SPEC-PKG-SUB-001 v1.1` (§5). Modul ini konsumsi; tidak mendefinisikan snapshot.

### 5.3 Object storage

Per `ADR-0013` (S3-compatible, status proposed). Implementasi butuh ADR-0013 accept.

---

## 6. Invarian

- **INV-INV-1.** PDF binary untuk `(invoiceId, snapshotHash)` = deterministik. Render ulang = byte-identical, atau error.
- **INV-INV-2.** Secure link token = single-invoice. Tidak dapat di-share untuk invoice lain (token-to-invoice binding).
- **INV-INV-3.** Semua akses ke secure link tercatat di `invoice_secure_link_accesses`. Zero accesses = missing audit = fail.
- **INV-INV-4.** Revoked link → semua future access = 410 Gone (bukan 404 untuk preserve revocation state).

---

## 7. Alur & Kasus Tepi

### 7.1 Alur Utama (generate + distribute)

1. Billing panggil `generateStatement(customerId, period)` (`SPEC-BILLING-001` §4).
2. Billing delegate ke `renderInvoicePdf(invoiceId)`.
3. Modul render dari snapshot → PDF → store → return key.
4. Admin/Owner trigger `createSecureLink(invoiceId)` → URL.
5. Distribusi URL (WhatsApp, email — delivery = S5, out of scope).
6. Client buka URL → modul validate token → stream PDF → audit log.

### 7.2 Kasus Tepi

- **Expired link:** 410 Gone dengan pesan "link expired, minta link baru".
- **Revoked link:** 410 Gone. Distinction via audit (revoked_at set).
- **Invalid token:** 404 (anti-enumeration).
- **Regenerate:** endpoint admin baru yang set `revoked_at` + issue new link.
- **Concurrency:** token issue idempoten per (invoiceId, ttl) minute (rate-limited).
- **Storage failure:** render retry exponential backoff; final fail = alert to Owner, invoice tetap valid (PDF view 503, not data corruption).

---

## 8. Reference Vectors

**Status: SKELETON v1.0** — full vectors diisi di v1.1. Format contoh:

| # | Kondisi awal | Aksi | Hasil yang diharapkan |
| :--- | :--- | :--- | :--- |
| TV-INV-01 | Invoice issued, snapshot ada | `renderInvoicePdf(invoiceId)` | PDF created, hash H1 stored; re-render = H1 identical |
| TV-INV-02 | Secure link issued TTL 7d | access day 1 | 200, PDF streamed, audit row |
| TV-INV-03 | Link TTL expired | access after 7d | 410 Gone, audit row |
| (full suite v1.1) | ... | ... | ... |

**Note v1.1 requirement:** ≥8 vectors covering PDF immutability, secure link lifecycle, revocation, rate-limit, storage failure recovery.

---

## 9. Acceptance Criteria (Given/When/Then)

- **AC-INV-1.** Given invoice issued, When PDF rendered, Then byte-hash stable across re-renders.
- **AC-INV-2.** Given secure link issued, When accessed before TTL, Then PDF streamed + audit row created.
- **AC-INV-3.** Given secure link revoked, When accessed after revocation, Then 410 Gone + audit row with `revoked_reason`.
- **AC-INV-4.** Given invalid token, When accessed, Then 404 (anti-enumeration).
- **AC-INV-5.** Given void invoice, When PDF viewed, Then watermark "VOID" visible; binary snapshot unchanged.

---

## 10. Tes yang Wajib Ada

- **Unit:** token generation (entropy ≥128-bit), hash storage/verify, TTL boundary.
- **Integrasi:** `renderInvoicePdf` + object storage + hash verify; `createSecureLink` + `getSecureLinkPdf` end-to-end.
- **Security:** token enumeration resistance (rate-limit), audit completeness.
- **Immutability:** re-render = byte-identical.
- **Void:** overlay watermark, binary unchanged.

---

## 11. UI (jika ada)

- **Customer-facing PDF viewer:** minimal HTML wrapper, no PDF JS execution from public context (XSS surface). Link = direct PDF stream.
- **Admin panel:** link generation, TTL selector, revoke button, access log viewer.

UI detail di spec terpisah saat fase implementasi UI.

---

## 12. Di Luar Lingkup (Eksplisit)

- **Billing calculation** (invoice total, prorata, arrears) → `SPEC-BILLING-001 v1.0`
- **Delivery/notification** (WhatsApp, email, SMS) → S5
- **ADR-0008 acceptance** (pdfmake) — proposed, impl-gated
- **ADR-0013 acceptance** (S3-compatible object storage) — proposed, impl-gated
- **Multi-format output** (PDF only in Phase 1; HTML/CSV = future)
- **C5.0 schema implementation** (governance per `DLR-06`)

---

## 13. Pertanyaan Terbuka

| # | Pertanyaan | Status |
| :--- | :--- | :--- |
| OQ-H | Default TTL secure link = 7 hari? Atau 30 (seperti invoice aging)? | Default 7; confirm Owner |
| OQ-I | Rate limit access = 30/jam? Atau lebih longgar (e.g., 100/jam)? | Default 30; confirm Owner |
| OQ-J | Token format = opaque random string, atau JWT? | Default opaque (simpler revocation); confirm Owner |
| OQ-K | Watermark "VOID" = overlay viewer atau bake into regenerated binary? | Default overlay (binary immutability preserved); confirm Owner |

---

*Skeleton draft v1.0. Reference vectors (§8) diisi di v1.1 setelah implementasi stabil. Implementasi butuh otorisasi terpisah per governance (DLR-06, DEC-2026-11-15-BILLINGC5-001, ADR-0008 accept, ADR-0013 accept).*
