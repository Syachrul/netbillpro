import { Module } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { LedgerService } from "../ledger/ledger.service";
import { PaymentsController } from "./payments.controller";

@Module({
  controllers: [PaymentsController],
  providers: [LedgerService, PrismaClient],
})
export class PaymentsModule {}
