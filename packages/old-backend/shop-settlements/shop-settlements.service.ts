import {
  Payment,
  Shop,
  ShopBankInfo,
  ShopSettlement,
  ShopSettlementFilterDto,
  Status,
} from '@menno/types';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindOptionsWhere, Repository } from 'typeorm';
import { ShopsService } from '../shops/shops.service';

@Injectable()
export class ShopSettlementsService {
  constructor(
    @InjectRepository(ShopSettlement)
    private shopSettlementsRepository: Repository<ShopSettlement>,
    @InjectRepository(ShopBankInfo)
    private shopBankInfosRepository: Repository<ShopBankInfo>,
    private shopsService: ShopsService
  ) {}

  async createShopSettlement(shopId: string): Promise<ShopSettlement> {
    const shop = await this.shopsService.findOne(shopId);
    const bankInfo = await this.shopBankInfosRepository.findOne({
      where: { shop: { id: shopId } },
    });

    if (!bankInfo || bankInfo.status !== Status.Active)
      throw new RpcException({
        code: 404,
        message: 'shop bank info is null or inactive',
      });

    const notCompletedPayments = await this.shopSettlementsRepository.find({
      where: { shop: { id: shopId }, isCompleted: false },
    });
    if (notCompletedPayments && notCompletedPayments.length)
      await this.shopSettlementsRepository.softRemove(notCompletedPayments);

    const lastSettlement = await this.shopSettlementsRepository.findOne({
      where: { shop: { id: shopId }, isCompleted: true },
      order: { createdAt: 'DESC' },
    });
    let outstandingPayments: Payment[];
    outstandingPayments = await this.paymentMic
      .send('payments/filter', <FilterPayment>{
        fromDate: lastSettlement ? lastSettlement.createdAt : undefined,
        businessId: shopId,
        portal: { id: process.env.DEFAULT_BANK_PORTAL_ID },
      })
      .toPromise();
    outstandingPayments = outstandingPayments.filter((x) => x.confirmedAt);

    const newSettlement = new ShopSettlement();
    newSettlement.amount = 0;
    newSettlement.fromDate = lastSettlement
      ? lastSettlement.createdAt
      : undefined;
    newSettlement.shopBankInfo = bankInfo;
    newSettlement.shop = <Shop>{ id: shop.id };
    newSettlement.details = <any>{
      IBAN: bankInfo.IBAN,
      firstName: bankInfo.firstName,
      lastName: bankInfo.lastName,
    };
    for (const p of outstandingPayments) {
      newSettlement.amount += p.amount;
    }
    newSettlement.amount = newSettlement.amount / 10;
    if (newSettlement.amount === 0) {
      return null;
    }
    return this.shopSettlementsRepository.save(newSettlement);
  }

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async createAllSettlements(): Promise<ShopSettlement[]> {
    const bankInfos = await this.shopBankInfosRepository.find({
      where: { status: Status.Active },
      relations: ['shop'],
    });

    const settlements: ShopSettlement[] = [];
    for (const b of bankInfos) {
      try {
        const s = await this.createShopSettlement(b.shop.id);
        if (s) settlements.push(s);
      } catch (error) {}
    }
    return settlements;
  }

  findNotCompleted(): Promise<ShopSettlement[]> {
    return this.shopSettlementsRepository.find({
      where: {
        isCompleted: false,
      },
      relations: ['shopBankInfo'],
    });
  }

  async delete(id: number): Promise<void> {
    await this.shopSettlementsRepository.softDelete(id);
  }

  async filter(
    shopSettlementFilterDto: ShopSettlementFilterDto
  ): Promise<ShopSettlement[]> {
    const conditions: FindOptionsWhere<ShopSettlement> = {};
    if (shopSettlementFilterDto.bussinesId)
      conditions.shop = { id: shopSettlementFilterDto.bussinesId };
    conditions.createdAt = Between(
      shopSettlementFilterDto.fromDate,
      shopSettlementFilterDto.toDate
    );
    return this.shopSettlementsRepository.find({
      where: conditions,
    });
  }

  async getNotCompleted(): Promise<ShopSettlement[]> {
    const conditions: FindOptionsWhere<ShopSettlement> = {
      isCompleted: false,
    };
    return this.shopSettlementsRepository.find({
      where: conditions,
      relations: ['shopBankInfo', 'shopBankInfo.shop'],
    });
  }

  async completeByIds(ids: number[], trackingCode?: string): Promise<void> {
    const settlements = await this.shopSettlementsRepository.findByIds(ids);
    for (const s of settlements) {
      s.isCompleted = true;
      if (trackingCode) s.trackingCode = trackingCode;
      await this.shopSettlementsRepository.save(s);
    }
  }

  async removeByIds(ids: number[]): Promise<void> {
    this.shopSettlementsRepository.softDelete(ids);
  }

  async setTrue(trackingCode: string): Promise<void> {
    const unresolvedCustomers: ShopSettlement[] =
      await this.shopSettlementsRepository.findBy({
        isCompleted: false,
        deletedAt: null,
      });
    if (unresolvedCustomers) {
      for (const u of unresolvedCustomers) {
        u.isCompleted = true;
        u.trackingCode = trackingCode;
        u.settlementedAt = new Date();
      }
    }
    this.shopSettlementsRepository.save(unresolvedCustomers);
  }
}
