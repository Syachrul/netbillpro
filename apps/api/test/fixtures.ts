import { PrismaClient, Customer, Invoice, Package, Subscription } from "@prisma/client";
import { rupiah, Rupiah } from "@netbill/shared";

let customerCounter = 0;
let invoiceCounter = 0;
let packageCounter = 0;

export function resetCounters(): void {
  customerCounter = 0;
  invoiceCounter = 0;
  packageCounter = 0;
}

// ===== PACKAGE =====
export interface CreatePackageOverrides {
  code?: string;
  name?: string;
  price?: Rupiah;
  installFee?: Rupiah;
  speedDown?: number;
  speedUp?: number;
  status?: string;
}

export async function createPackage(
  prisma: PrismaClient,
  overrides: CreatePackageOverrides = {}
): Promise<Package> {
  packageCounter += 1;
  const n = packageCounter;
  return prisma.package.create({
    data: {
      code: overrides.code ?? `PKT-${String(n).padStart(3, "0")}`,
      name: overrides.name ?? `Paket ${n}`,
      price: overrides.price ?? rupiah(150000),
      installFee: overrides.installFee ?? rupiah(0),
      speedDown: overrides.speedDown ?? 10,
      speedUp: overrides.speedUp ?? 10,
      status: overrides.status ?? "AKTIF",
    },
  });
}

// ===== CUSTOMER =====
export interface CreateCustomerOverrides {
  code?: string;
  name?: string;
  phone?: string;
  email?: string | null;
  address?: string;
  status?: "AKTIF" | "ISOLIR" | "BERHENTI";
}

export async function createCustomer(
  prisma: PrismaClient,
  overrides: CreateCustomerOverrides = {}
): Promise<Customer> {
  customerCounter += 1;
  const n = customerCounter;
  return prisma.customer.create({
    data: {
      code: overrides.code ?? `CUST-${String(n).padStart(4, "0")}`,
      name: overrides.name ?? `Customer ${n}`,
      phone: overrides.phone ?? `6281111${String(n).padStart(5, "0")}`,
      email: overrides.email ?? null,
      address: overrides.address ?? `Alamat ${n}`,
      status: overrides.status ?? "AKTIF",
    },
  });
}

// ===== SUBSCRIPTION =====
export interface CreateSubscriptionOverrides {
  packageId: string;
  priceAtStart?: Rupiah;
  startDate?: Date;
  endDate?: Date | null;
}

export async function createSubscription(
  prisma: PrismaClient,
  customerId: string,
  overrides: CreateSubscriptionOverrides
): Promise<Subscription> {
  return prisma.subscription.create({
    data: {
      customerId,
      packageId: overrides.packageId,
      priceAtStart: overrides.priceAtStart ?? rupiah(150000),
      startDate: overrides.startDate ?? new Date(),
      endDate: overrides.endDate ?? null,
    },
  });
}

// ===== INVOICE =====
export interface CreateInvoiceOverrides {
  number?: string;
  type?: "BULANAN" | "MANUAL" | "SALDO_AWAL";
  period?: string;
  dueDate?: Date;
  total?: Rupiah;
  allocated?: Rupiah;
  status?: "BELUM_LUNAS" | "DIBAYAR_SEBAGIAN" | "LUNAS" | "BATAL";
  snapshot?: Record<string, unknown>;
}

export async function createInvoice(
  prisma: PrismaClient,
  customerId: string,
  overrides: CreateInvoiceOverrides = {}
): Promise<Invoice> {
  invoiceCounter += 1;
  const n = invoiceCounter;
  return prisma.invoice.create({
    data: {
      number: overrides.number ?? `INV-TEST-${String(n).padStart(4, "0")}`,
      customerId,
      type: overrides.type ?? "MANUAL",
      period: overrides.period ?? "2026-11",
      dueDate: overrides.dueDate ?? new Date("2026-11-30"),
      total: overrides.total ?? rupiah(150000),
      allocated: overrides.allocated ?? rupiah(0),
      status: overrides.status ?? "BELUM_LUNAS",
      snapshot: overrides.snapshot ?? {},
    },
  });
}

// ===== TRUNCATE =====
export async function truncateAll(prisma: PrismaClient): Promise<void> {
  await prisma.$executeRawUnsafe("SET lock_timeout = '30s'");
  try {
    await prisma.$executeRawUnsafe(
      "TRUNCATE TABLE payment_allocations, ledger_reversals, ledger_entries, invoices, payments, subscriptions, packages, customers, users RESTART IDENTITY CASCADE"
    );
  } finally {
    await prisma.$executeRawUnsafe("SET lock_timeout = DEFAULT");
  }
  resetCounters();
}
