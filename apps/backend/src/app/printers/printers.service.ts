import { OldTypes } from '@menno/old-types';
import {
  Order,
  PrintAction,
  PrintActionData,
  PrintOrderDto,
  PrintType,
  Shop,
  ShopPrinter,
  ShopPrintView,
  User,
} from '@menno/types';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

@Injectable()
export class PrintersService {
  constructor(
    @InjectRepository(Order)
    private ordersRepo: Repository<Order>,
    @InjectRepository(Shop)
    private shopsRepo: Repository<Shop>,
    @InjectRepository(ShopPrinter)
    private shopPrintersRepo: Repository<ShopPrinter>,
    @InjectRepository(ShopPrintView)
    private printViewsRepo: Repository<ShopPrintView>,
    @InjectRepository(PrintAction)
    private printActionsRepo: Repository<PrintAction>
  ) {}
  async printOrder(dto: PrintOrderDto): Promise<PrintAction[]> {
    const order = await this.ordersRepo.findOne({
      where: { id: dto.orderId },
      relations: [
        'shop',
        'items.product',
        'items.product.category',
        'mergeTo',
        'reviews',
        'customer',
        'creator',
        'address',
      ],
      withDeleted: true,
    });
    if (!order?.items) return [];
    order.items = order.items?.filter((x) => !x.isAbstract || x.price != 0);
    const printViews = await this.printViewsRepo.find({
      where: { id: In(dto.prints.map((x) => x.printViewId)) },
      relations: ['printer'],
    });

    const tableName =
      order.details.table && order.shop.details?.tables?.find((x) => x.code === order.details.table)?.title;

    const notes: string[] = [];
    if (order.note) notes.push(order.note);
    for (const item of order.items) {
      if (item.details && item.details.description) notes.push(`${item.title}: ${item.details.description}`);
    }
    const changesDescriptions: string[] = [];
    if (order.details.itemChanges && order.details.itemChanges.length) {
      for (let i = 0; i < order.details.itemChanges.length; i++) {
        const change = order.details.itemChanges[i];
        changesDescriptions.push(
          `اصلاحیه ${i + 1}: ${change.map((x) => `\n${x.title} ${x.change > 0 ? '+' + x.change : x.change}`)}`
        );
      }
    }

    const actions: PrintAction[] = [];
    for (const p of dto.prints) {
      const view = printViews.find((x) => x.id === p.printViewId);
      let descriptions = [];
      if (notes && notes.length) descriptions = descriptions.concat(notes);
      if (
        (view.type === PrintType.Kitchen || view.type === PrintType.KitchenLarge) &&
        changesDescriptions &&
        changesDescriptions.length
      ) {
        descriptions = descriptions.concat(changesDescriptions);
      }
      actions.push(<PrintAction>{
        count: p.count || view.defaultCount || 1,
        data: {
          currency: order.details.currency,
          customerAddress: order.address?.description,
          customerName: order.customer ? User.fullName(order.customer) : undefined,
          customerPhone: order.customer ? order.customer.mobilePhone : undefined,
          date: order.createdAt,
          descriptions,
          items:
            view.includeProductCategoryIds && view.includeProductCategoryIds.length
              ? <any>(
                  order.items.filter(
                    (x) =>
                      x.product &&
                      x.product.category &&
                      view.includeProductCategoryIds.indexOf(x.product.category.id) > -1
                  )
                )
              : <any>order.items,
          qNumber: order.qNumber,
          shopAddress: order.shop.address,
          shopName: order.shop.title,
          shopPhones: order.shop.phones,
          shopUrl: Shop.appLink(order.shop, process.env.APP_ORIGIN),
          table: order.details.table && `${order.details.table} ${tableName}`.trim(),
          totalPrice: order.totalPrice,
          type: order.type,
        },
        printerName: view.printer.name,
        printerTitle: view.title,
        shop: { id: order.shop.id },
        waitForLocal: dto.waitForLocal,
        order: { id: order.id },
        printView: { id: view.id },
        type: view.type,
      });
    }
    return this.printActionsRepo.save(actions);
  }

  async printData(data: PrintActionData, printViewId: string, shopId: string) {
    const view = await this.printViewsRepo.findOne({ where: { id: printViewId }, relations: ['printer'] });
    const action = {
      count: 1,
      data,
      printerName: view.printer.name,
      printerTitle: view.title,
      printView: { id: view.id },
      type: view.type,
      shop: { id: shopId },
    } as PrintAction;

    return this.printActionsRepo.save(action);
  }
}
