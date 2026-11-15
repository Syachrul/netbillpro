import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { Test } from "@nestjs/testing";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { PrismaClient } from "@prisma/client";
import { startTestContext, stopTestContext, TestContext } from "./setup-containers";
import { truncateAll } from "./fixtures";
import { AppModule } from "../src/app.module";
import { AuthService } from "../src/modules/auth/auth.service";

describe("C5.6 Customers API (HTTP)", () => {
  let ctx: TestContext;
  let app: NestFastifyApplication;
  let authService: AuthService;
  let adminToken: string;
  let kolektorToken: string;

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
    const adminHash = await authService.hashPassword("secret123");
    await ctx.prisma.user.create({ data: { role: "ADMIN", name: "Admin", email: "admin@test.local", passwordHash: adminHash } });
    const kolektorHash = await authService.hashPassword("secret123");
    await ctx.prisma.user.create({ data: { role: "KOLEKTOR", name: "Kolektor", email: "kolektor@test.local", passwordHash: kolektorHash } });

    const adminRes = await app.inject({ method: "POST", url: "/api/v1/auth/login", payload: { email: "admin@test.local", password: "secret123" } });
    adminToken = JSON.parse(adminRes.payload).accessToken;

    const kolRes = await app.inject({ method: "POST", url: "/api/v1/auth/login", payload: { email: "kolektor@test.local", password: "secret123" } });
    kolektorToken = JSON.parse(kolRes.payload).accessToken;
  });

  it("POST /customers sebagai ADMIN -> 201", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/customers",
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { code: "CUST-0001", name: "Budi", phone: "628111111111", address: "Jl. Test 1" },
    });
    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.payload);
    expect(body.code).toBe("CUST-0001");
    expect(body.status).toBe("AKTIF");
  });

  it("POST /customers sebagai KOLEKTOR -> 403", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/customers",
      headers: { authorization: `Bearer ${kolektorToken}` },
      payload: { code: "CUST-0002", name: "Test", phone: "628111111112", address: "Jl. Test 2" },
    });
    expect(res.statusCode).toBe(403);
  });

  it("GET /customers sebagai KOLEKTOR -> 200 (list)", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/customers",
      headers: { authorization: `Bearer ${kolektorToken}` },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it("GET /customers/:id dengan id tidak ada -> 404", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/customers/00000000-0000-0000-0000-000000000000",
      headers: { authorization: `Bearer ${adminToken}` },
    });
    expect(res.statusCode).toBe(404);
  });

  it("POST /customers/:id/status -> update status", async () => {
    const create = await app.inject({
      method: "POST",
      url: "/api/v1/customers",
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { code: "CUST-0099", name: "Siti", phone: "628111111999", address: "Jl. Test 99" },
    });
    const created = JSON.parse(create.payload);

    const res = await app.inject({
      method: "POST",
      url: `/api/v1/customers/${created.id}/status`,
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { status: "ISOLIR" },
    });
    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.payload);
    expect(body.status).toBe("ISOLIR");
  });
}, 180_000);
