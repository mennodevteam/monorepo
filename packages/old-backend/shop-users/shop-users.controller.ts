import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { ShopUser } from './entities/shop-user';
import { ShopUsersService } from './shop-users.service';

@Controller('shop-users')
export class ShopUsersController {
  constructor(private shopUsersService: ShopUsersService) {}

  @MessagePattern('shopUsers/find')
  getShopUser(shopId: string): Promise<any> {
    return this.shopUsersService.get(shopId);
  }

  @MessagePattern('shopUsers/save')
  save(shopUser: ShopUser): Promise<any> {
    return this.shopUsersService.save(shopUser);
  }

  @MessagePattern('shopUsers/remove')
  remove(dto: { shopId: string; userId: string }): Promise<any> {
    return this.shopUsersService.delete(dto);
  }
}
