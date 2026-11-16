import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { startTestContext, stopTestContext, TestContext } from "./setup-containers";
import { createCustomer, truncateAll } from "./fixtures";
import { rupiah } from "@netbill/shared";
import { LedgerService } from "../src/modules/ledger/ledger.service";

const DUMMY_ADMIN_ID = "00000000-0000-0000-0000-000000000001";

describe("B1-4: Void audit fields", () => {
  let ctx: TestContext;
  let service: LedgerService;

  beforeAll(async () => {
    ctx = await startTestContext();
    service = new LedgerService(ctx.prisma);
  }, 120_000);
  afterAll(async () => { await stopTestContext(); }, 30_000);
  beforeEach(async () => { await truncateAll(ctx.prisma); });

  it("voidInvoice sets voidedAt + voidReason", async () => {
    const c = await createCustomer(ctx.prisma);
    const inv = await service.issueInvoice({
      customerId: c.id, total: rupiah(150000), dueDate: new Date("2026-11-10"),
      number: "INV-V1", period: "2026-11",
    });
    const before = await ctx.prisma.invoice.findUnique({ where: { id: inv.id } });
    expect(before?.voidedAt).toBeNull();
    expect(before?.voidReason).toBeNull();

    await service.voidInvoice(inv.id, "Salah periode input");

    const after = await ctx.prisma.invoice.findUnique({ where: { id: inv.id } });
    expect(after?.voidedAt).not.toBeNull();
    expect(after?.voidReason).toBe("Salah periode input");
    expect(after?.status).toBe("BATAL");
  });

  it("voidPayment sets voidedAt (existing behavior)", async () => {
    const c = await createCustomer(ctx.prisma);
    const pay = await service.postPayment({
      customerId: c.id, amount: rupiah(50000), method: "TUNAI",
      paidAt: new Date(), recordedBy: DUMMY_ADMIN_ID,
    });
    const before = await ctx.prisma.payment.findUnique({ where: { id: pay.paymentId } });
    expect(before?.voidedAt).toBeNull();

    await service.voidPayment(pay.paymentId, "Salah catat");

    const after = await ctx.prisma.payment.findUnique({ where: { id: pay.paymentId } });
    expect(after?.voidedAt).not.toBeNull();
  });
}, 180_000);
