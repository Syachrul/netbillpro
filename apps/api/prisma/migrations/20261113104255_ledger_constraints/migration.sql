-- ============================================================
-- Ledger constraints, triggers, extensions
-- Tahap C1-3c: SQL manual untuk constraint yang tidak bisa
-- di-express Prisma schema.
-- Sumber: SPEC-LEDGER-001 (BR-L1, BR-L4, BR-I3, BR-A6, E-3, E-5)
-- ============================================================

-- ===== 1. EXTENSIONS =====
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ===== 2. CHECK CONSTRAINTS: invoices (E-5, BR-I3) =====
ALTER TABLE "invoices" ADD CONSTRAINT ck_invoice_total_pos CHECK (total > 0);
ALTER TABLE "invoices" ADD CONSTRAINT ck_invoice_allocated_range CHECK (allocated >= 0 AND allocated <= total);

-- ===== 3. CHECK CONSTRAINTS: payments (BR-P1) =====
ALTER TABLE "payments" ADD CONSTRAINT ck_payment_amount_pos CHECK (amount > 0);

-- ===== 4. CHECK CONSTRAINTS: ledger_entries (BR-L1) =====
ALTER TABLE "ledger_entries" ADD CONSTRAINT ck_ledger_debit_nonneg CHECK (debit >= 0);
ALTER TABLE "ledger_entries" ADD CONSTRAINT ck_ledger_kredit_nonneg CHECK (kredit >= 0);
ALTER TABLE "ledger_entries" ADD CONSTRAINT ck_ledger_debit_xor_kredit CHECK ((debit = 0) <> (kredit = 0));

-- ===== 5. CHECK CONSTRAINTS: payment_allocations (E-3, BR-A6) =====
ALTER TABLE "payment_allocations" ADD CONSTRAINT ck_alloc_amount_nonzero CHECK (amount <> 0);
ALTER TABLE "payment_allocations" ADD CONSTRAINT ck_alloc_target_exactly_one CHECK ((invoice_id IS NULL) <> (refund_ledger_id IS NULL));

-- ===== 6. PARTIAL UNIQUE INDEX: invoices (BR-I3) =====
CREATE UNIQUE INDEX uq_invoice_monthly
  ON "invoices" (customer_id, period)
  WHERE type = ('BULANAN'::invoice_type) AND status <> ('BATAL'::invoice_status);

-- ===== 7. TRIGGER: ledger_entries append-only (BR-L4) =====
CREATE OR REPLACE FUNCTION forbid_mutation() RETURNS trigger AS $func$
BEGIN
  RAISE EXCEPTION '% bersifat append-only', TG_TABLE_NAME;
END;
$func$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ledger_immutable ON "ledger_entries";
CREATE TRIGGER trg_ledger_immutable
  BEFORE UPDATE OR DELETE ON "ledger_entries"
  FOR EACH ROW EXECUTE FUNCTION forbid_mutation();

-- ===== 8. TRIGGER: payment_allocations append-only (BR-L4) =====
DROP TRIGGER IF EXISTS trg_alloc_immutable ON "payment_allocations";
CREATE TRIGGER trg_alloc_immutable
  BEFORE UPDATE OR DELETE ON "payment_allocations"
  FOR EACH ROW EXECUTE FUNCTION forbid_mutation();
