import {
  Order,
  PrintAction,
  PrintOderDto,
  PrintType,
  ShopPrintView,
  User,
} from '@menno/types';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FindOptionsWhere,
  In,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';

@Injectable()
export class PrintActionsService {
  constructor(
    @InjectRepository(PrintAction)
    private printActionsRepository: Repository<PrintAction>,
    @InjectRepository(ShopPrintView)
    private shopPrintViewsRepository: Repository<ShopPrintView>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @Inject(UserMicroservice.name) private userMicroservice: ClientProxy
  ) {}

  async printOrder(dto: PrintOderDto): Promise<PrintAction[]> {
    const order = await this.orderRepository.findOne({
      where: {
        id: dto.orderId,
      },
      relations: [
        'items',
        'shop',
        'items.product',
        'items.product.category',
        'mergeTo',
        'reviews',
        'customer',
        'creator',
      ],
      withDeleted: true,
    });
    order.items = order.items.filter((x) => !x.isAbstract || x.price != 0);
    const printViews = await this.shopPrintViewsRepository.find({
      where: { id: In(dto.prints.map((x) => x.printViewId)) },
      relations: ['printer'],
    });

    const notes: string[] = [];
    if (order.details.note) notes.push(order.details.note);
    for (const item of order.items) {
      if (item.details && item.details.description)
        notes.push(`${item.title}: ${item.details.description}`);
      if (item.isAbstract) {
        switch (item.title) {
          case 'manualCost':
            item.title = 'هزینه مازاد';
            break;

          case 'manualDiscount':
            item.title = 'تخفیف';
            break;

          case 'discountCoupon':
            item.title = 'کد تخفیف';
            break;

          case 'deliveryCost':
            item.title = 'هزینه ارسال';
            break;
        }
      }
    }
    const changesDescriptions: string[] = [];
    if (order.details.itemChanges && order.details.itemChanges.length) {
      for (let i = 0; i < order.details.itemChanges.length; i++) {
        const change = order.details.itemChanges[i];
        changesDescriptions.push(
          `اصلاحیه ${i + 1}: ${change.map(
            (x) => `\n${x.title} ${x.change > 0 ? '+' + x.change : x.change}`
          )}`
        );
      }
    }

    const actions: PrintAction[] = [];
    for (const p of dto.prints) {
      const view = printViews.find((x) => x.id === p.printViewId);
      let descriptions = [];
      if (notes && notes.length) descriptions = descriptions.concat(notes);
      if (
        (view.type === PrintType.Kitchen ||
          view.type === PrintType.KitchenLarge) &&
        changesDescriptions &&
        changesDescriptions.length
      )
        descriptions = descriptions.concat(changesDescriptions);
      actions.push(<PrintAction>{
        count: p.count || view.defaultCount || 1,
        data: {
          currency: order.details.currency,
          customerAddress: order.details.address,
          customerName: order.customer
            ? User.fullName(order.customer)
            : undefined,
          customerPhone: order.customer
            ? order.customer.mobilePhone
            : undefined,
          date: order.createdAt,
          descriptions,
          items:
            view.includeProductCategoryIds &&
            view.includeProductCategoryIds.length
              ? <any>(
                  order.items.filter(
                    (x) =>
                      x.product &&
                      x.product.category &&
                      view.includeProductCategoryIds.indexOf(
                        x.product.category.id
                      ) > -1
                  )
                )
              : <any>order.items,
          qNumber: order.qNumber,
          shopAddress: order.shop.location.address,
          shopName: order.shop.title,
          shopPhones: order.shop.phones,
          shopUrl: process.env.APP_DOMAIN + '/' + order.shop.username,
          table:
            order.details.table && (<any>order.details.table).code
              ? (<any>order.details.table).code
              : order.details.table,
          totalPrice: order.totalPrice,
          type: order.type,
        },
        printerName: view.printer.name,
        printerTitle: view.title,
        shop: { id: order.shop.id },
        waitForLocal: dto.waitForLocal,
        type: view.type,
      });
    }
    return this.printActionsRepository.save(actions);
  }

  findByIds(ids: string[]): Promise<PrintAction[]> {
    return this.printActionsRepository.findByIds(ids);
  }

  async findByShopId(shopId: string): Promise<PrintAction[]> {
    const last5min = new Date();
    last5min.setMinutes(last5min.getMinutes() - 5);
    let actions = await this.printActionsRepository.find({
      where: {
        shop: { id: shopId },
        isPrinted: false,
        failedCount: LessThanOrEqual(3),
        createdAt: MoreThanOrEqual(last5min),
      },
    });
    actions = actions.filter(
      (x) =>
        !x.waitForLocal || Date.now() - new Date(x.createdAt).valueOf() > 15000
    );
    return actions;
  }

  async setPrinted(id: string): Promise<void> {
    await this.printActionsRepository.update(id, { isPrinted: true });
  }

  async setFailed(id: string): Promise<void> {
    await this.printActionsRepository.increment({ id }, 'failedCount', 1);
  }
}
