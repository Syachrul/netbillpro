import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { startTestContext, stopTestContext, TestContext } from "./setup-containers";
import { createCustomer, createInvoice, truncateAll } from "./fixtures";

describe("C2-2-2 Fixtures", () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await startTestContext();
  }, 120_000);

  afterAll(async () => {
    await stopTestContext();
  }, 30_000);

  beforeEach(async () => {
    await truncateAll(ctx.prisma);
  });

  it("T-01: createCustomer menghasilkan customer valid dengan default", async () => {
    const c = await createCustomer(ctx.prisma);
    expect(c.id).toBeTruthy();
    expect(c.code).toMatch(/^CUST-\d{4}$/);
    expect(c.status).toBe("AKTIF");
    expect(c.phone).toMatch(/^6281111\d{5}$/);
  });

  it("T-02: createInvoice valid + FK menolak customer tidak ada", async () => {
    const c = await createCustomer(ctx.prisma);
    const inv = await createInvoice(ctx.prisma, c.id);
    expect(inv.id).toBeTruthy();
    expect(inv.customerId).toBe(c.id);
    expect(inv.total).toBe(150000n);
    expect(inv.allocated).toBe(0n);
    expect(inv.status).toBe("BELUM_LUNAS");

    const fakeCustomerId = "00000000-0000-0000-0000-000000000000";
    await expect(createInvoice(ctx.prisma, fakeCustomerId)).rejects.toThrow();
  });

  it("T-03: truncateAll membersihkan tabel dan mereset identity", async () => {
    const c = await createCustomer(ctx.prisma);
    await createInvoice(ctx.prisma, c.id);

    await truncateAll(ctx.prisma);

    expect(await ctx.prisma.customer.count()).toBe(0);
    expect(await ctx.prisma.invoice.count()).toBe(0);
    expect(await ctx.prisma.ledgerEntry.count()).toBe(0);

    const c2 = await createCustomer(ctx.prisma);
    expect(c2.code).toBe("CUST-0001");
  });

  it("T-04: append-only tetap aktif sebelum dan sesudah truncateAll", async () => {
    const c = await createCustomer(ctx.prisma);

    await ctx.prisma.$executeRawUnsafe(
      "INSERT INTO ledger_entries (id, customer_id, type, debit, kredit, balance_after) VALUES (gen_random_uuid(), $1::uuid, 'PEMBAYARAN', 0, 100, 100)",
      c.id
    );
    const entry = await ctx.prisma.ledgerEntry.findFirst({ where: { customerId: c.id } });
    expect(entry).toBeTruthy();

    await expect(
      ctx.prisma.$executeRawUnsafe(
        "UPDATE ledger_entries SET kredit = 200 WHERE customer_id = $1::uuid",
        c.id
      )
    ).rejects.toThrow(/append-only/);

    await expect(
      ctx.prisma.$executeRawUnsafe(
        "DELETE FROM ledger_entries WHERE customer_id = $1::uuid",
        c.id
      )
    ).rejects.toThrow(/append-only/);

    await truncateAll(ctx.prisma);
    expect(await ctx.prisma.ledgerEntry.count()).toBe(0);

    const c2 = await createCustomer(ctx.prisma);
    await ctx.prisma.$executeRawUnsafe(
      "INSERT INTO ledger_entries (id, customer_id, type, debit, kredit, balance_after) VALUES (gen_random_uuid(), $1::uuid, 'PEMBAYARAN', 0, 100, 100)",
      c2.id
    );
    await expect(
      ctx.prisma.$executeRawUnsafe(
        "UPDATE ledger_entries SET kredit = 200 WHERE customer_id = $1::uuid",
        c2.id
      )
    ).rejects.toThrow(/append-only/);
  });
}, 180_000);
