import { Module } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { AuthModule } from "../auth/auth.module";
import { PackagesController } from "./packages.controller";
import { PackagesService } from "./packages.service";

@Module({
  imports: [AuthModule],
  controllers: [PackagesController],
  providers: [PackagesService, PrismaClient],
  exports: [PackagesService],
})
export class PackagesModule {}
