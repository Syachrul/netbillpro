import { Module } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { LedgerService } from "./ledger.service";

@Module({
  providers: [LedgerService, PrismaClient],
  exports: [LedgerService],
})
export class LedgerModule {}
