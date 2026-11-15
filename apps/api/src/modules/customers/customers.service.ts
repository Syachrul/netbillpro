import { Injectable, Inject } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

export interface CreateCustomerInput {
  code: string;
  name: string;
  phone: string;
  email?: string;
  usernameHotspot?: string;
  address: string;
  dueDay?: number;
}

export interface UpdateCustomerInput {
  name?: string;
  phone?: string;
  email?: string;
  usernameHotspot?: string;
  address?: string;
  dueDay?: number;
}

@Injectable()
export class CustomersService {
  constructor(@Inject(PrismaClient) private readonly prisma: PrismaClient) {}

  async create(input: CreateCustomerInput) {
    return this.prisma.customer.create({
      data: {
        code: input.code,
        name: input.name,
        phone: input.phone,
        email: input.email ?? null,
        usernameHotspot: input.usernameHotspot ?? null,
        address: input.address,
        dueDay: input.dueDay ?? null,
        status: "AKTIF",
      },
    });
  }

  async findAll(query: { status?: string; q?: string; limit?: number; offset?: number }) {
    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.q) {
      where.OR = [
        { name: { contains: query.q, mode: "insensitive" } },
        { code: { contains: query.q, mode: "insensitive" } },
        { phone: { contains: query.q } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        take: query.limit ?? 50,
        skip: query.offset ?? 0,
        orderBy: { code: "asc" },
        include: { subscriptions: { where: { endDate: null }, include: { package: true } } },
      }),
      this.prisma.customer.count({ where }),
    ]);
    return { data, total };
  }

  async findById(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        subscriptions: { include: { package: true } },
        invoices: { orderBy: { issuedAt: "desc" }, take: 10 },
      },
    });
    if (!customer) {
      throw new Error("NOT_FOUND");
    }
    return customer;
  }

  async update(id: string, input: UpdateCustomerInput) {
    await this.findById(id);
    return this.prisma.customer.update({
      where: { id },
      data: {
        name: input.name,
        phone: input.phone,
        email: input.email,
        usernameHotspot: input.usernameHotspot,
        address: input.address,
        dueDay: input.dueDay,
      },
    });
  }

  async changeStatus(id: string, status: "AKTIF" | "ISOLIR" | "BERHENTI") {
    await this.findById(id);
    return this.prisma.customer.update({
      where: { id },
      data: { status },
    });
  }
}
