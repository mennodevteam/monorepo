import { ShopPrinter } from '@menno/types';
import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { ShopPrintersService } from './shop-printers.service';

@Controller('shop-printers')
export class ShopPrintersController {
  constructor(private shopPrintersService: ShopPrintersService) {}

  @MessagePattern('shopPrinters/findByShopId')
  findByShopId(shopId: string): Promise<ShopPrinter[]> {
    return this.shopPrintersService.findByShopId(shopId);
  }

  @MessagePattern('shopPrinters/save')
  save(printer: ShopPrinter): Promise<ShopPrinter> {
    return this.shopPrintersService.save(printer);
  }

  @MessagePattern('shopPrinters/remove')
  remove(printerId: string): Promise<void> {
    return this.shopPrintersService.remove(printerId);
  }
}
