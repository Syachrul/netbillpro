# SECURITY-REGISTER.md — Consolidated Security Findings

**Version:** 1.0 (2026-11-17, Phase B implementation D-100)
**Purpose:** Consolidated security findings dengan status, evidence reference, dan remediation gate.
**Evidence:** Phase A + A-2 verification, `decisions.log`, `docs/_archive/`

## 1. Closed findings

### SEC-001 — `recordedBy` from body → spoofable audit trail

| Aspek | Detail |
| :--- | :--- |
| **Status** | ✅ **CLOSED** (verified independently 2026-11-17) |
| **Severity** | HIGH (audit trail contamination) |
| **Fixed in** | Commit `c06c40e` (2026-11-16) |
| **Fix** | `recordedBy` from `req.user.sub` (JWT subject) |
| **Defense test** | `payments-api.test.ts:158` (spoof-defense) |
| **Verification** | 5-way check passed |
| **Decision ref** | `DEC-2026-11-16-SECURITY-001` |

## 2. Recorded — remediation pending authorization

### SEC-002 — No DTO validation on payments payload

| Aspek | Detail |
| :--- | :--- |
| **Status** | 🟡 RECORDED — remediation HOLD |
| **Severity** | MEDIUM (malformed payload) |
| **Current** | `@Body() body: any` in `payments.controller.ts` |
| **Recommended** | `CreatePaymentDto` + `class-validator` |
| **Blocker** | Owner auth + validation ADR |
| **Decision ref** | `DEC-2026-11-16-SECURITY-002` |

### SEC-003 — Hardcoded JWT_SECRET fallback

| Aspek | Detail |
| :--- | :--- |
| **Status** | 🟡 RECORDED — remediation HOLD |
| **Severity** | HIGH (auth bypass if env not set) |
| **Current** | `JWT_SECRET = process.env.JWT_SECRET ?? "netbill-dev-secret-change-in-prod"` |
| **Recommended** | Fail-fast in non-dev env |
| **Blocker** | Owner auth + deployment review |
| **Decision ref** | `DEC-2026-11-16-SECURITY-003` |

## 3. Deferred findings (schema-blocked)

### F-B1-4-1 — `Payment.voidReason` column missing

- **Status:** 🔴 DEFERRED (schema change required)
- **Fix required:** Schema: add `Payment.voidReason` column
- **Blocker:** DLR-06 (schema NOT AUTHORIZED)
- **Reference:** `DEC-C3-RATIFY-001` deferred list

### F-Z-6 — `nextInvoiceNumber` counter missing

- **Status:** 🔴 DEFERRED (schema change required)
- **Fix required:** Schema: `invoice_number_sequences` table
- **Blocker:** DLR-06
- **Reference:** `DEC-C3-RATIFY-001`

### F-Z-7 — Outbox event publishing missing

- **Status:** 🔴 DEFERRED (schema + ADR-05 required)
- **Fix required:** Schema: `outbox` table + ADR-05 accept + event publishing
- **Blocker:** DLR-06 + ADR-05
- **Reference:** `DEC-C3-RATIFY-001`

### F-B1-1a-2 — `checkInvariants` incomplete (I-3..I-8)

- **Status:** 🔴 DEFERRED
- **Fix required:** Implementation-only (add I-3..I-8 checks per SPEC-LEDGER §6)
- **Blocker:** **Explicit Owner authorization for separate C3 follow-up work** (F-B-03 correction)
- **Important:** Ratification (RATIFIED QUALIFIED) ≠ blanket C3 follow-up authorization
- **Reference:** `DEC-C3-RATIFY-001`

## 4. Ratification discrepancy (F-9)

| Aspek | Detail |
| :--- | :--- |
| **Status** | ✅ **CORRECTED** via `DEC-2026-11-17-RATIFY-001-ADDENDUM` (commit `f56ec61`) |
| **Detail** | Original "19 errors" → corrected to: 22 output lines / 8 codes / 22 unique / 0 duplicates / 17 underlying if paired |
| **Evidence** | `docs/_archive/2026-11-17-typecheck-evidence/` (5 files) |
| **Verification** | Phase F-1 evidence capture (typecheck-full.txt + parsed) |

## 5. Authorization gate summary

| Finding | Authorized? | Prerequisite |
| :--- | :--- | :--- |
| SEC-001 | ✅ Done | — |
| SEC-002 | 🔴 HOLD | Owner auth + validation ADR |
| SEC-003 | 🔴 HOLD | Owner auth + deployment review |
| F-B1-4-1 | 🔴 HOLD | DLR-06 lift |
| F-Z-6 | 🔴 HOLD | DLR-06 lift |
| F-Z-7 | 🔴 HOLD | DLR-06 lift + ADR-05 |
| F-B1-1a-2 | 🔴 HOLD | Explicit C3 follow-up auth |
| F-9 | ✅ Corrected | B-3 addendum (`f56ec61`) |

---

*Consolidated per Phase B implementation D-100. Status remediation butuh Owner authorization eksplisit.*
