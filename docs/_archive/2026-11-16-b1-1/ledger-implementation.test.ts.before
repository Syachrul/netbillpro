import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { startTestContext, stopTestContext, TestContext } from "./setup-containers";
import { createCustomer, truncateAll } from "./fixtures";
import { rupiah } from "@netbill/shared";
import { LedgerService } from "../src/modules/ledger/ledger.service";

describe("C3.7 Final: S8, T15, T21, T22", () => {
  let ctx: TestContext;
  let service: LedgerService;

  beforeAll(async () => {
    ctx = await startTestContext();
    service = new LedgerService(ctx.prisma);
  }, 120_000);

  afterAll(async () => { await stopTestContext(); }, 30_000);
  beforeEach(async () => { await truncateAll(ctx.prisma); });

  it("S8: Refund deposit", async () => {
    const c = await createCustomer(ctx.prisma);
    await service.issueInvoice({ customerId: c.id, total: rupiah(150000), dueDate: new Date("2026-11-10"), number: "INV1", period: "2026-11" });
    await service.postPayment({ customerId: c.id, amount: rupiah(200000), method: "TUNAI", paidAt: new Date() });
    await service.refundDeposit({ customerId: c.id, amount: rupiah(50000) });

    const pos = await ctx.prisma.ledgerEntry.aggregate({ where: { customerId: c.id }, _sum: { kredit: true, debit: true } });
    expect((pos._sum.kredit ?? 0n) - (pos._sum.debit ?? 0n)).toBe(0n);
  });

  it("T15: Impor saldo awal (tunggakan & deposit)", async () => {
    const cA = await createCustomer(ctx.prisma, { code: "CUST-A" });
    const cB = await createCustomer(ctx.prisma, { code: "CUST-B" });

    await service.importOpeningBalance({ customerId: cA.id, amount: rupiah(300000), type: "TUNGGAKAN", batchId: "BATCH-1", dueDate: new Date("2026-11-30") });
    await service.importOpeningBalance({ customerId: cB.id, amount: rupiah(80000), type: "DEPOSIT", batchId: "BATCH-1" });

    await service.issueInvoice({ customerId: cA.id, total: rupiah(150000), dueDate: new Date("2026-12-10"), number: "A-INV", period: "2026-12" });
    await service.issueInvoice({ customerId: cB.id, total: rupiah(150000), dueDate: new Date("2026-12-10"), number: "B-INV", period: "2026-12" });

    const posA = await ctx.prisma.ledgerEntry.aggregate({ where: { customerId: cA.id }, _sum: { kredit: true, debit: true } });
    expect((posA._sum.kredit ?? 0n) - (posA._sum.debit ?? 0n)).toBe(-450000n);

    const posB = await ctx.prisma.ledgerEntry.aggregate({ where: { customerId: cB.id }, _sum: { kredit: true, debit: true } });
    expect((posB._sum.kredit ?? 0n) - (posB._sum.debit ?? 0n)).toBe(-70000n);

    const invB = await ctx.prisma.invoice.findUnique({ where: { number: "B-INV" } });
    expect(invB?.allocated).toBe(80000n);
    expect(invB?.status).toBe("DIBAYAR_SEBAGIAN");
  });

  it("T21: Void payment setelah refund ditolak", async () => {
    const c = await createCustomer(ctx.prisma);
    await service.issueInvoice({ customerId: c.id, total: rupiah(150000), dueDate: new Date("2026-11-10"), number: "INV1", period: "2026-11" });
    const pay = await service.postPayment({ customerId: c.id, amount: rupiah(200000), method: "TUNAI", paidAt: new Date() });
    await service.refundDeposit({ customerId: c.id, amount: rupiah(50000) });

    await expect(service.voidPayment(pay.paymentId, "Test")).rejects.toThrow(/PAYMENT_ALREADY_REFUNDED/);
  });

  it("T22: Void invoice lunas, dana jadi deposit", async () => {
    const c = await createCustomer(ctx.prisma);
    const inv = await service.issueInvoice({ customerId: c.id, total: rupiah(150000), dueDate: new Date("2026-11-10"), number: "INV1", period: "2026-11" });
    await service.postPayment({ customerId: c.id, amount: rupiah(150000), method: "TUNAI", paidAt: new Date() });

    await service.voidInvoice(inv.id, "Salah periode");

    const pos = await ctx.prisma.ledgerEntry.aggregate({ where: { customerId: c.id }, _sum: { kredit: true, debit: true } });
    expect((pos._sum.kredit ?? 0n) - (pos._sum.debit ?? 0n)).toBe(150000n);
  });
}, 180_000);
