import { Controller, Get, Post, Body, Param, Query, Patch, HttpException, HttpStatus, Inject, UseGuards } from "@nestjs/common";
import { CustomersService } from "./customers.service";
import { JwtGuard } from "../auth/jwt.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";

@Controller("customers")
@UseGuards(JwtGuard, RolesGuard)
export class CustomersController {
  constructor(@Inject(CustomersService) private readonly customersService: CustomersService) {}

  @Post()
  @Roles("OWNER", "ADMIN")
  async create(@Body() body: any) {
    try {
      return await this.customersService.create(body);
    } catch (e: any) {
      throw new HttpException(e.message, HttpStatus.UNPROCESSABLE_ENTITY);
    }
  }

  @Get()
  @Roles("OWNER", "ADMIN", "KOLEKTOR")
  async findAll(
    @Query("status") status?: string,
    @Query("q") q?: string,
    @Query("limit") limit?: string,
    @Query("offset") offset?: string
  ) {
    return this.customersService.findAll({
      status,
      q,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  @Get(":id")
  @Roles("OWNER", "ADMIN", "KOLEKTOR")
  async findById(@Param("id") id: string) {
    try {
      return await this.customersService.findById(id);
    } catch (e: any) {
      throw new HttpException(e.message, HttpStatus.NOT_FOUND);
    }
  }

  @Patch(":id")
  @Roles("OWNER", "ADMIN")
  async update(@Param("id") id: string, @Body() body: any) {
    try {
      return await this.customersService.update(id, body);
    } catch (e: any) {
      throw new HttpException(e.message, e.message === "NOT_FOUND" ? HttpStatus.NOT_FOUND : HttpStatus.UNPROCESSABLE_ENTITY);
    }
  }

  @Post(":id/status")
  @Roles("OWNER", "ADMIN")
  async changeStatus(@Param("id") id: string, @Body() body: { status: "AKTIF" | "ISOLIR" | "BERHENTI" }) {
    try {
      return await this.customersService.changeStatus(id, body.status);
    } catch (e: any) {
      throw new HttpException(e.message, e.message === "NOT_FOUND" ? HttpStatus.NOT_FOUND : HttpStatus.UNPROCESSABLE_ENTITY);
    }
  }
}
