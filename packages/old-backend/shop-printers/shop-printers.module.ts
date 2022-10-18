import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShopPrintersController } from './shop-printers.controller';
import { ShopPrintersService } from './shop-printers.service';
import { PrintViewsService } from './print-views.service';
import { PrintViewsController } from './print-views.controller';
import { PrintActionsController } from './print-actions.controller';
import { PrintActionsService } from './print-actions.service';
import { ClientsModule } from '@nestjs/microservices';
import { ShopPrinterSchema } from './schemas/shop-printer.schema';
import { PrintActionSchema } from './schemas/print-action.schema';
import { ShopPrintViewSchema } from './schemas/shop-print-view.schema';
import { OrderSchema } from '../orders/schemas/order.schema';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ShopPrinterSchema,
      PrintActionSchema,
      ShopPrintViewSchema,
      OrderSchema,
    ]),
  ],
  controllers: [
    ShopPrintersController,
    PrintViewsController,
    PrintActionsController,
  ],
  providers: [ShopPrintersService, PrintViewsService, PrintActionsService],
  exports: [PrintViewsService, PrintActionsService],
})
export class ShopPrintersModule {}
