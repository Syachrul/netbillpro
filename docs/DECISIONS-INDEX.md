# Canonical Decisions Index

**Status:** Navigation layer (Phase B implementation D-100, 2026-11-17)
**Purpose:** Navigation aid for `docs/decisions.log`.

**IMPORTANT:** This index is a **navigation layer**. It is NOT a replacement
for `docs/decisions.log` (source of truth, append-only, authoritative).
This file does NOT modify `decisions.log` content.

**Checker:** `node tools/check-decisions-log.mjs docs/decisions.log`
**Checker v2 snapshot (last verified 2026-11-17, HEAD f56ec61):**
entri: 28 (baris tabel 14, blok 14)
markers: VOID=2, DUP=2, ABBREV-DUP=1, SUPERSEDED=1
corrections: DLR-02=true, DLR-06=true
mappings: 7 entries, 2 canonical
bersih

text

## 1. Canonical Decision IDs (in-force)

| Decision ID | Subject | Status | Supersedes | Cross-ref |
| :--- | :--- | :--- | :--- | :--- |
| `DEC-2026-11-15-BILLING-001` | Billing Statement Review (base) | APPROVED | none | DLR-02, DLR-04 |
| `DEC-2026-11-15-C5-001` | C5.0 Open Questions | APPROVED (schema claim VOID per DLR-06) | none | DLR-06 |
| `DEC-2026-11-15-BILLINGC5-001` | Billing/C5 Roadmap Enrichment | APPROVED | none | BILLING-001, C5-001, ADR-08 |
| `DEC-2026-11-16-SECURITY-001` | recordedBy JWT fix | CLOSED | none | commit c06c40e |
| `DEC-2026-11-16-SECURITY-002` | DTO Validation Gap | RECORDED | none | — |
| `DEC-2026-11-16-SECURITY-003` | JWT_SECRET Fallback | RECORDED | none | — |
| `DEC-2026-11-16-GOVERNANCE-001` | C3 Governance Conflict | RECORDED | none | DLR-02, C3-RATIFY-001 |
| `DEC-2026-11-16-C3-RATIFY-001` | C3 Ratification (QUALIFIED) | RATIFIED | DLR-02 VOID | ADR-0004 v2, ADR-0014 v2 |
| `DEC-2026-11-17-RATIFY-001-ADDENDUM` | RATIFY-001 Count Correction | RECORDED | none (addendum) | C3-RATIFY-001, F-9 |

**Note on terminology:**
- "Canonical decision" = decision with formal `DEC-*` ID superseding/mapping historical blocks
- "Recorded decision" = decision logged as backlog/finding without canonical supersession scope
- "Checker mapping" = specific ADDENDUM ID mappings (DLR-02, DLR-06, etc.)

## 2. Duplicate / VOID / SUPERSEDED entries (audit history preserved)

**None removed.** Index maps them to canonical reference.

| Log location | Type | Refers to canonical | Marker |
| :--- | :--- | :--- | :--- |
| Line ~58 | DUPLICATE | `DEC-2026-11-15-BILLING-001` | `<!-- DUPLICATE -->` |
| Line ~86-97 (C5.0 first dup) | DUPLICATE | `DEC-2026-11-15-C5-001` | `<!-- DUPLICATE -->` |
| Line ~106 (C5.0 abbrev) | ABBREV-DUP | `DEC-2026-11-15-C5-001` | `<!-- ABBREV-DUP -->` |
| Line ~52-57 (C3 AUTH) | VOID | `DEC-2026-11-16-C3-RATIFY-001` | `<!-- VOID -->` + `[CORRECTION]` |
| Line ~86-97 (C5.0 schema claim) | VOID | `DEC-2026-11-15-C5-001` | `<!-- VOID -->` + `[CORRECTION]` |

**Reconciliation with checker v2:**
- Total entries: 28 (14 table rows + 14 blocks)
- Markers: VOID=2, DUP=2, ABBREV-DUP=1, SUPERSEDED=1
- Corrections: DLR-02, DLR-06
- Mappings: 7 entries, 2 canonical

**Checker "mappings: 7 entries, 2 canonical"** refers to specific ADDENDUM
ID mappings (DLR-02, DLR-06), not all decision entries.

## 3. Correction markers (from checker)

- `[CORRECTION YYYY-MM-DD]` — formal correction record
- `<!-- DUPLICATE — ... -->` — inline duplicate marker
- `<!-- ABBREV-DUP — ... -->` — abbreviated duplicate
- `<!-- SUPERSEDED by ... -->` — supersession
- `<!-- VOID — ... -->` — void block

## 4. Reading guide

1. Look for `DEC-*` ID in §1 first
2. If found in §2 only → see canonical reference
3. If in both → check supersession status
4. If in neither → entry not yet indexed (report to Owner)

## 5. Update protocol

When adding a decision:
1. Append block to `docs/decisions.log` per format
2. Run checker: `node tools/check-decisions-log.mjs docs/decisions.log`
3. Update §1 (if canonical) or §2 (if duplicate/VOID/SUPERSEDED)
4. Update checker snapshot at top of this index
5. Verify all counts consistent

## 6. Non-canonical informational entries

- `[2026-11-13] D-1` s.d. `D-6` — SPEC-LEDGER default decisions (informational, no `DEC-*` ID)

## Reference

- `docs/decisions.log` — **SOURCE OF TRUTH** (append-only, authoritative)
- `tools/check-decisions-log.mjs` — structural checker
- `docs/adr/ADR-Register.md` — ADR-specific status
- `DEC-2026-11-16-GOVERNANCE-001` — C3 conflict trail

---

*Navigation layer only (D-100 implementation). Does NOT modify or replace
`docs/decisions.log`. Append-only, non-authoritative.*
