import { Injectable, Inject } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { rupiah, Rupiah } from "@netbill/shared";

export interface CreatePackageInput {
  code: string;
  name: string;
  price: number;
  installFee?: number;
  speedDown?: number;
  speedUp?: number;
  description?: string;
}

export interface UpdatePackageInput {
  name?: string;
  price?: number;
  installFee?: number;
  speedDown?: number;
  speedUp?: number;
  description?: string;
}

@Injectable()
export class PackagesService {
  constructor(@Inject(PrismaClient) private readonly prisma: PrismaClient) {}

  async create(input: CreatePackageInput) {
    return this.prisma.package.create({
      data: {
        code: input.code,
        name: input.name,
        price: rupiah(input.price),
        installFee: rupiah(input.installFee ?? 0),
        speedDown: input.speedDown ?? null,
        speedUp: input.speedUp ?? null,
        description: input.description ?? null,
        status: "AKTIF",
      },
    });
  }

  async findAll(query: { status?: string; limit?: number; offset?: number }) {
    const where: any = {};
    if (query.status) where.status = query.status;
    const [data, total] = await Promise.all([
      this.prisma.package.findMany({
        where,
        take: query.limit ?? 50,
        skip: query.offset ?? 0,
        orderBy: { code: "asc" },
      }),
      this.prisma.package.count({ where }),
    ]);
    return { data, total };
  }

  async findById(id: string) {
    const pkg = await this.prisma.package.findUnique({ where: { id } });
    if (!pkg) throw new Error("NOT_FOUND");
    return pkg;
  }

  async update(id: string, input: UpdatePackageInput) {
    await this.findById(id);
    return this.prisma.package.update({
      where: { id },
      data: {
        name: input.name,
        price: input.price !== undefined ? rupiah(input.price) : undefined,
        installFee: input.installFee !== undefined ? rupiah(input.installFee) : undefined,
        speedDown: input.speedDown,
        speedUp: input.speedUp,
        description: input.description,
      },
    });
  }

  async archive(id: string) {
    await this.findById(id);
    const activeSubs = await this.prisma.subscription.count({
      where: { packageId: id, endDate: null },
    });
    if (activeSubs > 0) {
      throw new Error("PACKAGE_IN_USE");
    }
    return this.prisma.package.update({
      where: { id },
      data: { status: "ARSIP" },
    });
  }
}
