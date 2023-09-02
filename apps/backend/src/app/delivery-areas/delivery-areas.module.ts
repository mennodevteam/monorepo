import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SchemasModule } from '../core/schemas.module';
import { DeliveryAreasController } from './delivery-areas.controller';

@Module({
  imports: [SchemasModule, AuthModule],
  controllers: [DeliveryAreasController],
})
export class DeliveryAreasModule {}
