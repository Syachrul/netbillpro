import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { startTestContext, stopTestContext, TestContext } from "./setup-containers";
import { createCustomer, truncateAll } from "./fixtures";
import { rupiah } from "@netbill/shared";
import { LedgerService } from "../src/modules/ledger/ledger.service";

const DUMMY_ADMIN_ID = "00000000-0000-0000-0000-000000000001";

describe("B1-1: LedgerService read APIs", () => {
  let ctx: TestContext;
  let service: LedgerService;

  beforeAll(async () => {
    ctx = await startTestContext();
    service = new LedgerService(ctx.prisma);
  }, 120_000);
  afterAll(async () => { await stopTestContext(); }, 30_000);
  beforeEach(async () => { await truncateAll(ctx.prisma); });

  describe("getLedger", () => {
    it("empty customer -> entries [], total 0", async () => {
      const c = await createCustomer(ctx.prisma);
      const r = await service.getLedger(c.id);
      expect(r.entries).toEqual([]);
      expect(r.total).toBe(0);
    });

    it("after invoice+payment -> sorted desc by seq", async () => {
      const c = await createCustomer(ctx.prisma);
      await service.issueInvoice({ customerId: c.id, total: rupiah(150000), dueDate: new Date("2026-11-10"), number: "INV1", period: "2026-11" });
      await service.postPayment({ customerId: c.id, amount: rupiah(150000), method: "TUNAI", paidAt: new Date(), recordedBy: DUMMY_ADMIN_ID });
      const r = await service.getLedger(c.id);
      expect(r.total).toBe(2);
      expect(r.entries.length).toBe(2);
      expect(r.entries[0].seq > r.entries[1].seq).toBe(true);
    });

    it("limit applied (3 entries, limit 2)", async () => {
      const c = await createCustomer(ctx.prisma);
      for (let i = 1; i <= 3; i++) {
        await service.issueInvoice({ customerId: c.id, total: rupiah(100000), dueDate: new Date("2026-11-10"), number: `INV-${i}`, period: "2026-11" });
      }
      const r = await service.getLedger(c.id, { limit: 2 });
      expect(r.total).toBe(3);
      expect(r.entries.length).toBe(2);
    });
  });

  describe("getPosition", () => {
    it("empty -> all zero", async () => {
      const c = await createCustomer(ctx.prisma);
      const p = await service.getPosition(c.id);
      expect(p.balance).toBe(0n);
      expect(p.totalDue).toBe(0n);
      expect(p.freeCredit).toBe(0n);
    });

    it("invoice only -> negative balance, positive totalDue", async () => {
      const c = await createCustomer(ctx.prisma);
      await service.issueInvoice({ customerId: c.id, total: rupiah(150000), dueDate: new Date("2026-11-10"), number: "INV1", period: "2026-11" });
      const p = await service.getPosition(c.id);
      expect(p.balance).toBe(-150000n);
      expect(p.totalDue).toBe(150000n);
      expect(p.freeCredit).toBe(0n);
    });

    it("payment > invoice -> free credit", async () => {
      const c = await createCustomer(ctx.prisma);
      await service.issueInvoice({ customerId: c.id, total: rupiah(150000), dueDate: new Date("2026-11-10"), number: "INV1", period: "2026-11" });
      await service.postPayment({ customerId: c.id, amount: rupiah(200000), method: "TUNAI", paidAt: new Date(), recordedBy: DUMMY_ADMIN_ID });
      const p = await service.getPosition(c.id);
      expect(p.balance).toBe(50000n);
      expect(p.totalDue).toBe(0n);
      expect(p.freeCredit).toBe(50000n);
    });
  });

  describe("checkInvariants", () => {
    it("empty state -> ok, no violations", async () => {
      const c = await createCustomer(ctx.prisma);
      const r = await service.checkInvariants(c.id);
      expect(r.ok).toBe(true);
      expect(r.violations).toEqual([]);
    });

    it("clean flow -> ok", async () => {
      const c = await createCustomer(ctx.prisma);
      await service.issueInvoice({ customerId: c.id, total: rupiah(100000), dueDate: new Date("2026-11-10"), number: "INV1", period: "2026-11" });
      await service.postPayment({ customerId: c.id, amount: rupiah(100000), method: "TUNAI", paidAt: new Date(), recordedBy: DUMMY_ADMIN_ID });
      const r = await service.checkInvariants(c.id);
      expect(r.ok).toBe(true);
      expect(r.violations).toEqual([]);
    });
  });
}, 180_000);
