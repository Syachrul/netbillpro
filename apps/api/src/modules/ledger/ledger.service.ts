import { Injectable } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { rupiah, Rupiah } from "@netbill/shared";
import { randomUUID } from "node:crypto";

export interface PostPaymentInput { customerId: string; amount: Rupiah; method: "TUNAI" | "TRANSFER_BANK" | "E_WALLET"; paidAt: Date; invoiceId?: string; idempotencyKey?: string; }
export interface IssueInvoiceInput { customerId: string; total: Rupiah; dueDate: Date; number: string; period: string; }
export interface RefundInput { customerId: string; amount: Rupiah; }
export interface OpeningBalanceInput { customerId: string; amount: Rupiah; type: "TUNGGAKAN" | "DEPOSIT"; batchId: string; dueDate?: Date; }

const TX_OPTIONS = { timeout: 60000, maxWait: 10000 };

@Injectable()
export class LedgerService {
  constructor(private readonly prisma: PrismaClient) {}

  async postPayment(input: PostPaymentInput): Promise<{ balance: Rupiah; allocations: any[]; paymentId: string }> {
    return this.prisma.$transaction(async (tx) => {
      await this.lockCustomer(tx, input.customerId);
      if (input.idempotencyKey) {
        const existing = await tx.payment.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
        if (existing) {
          if (existing.customerId !== input.customerId || existing.amount !== input.amount || existing.method !== input.method) throw new Error("IDEMPOTENCY_CONFLICT");
          return { balance: await this.getCurrentBalance(tx, input.customerId), allocations: [], paymentId: existing.id };
        }
      }
      const idempotencyKey = input.idempotencyKey ?? randomUUID();
      const prevBalance = await this.getLastBalance(tx, input.customerId);
      const payment = await tx.payment.create({ data: { customerId: input.customerId, amount: input.amount, method: input.method, paidAt: input.paidAt, recordedBy: "00000000-0000-0000-0000-000000000000", idempotencyKey } });
      const entry = await tx.ledgerEntry.create({ data: { customerId: input.customerId, type: "PEMBAYARAN", debit: 0n, kredit: input.amount, balanceAfter: prevBalance + input.amount, refType: "PAYMENT", refId: payment.id } });
      let allocations = [];
      if (input.invoiceId) {
        const inv = await tx.invoice.findUnique({ where: { id: input.invoiceId } });
        if (inv) {
          const remaining = inv.total - inv.allocated;
          const allocAmount = input.amount < remaining ? input.amount : remaining;
          if (allocAmount > 0n) {
            const alloc = await tx.paymentAllocation.create({ data: { sourceLedgerId: entry.id, invoiceId: inv.id, amount: allocAmount } });
            allocations.push(alloc);
            const newAllocated = inv.allocated + allocAmount;
            await tx.invoice.update({ where: { id: inv.id }, data: { allocated: newAllocated, status: newAllocated >= inv.total ? "LUNAS" : "DIBAYAR_SEBAGIAN" } });
          }
        }
      }
      await this.reallocate(tx, input.customerId);
      return { balance: await this.getCurrentBalance(tx, input.customerId), allocations, paymentId: payment.id };
    }, TX_OPTIONS);
  }

  async issueInvoice(input: IssueInvoiceInput): Promise<{ id: string }> {
    return this.prisma.$transaction(async (tx) => {
      await this.lockCustomer(tx, input.customerId);
      const prevBalance = await this.getLastBalance(tx, input.customerId);
      const inv = await tx.invoice.create({ data: { number: input.number, customerId: input.customerId, type: "MANUAL", period: input.period, dueDate: input.dueDate, total: input.total, allocated: 0n, status: "BELUM_LUNAS", snapshot: {} } });
      await tx.ledgerEntry.create({ data: { customerId: input.customerId, type: "TAGIHAN", debit: input.total, kredit: 0n, balanceAfter: prevBalance - input.total, refType: "INVOICE", refId: inv.id } });
      await this.reallocate(tx, input.customerId);
      return { id: inv.id };
    }, TX_OPTIONS);
  }

  async voidPayment(paymentId: string, reason: string): Promise<void> {
    return this.prisma.$transaction(async (tx) => {
      const pay = await tx.payment.findUnique({ where: { id: paymentId } });
      if (!pay || pay.voidedAt) throw new Error("Payment not found or already voided");
      await this.lockCustomer(tx, pay.customerId);
      const prevBalance = await this.getLastBalance(tx, pay.customerId);
      const originalEntry = await tx.ledgerEntry.findFirst({ where: { refType: "PAYMENT", refId: pay.id } });
      if (!originalEntry) throw new Error("Original ledger entry not found");
      const allocs = await tx.paymentAllocation.findMany({ where: { sourceLedgerId: originalEntry.id } });
      const hasRefund = await tx.paymentAllocation.findFirst({ where: { sourceLedgerId: originalEntry.id, refundLedgerId: { not: null } } });
      if (hasRefund) throw new Error("PAYMENT_ALREADY_REFUNDED");
      await tx.ledgerEntry.create({ data: { customerId: pay.customerId, type: "REVERSAL", debit: pay.amount, kredit: 0n, balanceAfter: prevBalance - pay.amount, refType: "PAYMENT", refId: pay.id } });
      for (const a of allocs) {
        await tx.paymentAllocation.create({ data: { sourceLedgerId: originalEntry.id, invoiceId: a.invoiceId, amount: -a.amount } });
        const inv = await tx.invoice.findUnique({ where: { id: a.invoiceId! } });
        if (inv) {
          const newAllocated = inv.allocated - a.amount;
          await tx.invoice.update({ where: { id: inv.id }, data: { allocated: newAllocated, status: newAllocated <= 0n ? "BELUM_LUNAS" : "DIBAYAR_SEBAGIAN" } });
        }
      }
      await tx.payment.update({ where: { id: pay.id }, data: { voidedAt: new Date() } });
    }, TX_OPTIONS);
  }

  async voidInvoice(invoiceId: string, reason: string): Promise<void> {
    return this.prisma.$transaction(async (tx) => {
      const inv = await tx.invoice.findUnique({ where: { id: invoiceId } });
      if (!inv || inv.status === "BATAL") throw new Error("Invoice not found or already voided");
      await this.lockCustomer(tx, inv.customerId);
      const prevBalance = await this.getLastBalance(tx, inv.customerId);
      await tx.ledgerEntry.create({ data: { customerId: inv.customerId, type: "REVERSAL", debit: 0n, kredit: inv.total, balanceAfter: prevBalance + inv.total, refType: "INVOICE", refId: inv.id } });
      const allocs = await tx.paymentAllocation.findMany({ where: { invoiceId: inv.id } });
      for (const a of allocs) {
        await tx.paymentAllocation.create({ data: { sourceLedgerId: a.sourceLedgerId, invoiceId: inv.id, amount: -a.amount } });
      }
      await tx.invoice.update({ where: { id: inv.id }, data: { status: "BATAL", allocated: 0n } });
      await this.reallocate(tx, inv.customerId);
    }, TX_OPTIONS);
  }

  async refundDeposit(input: RefundInput): Promise<void> {
    return this.prisma.$transaction(async (tx) => {
      await this.lockCustomer(tx, input.customerId);
      const freeCredits = await this.getFreeCreditSources(tx, input.customerId);
      let remaining = input.amount;
      for (const src of freeCredits) {
        if (remaining <= 0n) break;
        const srcFree = BigInt(src.free);
        const use = remaining < srcFree ? remaining : srcFree;
        const refundEntry = await tx.ledgerEntry.create({ data: { customerId: input.customerId, type: "REFUND_DEPOSIT", debit: use, kredit: 0n, balanceAfter: (await this.getLastBalance(tx, input.customerId)) - use, refType: "REFUND", refId: randomUUID() } });
        await tx.paymentAllocation.create({ data: { sourceLedgerId: src.id, invoiceId: null, refundLedgerId: refundEntry.id, amount: use } });
        remaining -= use;
      }
      if (remaining > 0n) throw new Error("INSUFFICIENT_FREE_CREDIT");
    }, TX_OPTIONS);
  }

  async importOpeningBalance(input: OpeningBalanceInput): Promise<void> {
    return this.prisma.$transaction(async (tx) => {
      await this.lockCustomer(tx, input.customerId);
      const existing = await tx.invoice.findFirst({ where: { customerId: input.customerId, type: "SALDO_AWAL" } });
      if (existing) throw new Error("OPENING_BALANCE_ALREADY_EXISTS");
      const prevBalance = await this.getLastBalance(tx, input.customerId);
      if (input.type === "TUNGGAKAN") {
        const inv = await tx.invoice.create({ data: { number: `OPEN-${input.batchId}-${input.customerId.substring(0, 8)}`, customerId: input.customerId, type: "SALDO_AWAL", period: null, dueDate: input.dueDate ?? new Date(), total: input.amount, allocated: 0n, status: "BELUM_LUNAS", snapshot: { batchId: input.batchId } } });
        await tx.ledgerEntry.create({ data: { customerId: input.customerId, type: "SALDO_AWAL", debit: input.amount, kredit: 0n, balanceAfter: prevBalance - input.amount, refType: "INVOICE", refId: inv.id } });
      } else {
        await tx.ledgerEntry.create({ data: { customerId: input.customerId, type: "SALDO_AWAL", debit: 0n, kredit: input.amount, balanceAfter: prevBalance + input.amount, refType: "IMPORT", refId: randomUUID() } });
      }
      await this.reallocate(tx, input.customerId);
    }, TX_OPTIONS);
  }

  private async lockCustomer(tx: any, customerId: string) { await tx.$queryRawUnsafe("SELECT 1 FROM customers WHERE id = $1::uuid FOR UPDATE", customerId); }
  private async getLastBalance(tx: any, customerId: string): Promise<Rupiah> { const last = await tx.ledgerEntry.findFirst({ where: { customerId }, orderBy: { seq: "desc" } }); return last?.balanceAfter ?? 0n; }
  private async getCurrentBalance(tx: any, customerId: string): Promise<Rupiah> { const sum = await tx.ledgerEntry.aggregate({ where: { customerId }, _sum: { kredit: true, debit: true } }); return (sum._sum.kredit ?? 0n) - (sum._sum.debit ?? 0n); }
  private async getFreeCreditSources(tx: any, customerId: string): Promise<any[]> {
    return tx.$queryRawUnsafe<any[]>(
      `SELECT l.id, l.kredit - COALESCE(SUM(a.amount), 0) AS free` +
      ` FROM ledger_entries l` +
      ` LEFT JOIN payment_allocations a ON a.source_ledger_id = l.id` +
      ` WHERE l.customer_id = $1::uuid AND l.kredit > 0 AND l.type IN ('PEMBAYARAN', 'SALDO_AWAL')` +
      ` AND NOT EXISTS (SELECT 1 FROM ledger_reversals r WHERE r.original_ledger_id = l.id)` +
      ` GROUP BY l.id, l.kredit, l.seq` +
      ` HAVING l.kredit - COALESCE(SUM(a.amount), 0) > 0` +
      ` ORDER BY l.seq ASC`,
      customerId
    );
  }
  private async reallocate(tx: any, customerId: string): Promise<any[]> {
    const sources = await this.getFreeCreditSources(tx, customerId);
    if (sources.length === 0) return [];
    const targets = await tx.invoice.findMany({ where: { customerId, status: { in: ["BELUM_LUNAS", "DIBAYAR_SEBAGIAN"] } }, orderBy: [{ dueDate: "asc" }, { issuedAt: "asc" }] });
    if (targets.length === 0) return [];
    let i = 0, j = 0;
    const newAllocations = [];
    const sourceFree = sources.map((s: any) => BigInt(s.free));
    while (i < sources.length && j < targets.length) {
      const src = sources[i]; const inv = targets[j];
      const need = inv.total - inv.allocated; const available = sourceFree[i];
      const allocAmount = available < need ? available : need;
      if (allocAmount > 0n) {
        const alloc = await tx.paymentAllocation.create({ data: { sourceLedgerId: src.id, invoiceId: inv.id, amount: allocAmount } });
        newAllocations.push(alloc);
        const newAllocated = inv.allocated + allocAmount;
        await tx.invoice.update({ where: { id: inv.id }, data: { allocated: newAllocated, status: newAllocated >= inv.total ? "LUNAS" : "DIBAYAR_SEBAGIAN" } });
        sourceFree[i] -= allocAmount; inv.allocated = newAllocated;
      }
      if (sourceFree[i] === 0n) i++; if (inv.allocated >= inv.total) j++;
    }
    return newAllocations;
  }
}
