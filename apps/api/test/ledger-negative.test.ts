import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { startTestContext, stopTestContext, TestContext } from "./setup-containers";
import { createCustomer, createInvoice, truncateAll } from "./fixtures";
import { rupiah } from "@netbill/shared";

describe("C2-4 Group A: Database Invariants (N-7, N-9)", () => {
  let ctx: TestContext;

  beforeAll(async () => { ctx = await startTestContext(); }, 120_000);
  afterAll(async () => { await stopTestContext(); }, 30_000);
  beforeEach(async () => { await truncateAll(ctx.prisma); });

  it("N-7: Duplicate active monthly invoice harus ditolak (P2002)", async () => {
    const c = await createCustomer(ctx.prisma);

    // Invoice pertama (valid)
    const inv1 = await createInvoice(ctx.prisma, c.id, { type: "BULANAN", period: "2026-11" });
    expect(inv1.id).toBeTruthy();

    // Invoice kedua (harus gagal)
    await expect(
      createInvoice(ctx.prisma, c.id, { type: "BULANAN", period: "2026-11" })
    ).rejects.toThrowError(PrismaClientKnownRequestError);

    // Verifikasi error code P2002
    try {
      await createInvoice(ctx.prisma, c.id, { type: "BULANAN", period: "2026-11" });
    } catch (e: any) {
      expect(e.code).toBe("P2002");
    }

    // Pastikan invoice pertama tetap utuh dan hanya ada 1
    const count = await ctx.prisma.invoice.count({ where: { customerId: c.id } });
    expect(count).toBe(1);
    const existing = await ctx.prisma.invoice.findUnique({ where: { id: inv1.id } });
    expect(existing).not.toBeNull();
  });

  it("N-9: Append-only protection (UPDATE & DELETE ditolak di kedua tabel)", async () => {
    const c = await createCustomer(ctx.prisma);
    const inv = await createInvoice(ctx.prisma, c.id);

    // Setup data: Ledger Entry (sumber) dan Payment Allocation (target)
    const entry = await ctx.prisma.ledgerEntry.create({
      data: {
        customerId: c.id,
        type: "PEMBAYARAN",
        debit: 0n,
        kredit: 150000n,
        balanceAfter: 150000n,
      },
    });

    const alloc = await ctx.prisma.paymentAllocation.create({
      data: {
        sourceLedgerId: entry.id,
        invoiceId: inv.id,
        amount: 150000n,
      },
    });

    // 1. UPDATE ledger_entries
    await expect(
      ctx.prisma.ledgerEntry.update({ where: { id: entry.id }, data: { kredit: 200000n } })
    ).rejects.toThrow();

    // 2. DELETE ledger_entries
    await expect(
      ctx.prisma.ledgerEntry.delete({ where: { id: entry.id } })
    ).rejects.toThrow();

    // 3. UPDATE payment_allocations
    await expect(
      ctx.prisma.paymentAllocation.update({ where: { id: alloc.id }, data: { amount: 100000n } })
    ).rejects.toThrow();

    // 4. DELETE payment_allocations
    await expect(
      ctx.prisma.paymentAllocation.delete({ where: { id: alloc.id } })
    ).rejects.toThrow();

    // Verifikasi data tidak berubah
    const checkEntry = await ctx.prisma.ledgerEntry.findUnique({ where: { id: entry.id } });
    expect(checkEntry?.kredit).toBe(150000n);

    const checkAlloc = await ctx.prisma.paymentAllocation.findUnique({ where: { id: alloc.id } });
    expect(checkAlloc?.amount).toBe(150000n);
  });
}, 180_000);
