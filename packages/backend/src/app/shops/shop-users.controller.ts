import { ShopUser, ShopUserRole, UserRole } from '@menno/types';
import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Roles } from '../auth/roles.decorators';
import { AuthService } from '../auth/auth.service';
import { LoginUser } from '../auth/user.decorator';
import { AuthPayload } from '../core/types/auth-payload';

@Roles(UserRole.Panel)
@Controller('shopUsers')
export class ShopUsersController {
  constructor(
    @InjectRepository(ShopUser)
    private shopUsersRepo: Repository<ShopUser>,
    private auth: AuthService,
  ) {}

  @Get()
  async getAll(@LoginUser() user: AuthPayload): Promise<ShopUser[]> {
    const shop = await this.auth.getPanelUserShop(user)
    return this.shopUsersRepo.find({
      where: { shop: {id: shop.id} },
      relations: ['user'],
    });
  }

  @Post()
  async save(@Body() dto: ShopUser, @LoginUser() user: AuthPayload): Promise<ShopUser> {
    const shop = await this.auth.getPanelUserShop(user)
    dto.shop = shop;
    dto.role = ShopUserRole.Waiter;
    return this.shopUsersRepo.save(dto);
  }

  @Delete('/:id')
  async remove(@Param('id') id: string) {
    this.shopUsersRepo.delete(id);
  }
}
