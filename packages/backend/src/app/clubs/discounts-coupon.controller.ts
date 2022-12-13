import { DiscountCoupon, FilterDiscountCouponsDto } from '@menno/types';
import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { Roles } from '../auth/roles.decorators';
import { LoginUser } from '../auth/user.decorator';
import { AuthPayload } from '../core/types/auth-payload';
import { Role } from '../core/types/role.enum';
import { ClubsService } from './clubs.service';

@Controller('discountCoupons')
export class DiscountsCouponController {
  constructor(
    private auth: AuthService,
    private clubsService: ClubsService,
    @InjectRepository(DiscountCoupon) private discountCouponsRepo: Repository<DiscountCoupon>
  ) {}

  @Post()
  @Roles(Role.Panel)
  async save(@Body() discountsCoupon: DiscountCoupon, @LoginUser() user: AuthPayload): Promise<DiscountCoupon> {
    const { club } = await this.auth.getPanelUserShop(user, ['club']);
    discountsCoupon.club = club;
    return this.discountCouponsRepo.save(discountsCoupon);
  }

  @Get(':memberId?')
  async filter(@LoginUser() user: AuthPayload, @Param('memberId') memberId: string): Promise<DiscountCoupon[]> {
    const { club } = await this.auth.getPanelUserShop(user);
    return this.clubsService.filterDiscountCoupons(<FilterDiscountCouponsDto>{
      clubId: club.id,
      memberId,
    });
  }

  @Delete('/:couponId')
  async delete(@Param('couponId') couponId: string): Promise<void> {
    await this.discountCouponsRepo.delete(couponId);
  }
}
