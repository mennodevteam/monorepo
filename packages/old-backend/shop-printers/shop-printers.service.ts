import { ShopPrinter } from '@menno/types';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shop } from '../shops/entities/shop';

@Injectable()
export class ShopPrintersService {
  constructor(
    @InjectRepository(ShopPrinter)
    private shopPrintersService: Repository<ShopPrinter>
  ) {}

  async findByShopId(shopId: string): Promise<ShopPrinter[]> {
    const shopPrinters = await this.shopPrintersService.find({
      where: {
        shop: { id: shopId },
      },
      relations: ['shop'],
    });

    for (const s of shopPrinters) {
      s.shop = <Shop>{ id: s.shop.id };
    }

    return shopPrinters;
  }

  async save(printer: ShopPrinter): Promise<ShopPrinter> {
    const exist = await this.shopPrintersService.findOne({
      where: {
        name: printer.name,
        shop: { id: printer.shop.id },
      },
      withDeleted: true,
    });
    if (exist) {
      this.shopPrintersService.restore(exist.id);
      printer.id = exist.id;
    }
    return this.shopPrintersService.save(printer);
  }

  async remove(printerId: string): Promise<void> {
    await this.shopPrintersService.softDelete(printerId);
  }
}
