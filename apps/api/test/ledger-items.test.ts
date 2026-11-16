import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { startTestContext, stopTestContext, TestContext } from "./setup-containers";
import { createCustomer, truncateAll } from "./fixtures";
import { rupiah } from "@netbill/shared";
import { LedgerService } from "../src/modules/ledger/ledger.service";

describe("B1-2: InvoiceItem support", () => {
  let ctx: TestContext;
  let service: LedgerService;

  beforeAll(async () => {
    ctx = await startTestContext();
    service = new LedgerService(ctx.prisma);
  }, 120_000);
  afterAll(async () => { await stopTestContext(); }, 30_000);
  beforeEach(async () => { await truncateAll(ctx.prisma); });

  it("no items -> 0 InvoiceItem rows (backward compat)", async () => {
    const c = await createCustomer(ctx.prisma);
    const inv = await service.issueInvoice({
      customerId: c.id,
      total: rupiah(150000),
      dueDate: new Date("2026-11-10"),
      number: "INV-NOITEM",
      period: "2026-11",
    });
    const items = await ctx.prisma.invoiceItem.findMany({ where: { invoiceId: inv.id } });
    expect(items.length).toBe(0);
  });

  it("3 items -> 3 InvoiceItem rows with correct fields", async () => {
    const c = await createCustomer(ctx.prisma);
    const inv = await service.issueInvoice({
      customerId: c.id,
      total: rupiah(150000),
      dueDate: new Date("2026-11-10"),
      number: "INV-3ITEM",
      period: "2026-11",
      items: [
        { kind: "BULANAN", description: "Paket 10 Mbps", amount: rupiah(100000) },
        { kind: "DISKON", description: "Diskon loyalitas", amount: rupiah(-10000) },
        { kind: "BIAYA", description: "Biaya instalasi", amount: rupiah(60000) },
      ],
    });
    const items = await ctx.prisma.invoiceItem.findMany({
      where: { invoiceId: inv.id },
      orderBy: { amount: "asc" },
    });
    expect(items.length).toBe(3);
    expect(items[0].amount).toBe(-10000n);
    expect(items[1].amount).toBe(60000n);
    expect(items[2].amount).toBe(100000n);
    expect(items.every((i) => i.invoiceId === inv.id)).toBe(true);
  });

  it("single item -> 1 InvoiceItem row", async () => {
    const c = await createCustomer(ctx.prisma);
    const inv = await service.issueInvoice({
      customerId: c.id,
      total: rupiah(50000),
      dueDate: new Date("2026-11-10"),
      number: "INV-1ITEM",
      period: "2026-11",
      items: [{ kind: "MANUAL", description: "Denda", amount: rupiah(50000) }],
    });
    const items = await ctx.prisma.invoiceItem.findMany({ where: { invoiceId: inv.id } });
    expect(items.length).toBe(1);
    expect(items[0].kind).toBe("MANUAL");
    expect(items[0].description).toBe("Denda");
  });
}, 180_000);
