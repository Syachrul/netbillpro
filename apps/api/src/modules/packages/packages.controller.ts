import { Controller, Get, Post, Body, Param, Query, Patch, HttpException, HttpStatus, Inject, UseGuards } from "@nestjs/common";
import { PackagesService } from "./packages.service";
import { JwtGuard } from "../auth/jwt.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";

@Controller("packages")
@UseGuards(JwtGuard, RolesGuard)
export class PackagesController {
  constructor(@Inject(PackagesService) private readonly packagesService: PackagesService) {}

  @Post()
  @Roles("OWNER", "ADMIN")
  async create(@Body() body: any) {
    try {
      return await this.packagesService.create(body);
    } catch (e: any) {
      throw new HttpException(e.message, HttpStatus.UNPROCESSABLE_ENTITY);
    }
  }

  @Get()
  @Roles("OWNER", "ADMIN", "KOLEKTOR")
  async findAll(@Query("status") status?: string, @Query("limit") limit?: string, @Query("offset") offset?: string) {
    return this.packagesService.findAll({
      status,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  @Get(":id")
  @Roles("OWNER", "ADMIN", "KOLEKTOR")
  async findById(@Param("id") id: string) {
    try {
      return await this.packagesService.findById(id);
    } catch (e: any) {
      throw new HttpException(e.message, HttpStatus.NOT_FOUND);
    }
  }

  @Patch(":id")
  @Roles("OWNER", "ADMIN")
  async update(@Param("id") id: string, @Body() body: any) {
    try {
      return await this.packagesService.update(id, body);
    } catch (e: any) {
      throw new HttpException(e.message, e.message === "NOT_FOUND" ? HttpStatus.NOT_FOUND : HttpStatus.UNPROCESSABLE_ENTITY);
    }
  }

  @Post(":id/archive")
  @Roles("OWNER", "ADMIN")
  async archive(@Param("id") id: string) {
    try {
      return await this.packagesService.archive(id);
    } catch (e: any) {
      const status = e.message === "NOT_FOUND" ? HttpStatus.NOT_FOUND : e.message === "PACKAGE_IN_USE" ? HttpStatus.CONFLICT : HttpStatus.UNPROCESSABLE_ENTITY;
      throw new HttpException(e.message, status);
    }
  }
}
