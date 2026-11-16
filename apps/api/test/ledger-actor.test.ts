import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { startTestContext, stopTestContext, TestContext } from "./setup-containers";
import { createCustomer, truncateAll } from "./fixtures";
import { rupiah } from "@netbill/shared";
import { LedgerService, Actor } from "../src/modules/ledger/ledger.service";

const TEST_ACTOR: Actor = {
  userId: "11111111-1111-1111-1111-111111111111",
  role: "ADMIN",
  name: "Test Actor",
};
const DUMMY_ADMIN_ID = "00000000-0000-0000-0000-000000000001";

describe("B1-3: Actor propagation", () => {
  let ctx: TestContext;
  let service: LedgerService;

  beforeAll(async () => {
    ctx = await startTestContext();
    service = new LedgerService(ctx.prisma);
  }, 120_000);
  afterAll(async () => { await stopTestContext(); }, 30_000);
  beforeEach(async () => { await truncateAll(ctx.prisma); });

  it("issueInvoice with actor -> createdBy = actor.userId", async () => {
    const c = await createCustomer(ctx.prisma);
    const inv = await service.issueInvoice({
      customerId: c.id, total: rupiah(100000), dueDate: new Date("2026-11-10"),
      number: "INV-A1", period: "2026-11",
    }, TEST_ACTOR);
    const entry = await ctx.prisma.ledgerEntry.findFirst({
      where: { customerId: c.id, refType: "INVOICE", refId: inv.id },
    });
    expect(entry?.createdBy).toBe(TEST_ACTOR.userId);
  });

  it("issueInvoice without actor -> createdBy = null", async () => {
    const c = await createCustomer(ctx.prisma);
    const inv = await service.issueInvoice({
      customerId: c.id, total: rupiah(100000), dueDate: new Date("2026-11-10"),
      number: "INV-A2", period: "2026-11",
    });
    const entry = await ctx.prisma.ledgerEntry.findFirst({
      where: { customerId: c.id, refType: "INVOICE", refId: inv.id },
    });
    expect(entry?.createdBy).toBeNull();
  });

  it("postPayment with actor -> entry createdBy = actor.userId", async () => {
    const c = await createCustomer(ctx.prisma);
    await service.postPayment({
      customerId: c.id, amount: rupiah(50000), method: "TUNAI",
      paidAt: new Date(), recordedBy: DUMMY_ADMIN_ID,
    }, TEST_ACTOR);
    const entry = await ctx.prisma.ledgerEntry.findFirst({
      where: { customerId: c.id, type: "PEMBAYARAN" },
    });
    expect(entry?.createdBy).toBe(TEST_ACTOR.userId);
  });

  it("postPayment without actor -> entry createdBy = input.recordedBy", async () => {
    const c = await createCustomer(ctx.prisma);
    await service.postPayment({
      customerId: c.id, amount: rupiah(50000), method: "TUNAI",
      paidAt: new Date(), recordedBy: DUMMY_ADMIN_ID,
    });
    const entry = await ctx.prisma.ledgerEntry.findFirst({
      where: { customerId: c.id, type: "PEMBAYARAN" },
    });
    expect(entry?.createdBy).toBe(DUMMY_ADMIN_ID);
  });
}, 180_000);
