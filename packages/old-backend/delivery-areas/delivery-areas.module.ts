import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeliveryAreasController } from './delivery-areas.controller';
import { DeliveryAreasService } from './delivery-areas.service';
import { DeliveryAreaSchema } from './schemas/delivery-area.schema';

@Module({
  imports: [TypeOrmModule.forFeature([DeliveryAreaSchema])],
  controllers: [DeliveryAreasController],
  providers: [DeliveryAreasService],
  exports: [DeliveryAreasService],
})
export class DeliveryAreasModule {}
