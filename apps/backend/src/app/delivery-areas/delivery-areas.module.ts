import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CoreModule } from '../core/core.module';
import { DeliveryAreasController } from './delivery-areas.controller';

@Module({
  imports: [CoreModule, AuthModule],
  controllers: [DeliveryAreasController],
})
export class DeliveryAreasModule {}
