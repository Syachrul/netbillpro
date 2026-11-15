import { Module } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { AuthModule } from "../auth/auth.module";
import { CustomersController } from "./customers.controller";
import { CustomersService } from "./customers.service";

@Module({
  imports: [AuthModule],
  controllers: [CustomersController],
  providers: [CustomersService, PrismaClient],
  exports: [CustomersService],
})
export class CustomersModule {}
