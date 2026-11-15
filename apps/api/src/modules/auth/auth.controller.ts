import { Controller, Post, Body, HttpException, HttpStatus, Inject } from "@nestjs/common";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Post("login")
  async login(@Body() body: { email: string; password: string }) {
    try {
      return await this.authService.login(body.email, body.password);
    } catch (e: any) {
      throw new HttpException(e.message, HttpStatus.UNAUTHORIZED);
    }
  }
}
