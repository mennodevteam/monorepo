import {
  DiscountCoupon,
  FilterDiscountCouponsDto,
  Member,
  Order,
  Shop,
  Status,
  UserRole,
} from '@menno/types';
import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { Roles } from '../auth/roles.decorators';
import { LoginUser } from '../auth/user.decorator';
import { AuthPayload } from '../core/types/auth-payload';
import { ClubsService } from './clubs.service';

@Controller('discountCoupons')
export class DiscountsCouponController {
  constructor(
    private auth: AuthService,
    private clubsService: ClubsService,
    @InjectRepository(DiscountCoupon) private discountCouponsRepo: Repository<DiscountCoupon>,
    @InjectRepository(Shop) private shopsRepo: Repository<Shop>,
    @InjectRepository(Member) private membersRepo: Repository<Member>,
    @InjectRepository(Order) private ordersRepo: Repository<Order>
  ) {}

  @Post()
  @Roles(UserRole.Panel)
  async save(
    @Body() discountsCoupon: DiscountCoupon,
    @LoginUser() user: AuthPayload
  ): Promise<DiscountCoupon> {
    const { club } = await this.auth.getPanelUserShop(user, ['club']);
    discountsCoupon.club = club;
    return this.discountCouponsRepo.save(discountsCoupon);
  }

  @Roles(UserRole.App)
  @Get('check/:shopId/:code')
  async check(
    @LoginUser() user: AuthPayload,
    @Param('shopId') shopId: string,
    @Param('code') code: string
  ): Promise<DiscountCoupon | undefined> {
    const { club } = await this.shopsRepo.findOne({ where: { id: shopId }, relations: ['club'] });
    if (club) {
      const member = await this.membersRepo.findOne({
        where: {
          club: { id: club.id },
          user: { id: user.id },
        },
        relations: ['tags'],
      });

      const coupons = await this.discountCouponsRepo.find({
        where: {
          club: { id: club.id },
          startedAt: LessThanOrEqual(new Date()),
          expiredAt: MoreThanOrEqual(new Date()),
          status: Status.Active,
          code,
        },
        relations: ['tag'],
      });

      for (const coupon of coupons) {
        if (coupon?.star != undefined) {
          if (!member || member.star < coupon.star) break;
        }

        if (coupon?.tag != undefined) {
          if (!member || !member.tags.find((tag) => tag.id === coupon.tag.id)) break;
        }

        if (coupon?.maxUse) {
          const totalCount = await this.ordersRepo.count({ where: { discountCoupon: { id: coupon.id } } });
          if (totalCount >= coupon.maxUse) break;
        }

        if (coupon?.maxUsePerUser) {
          const totalCount = await this.ordersRepo.count({
            where: { discountCoupon: { id: coupon.id }, customer: { id: user.id } },
          });
          if (totalCount >= coupon.maxUsePerUser) break;
        }

        return coupon;
      }
    }
    return;
  }

  @Roles(UserRole.App)
  @Get('app/:shopId')
  async filterApp(
    @LoginUser() user: AuthPayload,
    @Param('shopId') shopId: string
  ): Promise<DiscountCoupon[]> {
    const { club } = await this.shopsRepo.findOne({ where: { id: shopId }, relations: ['club'] });
    if (club) {
      return this.clubsService.filterDiscountCoupons(<FilterDiscountCouponsDto>{
        clubId: club.id,
        userId: user?.id,
        isEnabled: true,
      });
    }
    return [];
  }

  @Roles(UserRole.Panel)
  @Get(':userId?')
  async filter(@LoginUser() user: AuthPayload, @Param('userId') userId: string): Promise<DiscountCoupon[]> {
    const { club } = await this.auth.getPanelUserShop(user, ['club']);
    return this.clubsService.filterDiscountCoupons(<FilterDiscountCouponsDto>{
      clubId: club.id,
      userId,
      isEnabled: userId ? true : false,
    });
  }

  @Roles(UserRole.Panel)
  @Delete('/:couponId')
  async delete(@Param('couponId') couponId: string): Promise<void> {
    await this.discountCouponsRepo.softDelete(couponId);
  }
}
