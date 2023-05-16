import { DiscountCoupon, FilterDiscountCouponsDto, UserRole } from '@menno/types';
import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
    @InjectRepository(DiscountCoupon) private discountCouponsRepo: Repository<DiscountCoupon>
  ) {}

  @Post()
  @Roles(UserRole.Panel)
  async save(@Body() discountsCoupon: DiscountCoupon, @LoginUser() user: AuthPayload): Promise<DiscountCoupon> {
    const { club } = await this.auth.getPanelUserShop(user, ['club']);
    discountsCoupon.club = club;
    return this.discountCouponsRepo.save(discountsCoupon);
  }

  @Get(':memberId?')
  async filter(@LoginUser() user: AuthPayload, @Param('memberId') memberId: string): Promise<DiscountCoupon[]> {
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
