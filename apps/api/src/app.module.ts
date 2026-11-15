import "./common/bigint-serializer";
import { Module } from "@nestjs/common";
import { HealthModule } from "./health/health.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { AuthModule } from "./modules/auth/auth.module";
import { CustomersModule } from "./modules/customers/customers.module";
import { PackagesModule } from "./modules/packages/packages.module";

@Module({
  imports: [HealthModule, AuthModule, PaymentsModule, CustomersModule, PackagesModule],
})
export class AppModule {}
