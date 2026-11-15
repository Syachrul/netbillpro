import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { Test } from "@nestjs/testing";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { PrismaClient } from "@prisma/client";
import { startTestContext, stopTestContext, TestContext } from "./setup-containers";
import { truncateAll } from "./fixtures";
import { AppModule } from "../src/app.module";
import { AuthService } from "../src/modules/auth/auth.service";

describe("C5.5 Auth API (HTTP)", () => {
  let ctx: TestContext;
  let app: NestFastifyApplication;
  let authService: AuthService;

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
  });

  async function seedAdmin(): Promise<void> {
    const hash = await authService.hashPassword("secret123");
    console.log("[SEED] hash:", hash.substring(0, 30) + "...");
    const user = await ctx.prisma.user.create({
      data: {
        role: "ADMIN",
        name: "Admin Test",
        email: "admin@test.local",
        passwordHash: hash,
      },
    });
    console.log("[SEED] user created:", user.id, user.email, user.isActive);
  }

  it("POST /auth/login dengan kredensial benar -> 200/201", async () => {
    await seedAdmin();
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { email: "admin@test.local", password: "secret123" },
    });
    if (res.statusCode !== 200 && res.statusCode !== 201) {
      console.error("[LOGIN FAILED]", res.statusCode, res.payload);
    }
    expect([200, 201]).toContain(res.statusCode);
    const body = JSON.parse(res.payload);
    expect(body.accessToken).toBeTruthy();
    expect(body.user.role).toBe("ADMIN");
  });

  it("POST /auth/login dengan password salah -> 401", async () => {
    await seedAdmin();
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { email: "admin@test.local", password: "wrong" },
    });
    expect(res.statusCode).toBe(401);
  });

  it("POST /payments tanpa token -> 401", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/payments",
      headers: { "idempotency-key": "K-NOAUTH" },
      payload: {
        customerId: "00000000-0000-0000-0000-000000000001",
        amount: 1000,
        method: "TUNAI",
        paidAt: new Date().toISOString(),
      },
    });
    expect(res.statusCode).toBe(401);
  });
}, 180_000);
