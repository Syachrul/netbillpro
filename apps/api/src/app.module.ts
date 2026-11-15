import { Module } from "@nestjs/common";
import { HealthModule } from "./health/health.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { AuthModule } from "./modules/auth/auth.module";

@Module({
  imports: [HealthModule, AuthModule, PaymentsModule],
})
export class AppModule {}
