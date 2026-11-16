# docs/ — Navigation Index

**Generated:** 2026-11-16 (manual). Refresh when docs evolve.
**Purpose:** Navigation index untuk 40+ dokumen di `docs/`. Setiap link menuju canonical atau historical record sesuai statusnya.

> **Cara pakai.** Mulai dari §A (Canonical entry points). Bila mencari spesifik, lompat ke kategori. Bila ada konflik antar-dokumen, `docs/decisions.log` yang berlaku.

---

## A. Canonical entry points

| Dokumen | Fungsi | Status |
| :--- | :--- | :--- |
| [`STATE.md`](STATE.md) | Status proyek saat ini | ⚠️ Stale (lihat `DEC-2026-11-16-GOVERNANCE-001` untuk C3 conflict) |
| [`decisions.log`](decisions.log) | Log keputusan Owner (append-only, canonical) | ✅ Canonical |
| [`glossary.md`](glossary.md) | Istilah baku proyek | ✅ Aktif |
| [`do-not-do.md`](do-not-do.md) | Larangan + penegak | ✅ Aktif |
| [`artifact-register.md`](artifact-register.md) | Register artefak kerja | 🟡 DRAFT |
| [`governance-alignment.md`](governance-alignment.md) | Alignment tata kelola | 🟡 DRAFT |

**Checker:** `node tools/check-decisions-log.mjs docs/decisions.log`

---

## B. Specs (functional specifications)

| Spec | Coverage | Status |
| :--- | :--- | :--- |
| [`specs/SPEC-LEDGER-001_v1_1.md`](specs/SPEC-LEDGER-001_v1_1.md) | Ledger, alokasi, void, refund | ✅ v1.1 |
| [`specs/SPEC-PKG-SUB-001_v1.0.md`](specs/SPEC-PKG-SUB-001_v1.0.md) | Packages, subscriptions, prorata, snapshot | 🟡 v1.1 (markers, DRAFT) |
| [`specs/SPEC-BILLING-001_v1.0.md`](specs/SPEC-BILLING-001_v1.0.md) | Invoice generation, arrears, statement | 🟡 v1.0 skeleton |
| [`specs/SPEC-INVOICE-DOCS-001_v1.0.md`](specs/SPEC-INVOICE-DOCS-001_v1.0.md) | PDF, secure link, immutable snapshot | 🟡 v1.0 skeleton |
| [`specs/TEMPLATE.md`](specs/TEMPLATE.md) | Template spec (13 sections) | ✅ Reference |

**Pattern spec:** ikuti `TEMPLATE.md` + mature example `SPEC-LEDGER-001`. Vectors (kunci jawaban berangka) = wajib untuk spec merah.

---

## C. ADRs (Architecture Decision Records)

**Register:** [`adr/ADR-Register.md`](adr/ADR-Register.md) — status semua ADR.

**Accepted (Diterima):** ADR-0001, 0002, 0003, 0006, 0007, 0009, 0010, 0012, 0019, 0020, 0021, 0022
**Proposed (Diusulkan):** ADR-0004, 0005, 0008, 0011, 0013, 0014, 0015, 0016, 0017, 0018
**Gerbang acceptance sebelum C3:** ADR-03, 04, 09, 14, 19, 22 (04 & 14 masih Diusulkan)
**Gerbang acceptance sebelum S5:** ADR-05, 08, 13, 16

Total: 22 ADR (`docs/adr/ADR-0001.md` .. `ADR-0022.md`). Next slot: `ADR-0023`.

---

## D. PRD, TDD, Proposals

| Dokumen | Fungsi |
| :--- | :--- |
| [`prd/PRD-RTRW-2026-001.md`](prd/PRD-RTRW-2026-001.md) | Product Requirements Document |
| [`tdd/TDD-RTRW-2026-001_v1.1.md`](tdd/TDD-RTRW-2026-001_v1.1.md) | Technical Design Document |
| [`tdd/TDD-Amendment-Notes.md`](tdd/TDD-Amendment-Notes.md) | Amendment notes ke TDD |
| [`proposals/DEV-RTRW-2026-001 v1.0.md`](proposals/DEV-RTRW-2026-001%20v1.0.md) | Proposal retention |
| [`DEV-RTRW-2026-001_v1.0_Playbook.md`](DEV-RTRW-2026-001_v1.0_Playbook.md) | Development playbook |
| [`DEV-RTRW-2026-001_AI-Playbook-Amendment-Notes.md`](DEV-RTRW-2026-001_AI-Playbook-Amendment-Notes.md) | Playbook amendments (v1.0 → v1.1) |

---

## E. Traceability & test plans

| Dokumen | Fungsi |
| :--- | :--- |
| [`traceability-matrix.md`](traceability-matrix.md) | FR → kode → tes matrix |
| [`test-plan/ledger-scenarios.md`](test-plan/ledger-scenarios.md) | Skenario uji ledger |

---

## F. Reviews

| Dokumen | Fungsi |
| :--- | :--- |
| [`reviews/REVIEW-REPORT-1.md`](reviews/REVIEW-REPORT-1.md) | Review 1 |
| [`reviews/REVIEW-REPORT-2.md`](reviews/REVIEW-REPORT-2.md) | Review 2 |

---

## G. Archive (`docs/_archive/`)

Preserved historical artifacts (rollback path, pre-modification backups, evidence trails). **Not for active reference.** Nama folder = tanggal + stream ID.

| Folder | Stream | Content |
| :--- | :--- | :--- |
| `_archive/2026-11-15-recon-02/` | RECON-02 | decisions.log reconciliation (commit `887d4f8`) |
| `_archive/2026-11-16-b-2/` | B-2 | payments-api auth flow fix (commit `1df5857`) |
| `_archive/2026-11-16-b-2-batch2/` | Batch 2 | Billing/C5 enrichment (commit `a007b1c`) |
| `_archive/2026-11-16-security-10/` | SEC-10 | recordedBy JWT fix (commit `c06c40e`) |
| `_archive/2026-11-16-c50-readiness/` | C5.0 Phase R-S-V | Readiness + spec cleanup + governance record |

Archive policy: **never delete**. Evidence preserved for audit.

---

## H. Governance references

- **Checker:** `tools/check-decisions-log.mjs` — verify decisions.log structure
- **Format spec:** lihat `decisions.log` bagian `ADDENDUM FORMAT v2` (ID mapping, marker rules)
- **Correction markers:** `[CORRECTION YYYY-MM-DD]`, `<!-- DUPLICATE -->`, `<!-- SUPERSEDED by ... -->`
- **Status formal:** `DEFAULT | APPROVED | SUPERSEDED | QUALIFIED | RATIFIED | VOID`

**Canonical decision IDs (per RECON-02):**
- `DEC-2026-11-15-BILLING-001` (canonical billing base)
- `DEC-2026-11-15-C5-001` (canonical C5.0 OQ)
- `DEC-2026-11-15-BILLINGC5-001` (enrichment)
- `DEC-2026-11-16-SECURITY-001`, `-002`, `-003`
- `DEC-2026-11-16-GOVERNANCE-001` (C3 conflict recorded, pending Owner A/B/C)

---

## I. Status legend

| Emoji | Meaning |
| :---: | :--- |
| ✅ | Canonical / aktif / accepted |
| 🟡 | DRAFT / proposed / markers pending |
| 🔴 | HOLD / not authorized / blocked |
| ⚠️ | Stale (see decisions.log for current state) |

---

## J. Known gaps / open items

- `docs/README.md` — **this file** (resolved 2026-11-16)
- ADR-08 (pdfmake), ADR-13 (S3) — **proposed**, acceptance pending Owner
- C3 governance conflict — **recorded** as `DEC-2026-11-16-GOVERNANCE-001`, Owner decision pending (Option A/B/C)
- SPEC-BILLING-001 / SPEC-INVOICE-DOCS-001 v1.1 — reference vectors gated on implementation stability
- F-3 (DTO validation), F-9 (JWT_SECRET fallback) — backlog recorded (`DEC-...-SECURITY-002/003`), implementation gated

---

*End of index. Refresh manually when docs change. Not auto-generated.*
