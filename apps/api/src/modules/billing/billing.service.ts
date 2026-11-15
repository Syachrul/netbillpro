import { Injectable, Inject } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { rupiah, Rupiah } from "@netbill/shared";
import { LedgerService } from "../ledger/ledger.service";

export interface GenerateMonthlyInvoicesResult {
  period: string;
  totalCustomers: number;
  generated: number;
  skipped: number;
  failed: number;
  errors: Array<{ customerId: string; reason: string }>;
}

const DEFAULT_GRACE_DAYS = 14;

@Injectable()
export class BillingService {
  constructor(
    @Inject(PrismaClient) private readonly prisma: PrismaClient,
    @Inject(LedgerService) private readonly ledgerService: LedgerService
  ) {}

  async generateMonthlyInvoices(period: string): Promise<GenerateMonthlyInvoicesResult> {
    const customers = await this.prisma.customer.findMany({
      where: { status: "AKTIF" },
      include: {
        subscriptions: { where: { endDate: null }, include: { package: true } },
      },
    });

    const errors: Array<{ customerId: string; reason: string }> = [];
    let generated = 0;
    let skipped = 0;
    let failed = 0;

    for (const customer of customers) {
      try {
        const subscription = customer.subscriptions[0];
        if (!subscription) {
          skipped++;
          continue;
        }

        const existing = await this.prisma.invoice.findFirst({
          where: { customerId: customer.id, period, type: "BULANAN" },
        });
        if (existing) {
          skipped++;
          continue;
        }

        const amount = this.calculateAmount(subscription.startDate, subscription.priceAtStart, period);
        const number = await this.nextInvoiceNumber(period);
        const dueDate = this.calculateDueDate(period);

        const snapshot = {
          packageCode: subscription.package.code,
          packageName: subscription.package.name,
          priceAtStart: subscription.priceAtStart.toString(),
          graceDays: DEFAULT_GRACE_DAYS,
          customerCode: customer.code,
          customerName: customer.name,
          customerPhone: customer.phone,
          period,
        };

        await this.ledgerService.issueInvoice({
          customerId: customer.id,
          total: amount,
          dueDate,
          number,
          period,
          type: "BULANAN",
          snapshot,
          subscriptionId: subscription.id,
        });

        generated++;
      } catch (e: any) {
        failed++;
        errors.push({ customerId: customer.id, reason: e.message });
      }
    }

    return { period, totalCustomers: customers.length, generated, skipped, failed, errors };
  }

  private calculateAmount(startDate: Date, monthlyPrice: Rupiah, period: string): Rupiah {
    const [year, month] = period.split("-").map(Number);
    const periodStart = new Date(Date.UTC(year, month - 1, 1));
    const periodEnd = new Date(Date.UTC(year, month, 0));
    const totalDays = periodEnd.getUTCDate();

    if (startDate.getTime() <= periodStart.getTime()) {
      return monthlyPrice;
    }

    const activationDay = startDate.getUTCDate();
    const remainingDays = totalDays - activationDay + 1;
    const prorata = (BigInt(monthlyPrice) * BigInt(remainingDays)) / BigInt(totalDays);
    return prorata as Rupiah;
  }

  private calculateDueDate(period: string): Date {
    const [year, month] = period.split("-").map(Number);
    const periodEnd = new Date(Date.UTC(year, month, 0));
    periodEnd.setUTCDate(periodEnd.getUTCDate() + DEFAULT_GRACE_DAYS);
    return periodEnd;
  }

  private async nextInvoiceNumber(period: string): Promise<string> {
    const [year, month] = period.split("-");
    const prefix = `INV/${year}/${month}/`;

    const last = await this.prisma.invoice.findFirst({
      where: { number: { startsWith: prefix } },
      orderBy: { number: "desc" },
    });

    const lastSeq = last ? parseInt(last.number.slice(prefix.length), 10) : 0;
    const nextSeq = lastSeq + 1;
    return `${prefix}${String(nextSeq).padStart(4, "0")}`;
  }
}
