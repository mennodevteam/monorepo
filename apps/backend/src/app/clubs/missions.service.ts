import { Injectable } from '@nestjs/common';
import { SmsService } from '../sms/sms.service';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Club,
  DiscountCoupon,
  Member,
  Mission,
  MissionComplete,
  MissionConditionPeriod,
  MissionRewardType,
  Order,
  OrderPaymentType,
  Shop,
  Status,
  User,
  WalletLog,
  WalletLogType,
} from '@menno/types';
import { LessThanOrEqual, MoreThanOrEqual, Not, Repository } from 'typeorm';
import * as moment from 'jalali-moment';
import { WalletsService } from './wallets.service';
import { randomCharacters } from '@menno/utils';

@Injectable()
export class MissionsService {
  constructor(
    private smsService: SmsService,
    private walletService: WalletsService,
    @InjectRepository(Mission) private missionsRepo: Repository<Mission>,
    @InjectRepository(MissionComplete) private missionCompletesRepo: Repository<MissionComplete>,
    @InjectRepository(Order) private ordersRepo: Repository<Order>,
    @InjectRepository(Shop) private shopsRepo: Repository<Shop>,
    @InjectRepository(Club) private clubsRepo: Repository<Club>,
    @InjectRepository(Member) private membersRepo: Repository<Member>,
    @InjectRepository(User) private usersRepo: Repository<User>,
    @InjectRepository(DiscountCoupon) private discountCouponsRepo: Repository<DiscountCoupon>
  ) {}

  async checkFormMission(order: Order) {
    // const order = await this.ordersRepo.findOne({
    //   where: { id: orderId },
    //   relations: ['shop.club.smsAccount', 'customer'],
    // });

    order.shop = await this.shopsRepo.findOne({
      where: { id: order.shop.id },
      relations: ['club', 'smsAccount'],
    });

    if (order.shop?.club && order.customer) {
      const member = await this.membersRepo.findOne({
        where: { user: { id: order.customer.id }, club: { id: order.shop.club.id } },
      });

      const missions = await this.activeMissions(order.shop.club.id);

      if (member && missions) {
        member.user = order.customer;
        for (const mission of missions) {
          if (mission.conditionPeriod === MissionConditionPeriod.PerPurchase) {
            if (order.paymentType !== OrderPaymentType.NotPayed && order.totalPrice >= mission.orderSum)
              await this.completeMission(mission, member, order.shop);
          } else {
            let startDate: Date;
            const nowMoment = moment(new Date()).locale('fa');
            switch (mission.conditionPeriod) {
              case MissionConditionPeriod.Weekly:
                startDate = nowMoment.startOf('week').toDate();
                break;
              case MissionConditionPeriod.Monthly:
                startDate = nowMoment.startOf('month').toDate();
                break;
              case MissionConditionPeriod.Yearly:
                startDate = nowMoment.startOf('year').toDate();
                break;
            }

            if (startDate) {
              const isCompleted = await this.missionCompletesRepo.count({
                where: {
                  member: { id: member.id },
                  mission: { id: mission.id },
                  createdAt: MoreThanOrEqual(startDate),
                },
              });

              if (isCompleted) continue;
              const orders = await this.ordersRepo.find({
                where: {
                  createdAt: MoreThanOrEqual(startDate),
                  shop: { id: order.shop.id },
                  customer: { id: order.customer.id },
                  paymentType: Not(OrderPaymentType.NotPayed),
                },
              });

              const sum = orders.reduce((prev, current) => {
                prev += current.totalPrice;
                return prev;
              }, 0);

              if (sum >= mission.orderSum && orders.length >= mission.orderCount)
                await this.completeMission(mission, member, order.shop);
            }
          }
        }
      }
    }
  }

  private activeMissions(clubId: string) {
    return this.missionsRepo.find({
      where: {
        startedAt: LessThanOrEqual(new Date()),
        expiredAt: MoreThanOrEqual(new Date()),
        status: Status.Active,
        club: { id: clubId },
      },
    });
  }

  private async completeMission(mission: Mission, member: Member, shop: Shop) {
    if (mission.rewardType === MissionRewardType.WalletCharge && mission.rewardValue) {
      const wallet = await this.walletService.getMemberWallet(member.id);
      await this.walletService.updateWalletAmount(
        { amount: mission.rewardValue, type: WalletLogType.ManualCharge, wallet } as WalletLog,
        shop.id
      );
    } else if (mission.rewardType === MissionRewardType.DiscountCoupon && mission.rewardDetails) {
      const coupon = mission.rewardDetails;
      coupon.user = member.user;
      const date = new Date();
      date.setDate(date.getDate() + mission.durationInDays || 10);
      coupon.startedAt = new Date();
      coupon.expiredAt = date;
      coupon.code = randomCharacters(6, 'abcdefghijklmnopqrstuvwxyz');
      coupon.club = shop.club;
      coupon.title = mission.title;
      await this.discountCouponsRepo.save(coupon);
      if (shop.smsAccount) {
        this.smsService.send({
          receptors: [member.user.mobilePhone],
          accountId: shop.smsAccount.id,
          messages: [
            `${shop.title}\n${member.user.firstName} عزیز\nبا استفاده از کد تخفیف ${
              coupon.code
            } در سفارشات بعدی خود، از ${coupon.percentageDiscount || coupon.fixedDiscount} ${
              coupon.percentageDiscount ? 'درصد' : 'تومان'
            } تخفیف آن استفاده کنید.\nمهلت استفاده تا ${mission.durationInDays} روز دیگر.`,
          ],
        });
      }
    }
    await this.missionCompletesRepo.save({ member, mission } as MissionComplete);
  }
}
