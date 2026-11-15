import { Module } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { LedgerService } from "../ledger/ledger.service";
import { AuthModule } from "../auth/auth.module";
import { PaymentsController } from "./payments.controller";

@Module({
  imports: [AuthModule],
  controllers: [PaymentsController],
  providers: [LedgerService, PrismaClient],
})
export class PaymentsModule {}
