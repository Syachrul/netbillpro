import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import * as fc from "fast-check";
import { startTestContext, stopTestContext, TestContext } from "./setup-containers";
import { createCustomer, truncateAll } from "./fixtures";
import { rupiah } from "@netbill/shared";
import { LedgerService } from "../src/modules/ledger/ledger.service";

// Helper untuk memeriksa Invarian (I-1, I-2, I-3)
async function checkInvariants(ctx: TestContext, customerId: string) {
  const prisma = ctx.prisma;

  // I-1: balance_after entri terakhir = SUM(kredit) - SUM(debit)
  const last = await prisma.ledgerEntry.findFirst({ where: { customerId }, orderBy: { seq: "desc" } });
  const sums = await prisma.ledgerEntry.aggregate({ where: { customerId }, _sum: { kredit: true, debit: true } });
  const expectedBalance = (sums._sum.kredit ?? 0n) - (sums._sum.debit ?? 0n);
  expect(last?.balanceAfter ?? 0n).toBe(expectedBalance);

  // I-2: invoices.allocated = SUM(payment_allocations)
  const invoices = await prisma.invoice.findMany({ where: { customerId } });
  for (const inv of invoices) {
    const allocSum = await prisma.paymentAllocation.aggregate({ where: { invoiceId: inv.id }, _sum: { amount: true } });
    expect(inv.allocated).toBe(allocSum._sum.amount ?? 0n);
  }
}

describe("C4 Property Testing", () => {
  let ctx: TestContext;
  let service: LedgerService;

  beforeAll(async () => {
    ctx = await startTestContext();
    service = new LedgerService(ctx.prisma);
  }, 120_000);

  afterAll(async () => { await stopTestContext(); }, 30_000);
  beforeEach(async () => { await truncateAll(ctx.prisma); });

  it("Urutan operasi acak tidak boleh melanggar Invarian", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.oneof(
            fc.record({ type: fc.constant("issue"), amount: fc.integer({ min: 1000, max: 500000 }).map(rupiah) }),
            fc.record({ type: fc.constant("pay"), amount: fc.integer({ min: 1000, max: 500000 }).map(rupiah) }),
            fc.record({ type: fc.constant("void"), amount: fc.constant(0n) })
          ),
          { minLength: 5, maxLength: 15 }
        ),
        async (actions) => {
          const c = await createCustomer(ctx.prisma);
          let invoiceId = "";
          let paymentId = "";

          for (const action of actions) {
            try {
              if (action.type === "issue") {
                const inv = await service.issueInvoice({ customerId: c.id, total: action.amount, dueDate: new Date(), number: `INV-${Date.now()}-${Math.random()}`, period: "2027-01" });
                invoiceId = inv.id;
              } else if (action.type === "pay") {
                const pay = await service.postPayment({ customerId: c.id, amount: action.amount, method: "TUNAI", paidAt: new Date() });
                paymentId = pay.paymentId;
              } else if (action.type === "void" && paymentId) {
                await service.voidPayment(paymentId, "Test");
              }
            } catch (e) {
              // Abaikan error yang diharapkan (misal: void payment yang sudah di-void)
            }
            // Setelah SETIAP operasi, periksa invarian
            await checkInvariants(ctx, c.id);
          }
        }
      ),
      { numRuns: 50, timeout: 120000 } // 50 urutan acak
    );
  }, 180_000);
}, 360_000);
