import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { z } from 'zod';
import { WorkerModule } from './worker.module';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  WORKER_PORT: z.coerce.number().int().positive().default(3001),
  TZ: z.string().default('Asia/Jakarta'),
});

async function bootstrap(): Promise<void> {
  const env = EnvSchema.parse(process.env);
  const app = await NestFactory.create<NestFastifyApplication>(
    WorkerModule,
    new FastifyAdapter(),
  );
  app.setGlobalPrefix('api/v1');
  app.enableShutdownHooks();

  await app.listen(env.WORKER_PORT, '0.0.0.0');
  console.log(`[worker] listening on http://0.0.0.0:${env.WORKER_PORT}/api/v1`);
}

void bootstrap();
