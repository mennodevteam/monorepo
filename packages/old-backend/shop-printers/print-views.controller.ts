import { ShopPrintView } from '@menno/types';
import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { PrintViewsService } from './print-views.service';

@Controller('print-views')
export class PrintViewsController {
  constructor(private printViewsService: PrintViewsService) {}

  @MessagePattern('shopPrintViews/findByShopId')
  findByShopId(shopId: string): Promise<ShopPrintView[]> {
    return this.printViewsService.findByShopId(shopId);
  }

  @MessagePattern('shopPrintViews/save')
  save(printer: ShopPrintView): Promise<ShopPrintView> {
    return this.printViewsService.save(printer);
  }

  @MessagePattern('shopPrintViews/remove')
  remove(printerId: string): Promise<void> {
    return this.printViewsService.remove(printerId);
  }
}
