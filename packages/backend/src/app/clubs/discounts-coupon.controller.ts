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
    const coupon = await this.discountCouponsRepo.findOneBy({
      club: { id: club.id },
      startedAt: LessThanOrEqual(new Date()),
      expiredAt: MoreThanOrEqual(new Date()),
      status: Status.Active,
      code,
    });

    if (coupon?.maxUse) {
      const totalCount = await this.ordersRepo.count({ where: { discountCoupon: { id: coupon.id } } });
      if (totalCount >= coupon.maxUse) return;
    }

    if (coupon?.maxUsePerUser) {
      const totalCount = await this.ordersRepo.count({
        where: { discountCoupon: { id: coupon.id }, customer: { id: user.id } },
      });
      if (totalCount >= coupon.maxUsePerUser) return;
    }

    return coupon;
  }

  @Roles(UserRole.App)
  @Get('app/:shopId')
  async filterApp(
    @LoginUser() user: AuthPayload,
    @Param('shopId') shopId: string
  ): Promise<DiscountCoupon[]> {
    const { club } = await this.shopsRepo.findOne({ where: { id: shopId }, relations: ['club'] });
    const member = await this.membersRepo.findOneBy({ club: { id: club.id }, user: { id: user.id } });
    return this.clubsService.filterDiscountCoupons(<FilterDiscountCouponsDto>{
      clubId: club.id,
      memberId: member?.id,
      isEnabled: true,
    });
  }

  @Roles(UserRole.Panel)
  @Get(':memberId?')
  async filter(
    @LoginUser() user: AuthPayload,
    @Param('memberId') memberId: string
  ): Promise<DiscountCoupon[]> {
    const { club } = await this.auth.getPanelUserShop(user, ['club']);
    return this.clubsService.filterDiscountCoupons(<FilterDiscountCouponsDto>{
      clubId: club.id,
      memberId,
      isEnabled: memberId ? true : false,
    });
  }

  @Roles(UserRole.Panel)
  @Delete('/:couponId')
  async delete(@Param('couponId') couponId: string): Promise<void> {
    await this.discountCouponsRepo.softDelete(couponId);
  }
}
