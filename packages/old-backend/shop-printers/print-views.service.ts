import { ShopPrinter, ShopPrintView } from '@menno/types';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

@Injectable()
export class PrintViewsService {
  constructor(
    @InjectRepository(ShopPrinter)
    private shopPrintersService: Repository<ShopPrinter>,
    @InjectRepository(ShopPrintView)
    private printViewsService: Repository<ShopPrintView>
  ) {}

  async findByShopId(shopId: string): Promise<ShopPrintView[]> {
    const printers = await this.shopPrintersService.find({
      where: {
        shop: { id: shopId },
      },
    });
    return this.printViewsService.find({
      where: {
        printer: In(printers.map((x) => x.id)),
      },
      relations: ['printer'],
    });
  }

  async save(view: ShopPrintView): Promise<ShopPrintView> {
    return this.printViewsService.save(view);
  }

  async remove(printerId: string): Promise<void> {
    await this.printViewsService.softDelete(printerId);
  }
}
