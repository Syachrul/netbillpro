import { Injectable, Inject } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";

@Injectable()
export class AuthService {
  constructor(
    @Inject(PrismaClient) private readonly prisma: PrismaClient,
    @Inject(JwtService) private readonly jwtService: JwtService
  ) {}

  async hashPassword(password: string): Promise<string> {
    return argon2.hash(password);
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      throw new Error("AUTH_INVALID_CREDENTIALS");
    }
    const valid = await argon2.verify(user.passwordHash, password);
    if (!valid) {
      throw new Error("AUTH_INVALID_CREDENTIALS");
    }
    const payload = { sub: user.id, role: user.role, name: user.name };
    const accessToken = await this.jwtService.signAsync(payload);
    return {
      accessToken,
      user: { id: user.id, role: user.role, name: user.name, email: user.email },
    };
  }
}
