import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { startTestContext, stopTestContext, TestContext } from "./setup-containers";

describe("C2-1 Testcontainers lifecycle", () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await startTestContext();
  }, 120_000);

  afterAll(async () => {
    await stopTestContext();
  }, 30_000);

  it("container start dan Prisma connect", async () => {
    const rows = await ctx.prisma.$queryRawUnsafe<Array<{ one: number }>>("SELECT 1 as one");
    expect(rows[0]?.one).toBe(1);
  });

  it("schema dan 7 tabel ada di container", async () => {
    const tables = await ctx.prisma.$queryRawUnsafe<Array<{ table_name: string }>>(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
    );
    const names = tables.map((t) => t.table_name);
    for (const t of [
      "customers",
      "invoices",
      "invoice_items",
      "payments",
      "ledger_entries",
      "ledger_reversals",
      "payment_allocations",
    ]) {
      expect(names).toContain(t);
    }
  });

  it("trigger append-only ada", async () => {
    const trigs = await ctx.prisma.$queryRawUnsafe<Array<{ tgname: string }>>(
      "SELECT tgname FROM pg_trigger WHERE tgname IN ('trg_ledger_immutable', 'trg_alloc_immutable') ORDER BY tgname"
    );
    const names = trigs.map((t) => t.tgname);
    expect(names).toContain("trg_ledger_immutable");
    expect(names).toContain("trg_alloc_immutable");
  });

  it("Prisma insert + select customer berhasil", async () => {
    const customer = await ctx.prisma.customer.create({
      data: {
        code: "CUST-TEST-1",
        name: "Test",
        phone: "628111111111",
        address: "Alamat",
      },
    });
    expect(customer.id).toBeTruthy();
    const found = await ctx.prisma.customer.findUnique({ where: { code: "CUST-TEST-1" } });
    expect(found?.name).toBe("Test");
  });

  it("pagar DB menolak UPDATE ledger_entries di container test", async () => {
    const customer = await ctx.prisma.customer.create({
      data: {
        code: "CUST-TEST-2",
        name: "Test2",
        phone: "628111111112",
        address: "Alamat2",
      },
    });

    await ctx.prisma.$executeRawUnsafe(
      "INSERT INTO ledger_entries (id, customer_id, type, debit, kredit, balance_after) VALUES (gen_random_uuid(), $1::uuid, 'PEMBAYARAN', 0, 100, 100)",
      customer.id
    );

    await expect(
      ctx.prisma.$executeRawUnsafe(
        "UPDATE ledger_entries SET kredit = 200 WHERE customer_id = $1::uuid",
        customer.id
      )
    ).rejects.toThrow(/append-only/);
  });
}, 180_000);
