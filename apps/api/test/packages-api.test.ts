import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { Test } from "@nestjs/testing";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { PrismaClient } from "@prisma/client";
import { startTestContext, stopTestContext, TestContext } from "./setup-containers";
import { truncateAll } from "./fixtures";
import { AppModule } from "../src/app.module";
import { AuthService } from "../src/modules/auth/auth.service";

describe("C5.7 Packages API (HTTP)", () => {
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
    const hash = await authService.hashPassword("secret123");
    await ctx.prisma.user.create({ data: { role: "ADMIN", name: "Admin", email: "admin@test.local", passwordHash: hash } });
    const res = await app.inject({ method: "POST", url: "/api/v1/auth/login", payload: { email: "admin@test.local", password: "secret123" } });
    adminToken = JSON.parse(res.payload).accessToken;
  });

  it("POST /packages -> 201", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/packages",
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { code: "PKT-10M", name: "Paket 10 Mbps", price: 150000, installFee: 100000 },
    });
    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.payload);
    expect(body.code).toBe("PKT-10M");
    expect(body.price).toBe("150000");
    expect(body.status).toBe("AKTIF");
  });

  it("GET /packages -> list", async () => {
    await app.inject({ method: "POST", url: "/api/v1/packages", headers: { authorization: `Bearer ${adminToken}` }, payload: { code: "PKT-1", name: "P1", price: 100000 } });
    const res = await app.inject({ method: "GET", url: "/api/v1/packages", headers: { authorization: `Bearer ${adminToken}` } });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.total).toBe(1);
  });

  it("POST /packages/:id/archive -> ARSIP", async () => {
    const create = await app.inject({ method: "POST", url: "/api/v1/packages", headers: { authorization: `Bearer ${adminToken}` }, payload: { code: "PKT-OLD", name: "Old", price: 50000 } });
    const pkg = JSON.parse(create.payload);
    const res = await app.inject({ method: "POST", url: `/api/v1/packages/${pkg.id}/archive`, headers: { authorization: `Bearer ${adminToken}` } });
    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.payload);
    expect(body.status).toBe("ARSIP");
  });
}, 180_000);
