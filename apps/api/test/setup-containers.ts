import { PrismaClient } from "@prisma/client";
import { PostgreSqlContainer, StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { execSync } from "node:child_process";
import path from "node:path";

/**
 * Testcontainers helper (C2-1).
 *
 * - Start 1 Postgres container per test file (Opsi A).
 * - Prisma Client memakai dynamic URL dari container (bukan .env).
 * - Migrasi Prisma dijalankan sekali setelah container siap.
 */

export interface TestContext {
  container: StartedPostgreSqlContainer;
  prisma: PrismaClient;
  connectionUri: string;
}

let ctx: TestContext | null = null;

export async function startTestContext(): Promise<TestContext> {
  if (ctx) return ctx;

  const container = await new PostgreSqlContainer("postgres:16-alpine")
    .withDatabase("netbill_test")
    .withUsername("netbill")
    .withPassword("netbill_test")
    .withCommand(["postgres", "-c", "timezone=Asia/Jakarta"])
    .start();

  const connectionUri = container.getConnectionUri();

  // Jalankan migrasi Prisma terhadap container (sekali).
  const apiDir = path.resolve(__dirname, "..");
  execSync("npx prisma migrate deploy", {
    cwd: apiDir,
    env: { ...process.env, DATABASE_URL: connectionUri },
    stdio: "pipe",
  });

  const prisma = new PrismaClient({
    datasources: { db: { url: connectionUri } },
  });

  ctx = { container, prisma, connectionUri };
  return ctx;
}

export async function stopTestContext(): Promise<void> {
  if (!ctx) return;
  await ctx.prisma.$disconnect();
  await ctx.container.stop();
  ctx = null;
}
