import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { startTestContext, stopTestContext, TestContext } from "./setup-containers";
import { createCustomer, truncateAll } from "./fixtures";
import { rupiah } from "@netbill/shared";
import { LedgerService } from "../src/modules/ledger/ledger.service";

const DUMMY_ADMIN_ID = "00000000-0000-0000-0000-000000000001";

describe("B1-5: Duplicate detection (BR-P3)", () => {
  let ctx: TestContext;
  let service: LedgerService;

  beforeAll(async () => {
    ctx = await startTestContext();
    service = new LedgerService(ctx.prisma);
  }, 120_000);
  afterAll(async () => { await stopTestContext(); }, 30_000);
  beforeEach(async () => { await truncateAll(ctx.prisma); });

  it("same customer+amount+method within 60s, different key -> reject", async () => {
    const c = await createCustomer(ctx.prisma);
    await service.postPayment({
      customerId: c.id, amount: rupiah(50000), method: "TUNAI",
      paidAt: new Date(), recordedBy: DUMMY_ADMIN_ID,
      idempotencyKey: "KEY-1",
    });
    await expect(service.postPayment({
      customerId: c.id, amount: rupiah(50000), method: "TUNAI",
      paidAt: new Date(), recordedBy: DUMMY_ADMIN_ID,
      idempotencyKey: "KEY-2",
    })).rejects.toThrow(/SUSPECTED_DUPLICATE/);
  });

  it("same customer+method but different amount -> pass", async () => {
    const c = await createCustomer(ctx.prisma);
    await service.postPayment({
      customerId: c.id, amount: rupiah(50000), method: "TUNAI",
      paidAt: new Date(), recordedBy: DUMMY_ADMIN_ID,
      idempotencyKey: "KEY-A",
    });
    await service.postPayment({
      customerId: c.id, amount: rupiah(60000), method: "TUNAI",
      paidAt: new Date(), recordedBy: DUMMY_ADMIN_ID,
      idempotencyKey: "KEY-B",
    });
    const count = await ctx.prisma.payment.count({ where: { customerId: c.id } });
    expect(count).toBe(2);
  });

  it("no idempotencyKey -> skip detection (backward compat)", async () => {
    const c = await createCustomer(ctx.prisma);
    await service.postPayment({
      customerId: c.id, amount: rupiah(50000), method: "TUNAI",
      paidAt: new Date(), recordedBy: DUMMY_ADMIN_ID,
    });
    await service.postPayment({
      customerId: c.id, amount: rupiah(50000), method: "TUNAI",
      paidAt: new Date(), recordedBy: DUMMY_ADMIN_ID,
    });
    const count = await ctx.prisma.payment.count({ where: { customerId: c.id } });
    expect(count).toBe(2);
  });
}, 180_000);
