import { Module } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { LedgerService } from "../ledger/ledger.service";
import { BillingService } from "./billing.service";

@Module({
  providers: [BillingService, LedgerService, PrismaClient],
  exports: [BillingService],
})
export class BillingModule {}
