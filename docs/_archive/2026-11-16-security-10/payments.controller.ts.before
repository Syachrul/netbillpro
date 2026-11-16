import { Controller, Post, Body, Headers, HttpException, HttpStatus, Inject, UseGuards } from "@nestjs/common";
import { LedgerService } from "../ledger/ledger.service";
import { rupiah } from "@netbill/shared";
import { JwtGuard } from "../auth/jwt.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";

@Controller("payments")
@UseGuards(JwtGuard, RolesGuard)
export class PaymentsController {
  constructor(@Inject(LedgerService) private readonly ledgerService: LedgerService) {}

  @Post()
  @Roles("OWNER", "ADMIN", "KOLEKTOR")
  async create(@Body() body: any, @Headers("idempotency-key") idempotencyKey: string) {
    if (!idempotencyKey) {
      throw new HttpException("Idempotency-Key header is required", HttpStatus.BAD_REQUEST);
    }
    if (!body.recordedBy) {
      throw new HttpException("recordedBy is required", HttpStatus.BAD_REQUEST);
    }
    try {
      const result = await this.ledgerService.postPayment({
        customerId: body.customerId,
        amount: rupiah(body.amount),
        method: body.method,
        paidAt: new Date(body.paidAt),
        invoiceId: body.invoiceId,
        idempotencyKey,
        recordedBy: body.recordedBy,
      });
      return { paymentId: result.paymentId, balance: result.balance.toString() };
    } catch (e: any) {
      if (e.message === "IDEMPOTENCY_CONFLICT") {
        throw new HttpException(e.message, HttpStatus.CONFLICT);
      }
      throw new HttpException(e.message, HttpStatus.UNPROCESSABLE_ENTITY);
    }
  }
}
