import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { PrismaClient } from "@prisma/client";
import { startTestContext, stopTestContext, TestContext } from "./setup-containers";
import {
  createCustomer,
  createPackage,
  createSubscription,
  truncateAll,
} from "./fixtures";
import { rupiah } from "@netbill/shared";
import { BillingService } from "../src/modules/billing/billing.service";
import { LedgerService } from "../src/modules/ledger/ledger.service";

describe("C5.3 BillingService (Generator Tagihan)", () => {
  let ctx: TestContext;
  let billing: BillingService;
  let ledger: LedgerService;

  beforeAll(async () => {
    ctx = await startTestContext();
    ledger = new LedgerService(ctx.prisma);
    billing = new BillingService(ctx.prisma, ledger);
  }, 120_000);

  afterAll(async () => {
    await stopTestContext();
  }, 30_000);

  beforeEach(async () => {
    await truncateAll(ctx.prisma);
  });

  it("Generator menerbitkan invoice untuk pelanggan aktif", async () => {
    const pkg = await createPackage(ctx.prisma, { price: rupiah(150000) });
    const c1 = await createCustomer(ctx.prisma, { status: "AKTIF" });
    const c2 = await createCustomer(ctx.prisma, { status: "AKTIF" });
    await createCustomer(ctx.prisma, { status: "ISOLIR" });

    await createSubscription(ctx.prisma, c1.id, {
      packageId: pkg.id,
      priceAtStart: rupiah(150000),
      startDate: new Date("2026-01-01"),
    });
    await createSubscription(ctx.prisma, c2.id, {
      packageId: pkg.id,
      priceAtStart: rupiah(150000),
      startDate: new Date("2026-01-01"),
    });

    const result = await billing.generateMonthlyInvoices("2026-11");

    expect(result.generated).toBe(2);
    expect(result.skipped).toBe(0);
    expect(result.failed).toBe(0);

    const invoices = await ctx.prisma.invoice.findMany({ where: { period: "2026-11" } });
    expect(invoices.length).toBe(2);
    expect(invoices[0]?.total).toBe(150000n);
    expect(invoices[0]?.number).toMatch(/^INV\/2026\/11\/0001$/);
    expect(invoices[1]?.number).toMatch(/^INV\/2026\/11\/0002$/);
  });

  it("Generator idempoten: run dua kali tidak duplikat", async () => {
    const pkg = await createPackage(ctx.prisma);
    const c1 = await createCustomer(ctx.prisma);
    await createSubscription(ctx.prisma, c1.id, {
      packageId: pkg.id,
      startDate: new Date("2026-01-01"),
    });

    const r1 = await billing.generateMonthlyInvoices("2026-11");
    expect(r1.generated).toBe(1);

    const r2 = await billing.generateMonthlyInvoices("2026-11");
    expect(r2.generated).toBe(0);
    expect(r2.skipped).toBe(1);

    const count = await ctx.prisma.invoice.count({ where: { period: "2026-11" } });
    expect(count).toBe(1);
  });

  it("Generator prorata: aktivasi tengah bulan", async () => {
    const pkg = await createPackage(ctx.prisma, { price: rupiah(150000) });
    const c1 = await createCustomer(ctx.prisma);
    await createSubscription(ctx.prisma, c1.id, {
      packageId: pkg.id,
      priceAtStart: rupiah(150000),
      startDate: new Date("2026-11-16"),
    });

    await billing.generateMonthlyInvoices("2026-11");

    const inv = await ctx.prisma.invoice.findFirst({ where: { period: "2026-11" } });
    expect(inv?.total).toBe(75000n);
  });
}, 180_000);
