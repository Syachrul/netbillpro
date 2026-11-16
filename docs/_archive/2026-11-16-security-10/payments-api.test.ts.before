import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { Test } from "@nestjs/testing";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { PrismaClient } from "@prisma/client";
import { startTestContext, stopTestContext, TestContext } from "./setup-containers";
import { createCustomer, createInvoice, truncateAll } from "./fixtures";
import { rupiah } from "@netbill/shared";
import { AppModule } from "../src/app.module";
import { AuthService } from "../src/modules/auth/auth.service";

const DUMMY_ADMIN_ID = "00000000-0000-0000-0000-000000000001";

describe("C5.2 Payments API (HTTP)", () => {
  let ctx: TestContext;
  let app: NestFastifyApplication;
  let authService: AuthService;
  let adminToken: string;

  beforeAll(async () => {
    ctx = await startTestContext();
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaClient)
      .useValue(ctx.prisma)
      .compile();
    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    app.setGlobalPrefix("api/v1");
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    authService = moduleRef.get(AuthService);
  }, 120_000);

  afterAll(async () => {
    await app.close();
    await stopTestContext();
  }, 30_000);

  beforeEach(async () => {
    await truncateAll(ctx.prisma);

    // Seed ADMIN user with explicit DUMMY_ADMIN_ID (matches recordedBy in payload)
    const hash = await authService.hashPassword("secret123");
    await ctx.prisma.user.create({
      data: {
        id: DUMMY_ADMIN_ID,
        role: "ADMIN",
        name: "Admin Test",
        email: "admin@test.local",
        passwordHash: hash,
      },
    });

    // Login to obtain bearer token
    const loginRes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { email: "admin@test.local", password: "secret123" },
    });
    adminToken = JSON.parse(loginRes.payload).accessToken;
  });

  it("POST /payments tanpa Idempotency-Key -> 400", async () => {
    const c = await createCustomer(ctx.prisma);
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/payments",
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        customerId: c.id,
        amount: 150000,
        method: "TUNAI",
        paidAt: new Date().toISOString(),
        recordedBy: DUMMY_ADMIN_ID,
      },
    });
    expect(res.statusCode).toBe(400);
  });

  it("POST /payments dengan Idempotency-Key -> 201", async () => {
    const c = await createCustomer(ctx.prisma);
    const inv = await createInvoice(ctx.prisma, c.id, { total: rupiah(150000) });
    await ctx.prisma.ledgerEntry.create({
      data: {
        customerId: c.id,
        type: "TAGIHAN",
        debit: rupiah(150000),
        kredit: 0n,
        balanceAfter: -rupiah(150000),
        refType: "INVOICE",
        refId: inv.id,
      },
    });

    const res = await app.inject({
      method: "POST",
      url: "/api/v1/payments",
      headers: {
        authorization: `Bearer ${adminToken}`,
        "idempotency-key": "K1",
      },
      payload: {
        customerId: c.id,
        amount: 150000,
        method: "TUNAI",
        paidAt: new Date().toISOString(),
        recordedBy: DUMMY_ADMIN_ID,
      },
    });

    if (res.statusCode !== 201) {
      console.error("Unexpected:", res.statusCode, res.payload);
    }
    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.payload);
    expect(body.balance).toBe("0");
  });

  it("POST /payments payload beda key sama -> 409", async () => {
    const c = await createCustomer(ctx.prisma);

    await app.inject({
      method: "POST",
      url: "/api/v1/payments",
      headers: {
        authorization: `Bearer ${adminToken}`,
        "idempotency-key": "K2",
      },
      payload: {
        customerId: c.id,
        amount: 100000,
        method: "TUNAI",
        paidAt: new Date().toISOString(),
        recordedBy: DUMMY_ADMIN_ID,
      },
    });

    const res = await app.inject({
      method: "POST",
      url: "/api/v1/payments",
      headers: {
        authorization: `Bearer ${adminToken}`,
        "idempotency-key": "K2",
      },
      payload: {
        customerId: c.id,
        amount: 999000,
        method: "TUNAI",
        paidAt: new Date().toISOString(),
        recordedBy: DUMMY_ADMIN_ID,
      },
    });

    if (res.statusCode !== 409) {
      console.error("Unexpected:", res.statusCode, res.payload);
    }
    expect(res.statusCode).toBe(409);
  });
}, 180_000);
