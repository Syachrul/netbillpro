import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PrismaClient } from "@prisma/client";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { JwtGuard } from "./jwt.guard";
import { RolesGuard } from "./roles.guard";

const JWT_SECRET = process.env.JWT_SECRET ?? "netbill-dev-secret-change-in-prod";

@Module({
  imports: [
    JwtModule.register({
      secret: JWT_SECRET,
      signOptions: { expiresIn: "15m" },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtGuard, RolesGuard, PrismaClient],
  exports: [AuthService, JwtGuard, RolesGuard, JwtModule],
})
export class AuthModule {}
