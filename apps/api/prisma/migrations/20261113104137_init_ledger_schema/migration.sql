-- CreateEnum
CREATE TYPE "customer_status" AS ENUM ('AKTIF', 'ISOLIR', 'BERHENTI');

-- CreateEnum
CREATE TYPE "invoice_type" AS ENUM ('BULANAN', 'MANUAL', 'SALDO_AWAL');

-- CreateEnum
CREATE TYPE "invoice_status" AS ENUM ('BELUM_LUNAS', 'DIBAYAR_SEBAGIAN', 'LUNAS', 'BATAL');

-- CreateEnum
CREATE TYPE "ledger_type" AS ENUM ('SALDO_AWAL', 'TAGIHAN', 'PEMBAYARAN', 'PENYESUAIAN_DEBIT', 'PENYESUAIAN_KREDIT', 'REVERSAL', 'REFUND_DEPOSIT');

-- CreateEnum
CREATE TYPE "pay_method" AS ENUM ('TUNAI', 'TRANSFER_BANK', 'E_WALLET');

-- CreateTable
CREATE TABLE "customers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT NOT NULL,
    "status" "customer_status" NOT NULL DEFAULT 'AKTIF',
    "activated_at" DATE,
    "due_day" SMALLINT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "number" TEXT NOT NULL,
    "customer_id" UUID NOT NULL,
    "type" "invoice_type" NOT NULL DEFAULT 'BULANAN',
    "period" CHAR(7),
    "issued_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "due_date" DATE NOT NULL,
    "total" BIGINT NOT NULL,
    "allocated" BIGINT NOT NULL DEFAULT 0,
    "status" "invoice_status" NOT NULL DEFAULT 'BELUM_LUNAS',
    "snapshot" JSONB NOT NULL,
    "voided_at" TIMESTAMPTZ(6),
    "void_reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "invoice_id" UUID NOT NULL,
    "kind" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,

    CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "customer_id" UUID NOT NULL,
    "amount" BIGINT NOT NULL,
    "method" "pay_method" NOT NULL,
    "paid_at" DATE NOT NULL,
    "note" TEXT,
    "proof_key" TEXT,
    "recorded_by" UUID NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "voided_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ledger_entries" (
    "seq" BIGSERIAL NOT NULL,
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "customer_id" UUID NOT NULL,
    "type" "ledger_type" NOT NULL,
    "debit" BIGINT NOT NULL DEFAULT 0,
    "kredit" BIGINT NOT NULL DEFAULT 0,
    "balance_after" BIGINT NOT NULL,
    "ref_type" TEXT,
    "ref_id" UUID,
    "description" TEXT,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ledger_entries_pkey" PRIMARY KEY ("seq")
);

-- CreateTable
CREATE TABLE "ledger_reversals" (
    "original_ledger_id" UUID NOT NULL,
    "reversal_ledger_id" UUID NOT NULL,
    "reason" TEXT NOT NULL,

    CONSTRAINT "ledger_reversals_pkey" PRIMARY KEY ("original_ledger_id")
);

-- CreateTable
CREATE TABLE "payment_allocations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "source_ledger_id" UUID NOT NULL,
    "invoice_id" UUID,
    "refund_ledger_id" UUID,
    "amount" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "customers_code_key" ON "customers"("code");

-- CreateIndex
CREATE UNIQUE INDEX "customers_phone_key" ON "customers"("phone");

-- CreateIndex
CREATE INDEX "ix_customers_status" ON "customers"("status");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_number_key" ON "invoices"("number");

-- CreateIndex
CREATE INDEX "ix_invoices_customer_due" ON "invoices"("customer_id", "due_date");

-- CreateIndex
CREATE INDEX "ix_invoice_items_invoice" ON "invoice_items"("invoice_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_idempotency_key_key" ON "payments"("idempotency_key");

-- CreateIndex
CREATE INDEX "ix_payments_customer_paid" ON "payments"("customer_id", "paid_at");

-- CreateIndex
CREATE UNIQUE INDEX "ledger_entries_id_key" ON "ledger_entries"("id");

-- CreateIndex
CREATE INDEX "ix_ledger_customer_seq" ON "ledger_entries"("customer_id", "seq" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "ledger_reversals_reversal_ledger_id_key" ON "ledger_reversals"("reversal_ledger_id");

-- CreateIndex
CREATE INDEX "ix_alloc_invoice" ON "payment_allocations"("invoice_id");

-- CreateIndex
CREATE INDEX "ix_alloc_source" ON "payment_allocations"("source_ledger_id");

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_reversals" ADD CONSTRAINT "ledger_reversals_original_ledger_id_fkey" FOREIGN KEY ("original_ledger_id") REFERENCES "ledger_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_reversals" ADD CONSTRAINT "ledger_reversals_reversal_ledger_id_fkey" FOREIGN KEY ("reversal_ledger_id") REFERENCES "ledger_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_source_ledger_id_fkey" FOREIGN KEY ("source_ledger_id") REFERENCES "ledger_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_refund_ledger_id_fkey" FOREIGN KEY ("refund_ledger_id") REFERENCES "ledger_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;
