import { OrderMessage, Shop, UserRole } from '@menno/types';
import { Body, Controller, Get, Post } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Public } from '../auth/public.decorator';
import { Roles } from '../auth/roles.decorators';
import { LoginUser } from '../auth/user.decorator';
import { AuthPayload } from '../core/types/auth-payload';
import { AuthService } from '../auth/auth.service';

@Roles(UserRole.Panel)
@Controller('orderMessages')
export class OrderMessagesController {
  constructor(
    private auth: AuthService,
    @InjectRepository(OrderMessage)
    private repo: Repository<OrderMessage>
  ) {}

  @Get()
  async find(@LoginUser() user: AuthPayload): Promise<OrderMessage[]> {
    const shop = await this.auth.getPanelUserShop(user);
    if (shop) {
      return this.repo.find({
        where: { shop: { id: shop.id } },
        relations: ['smsTemplate'],
        order: {
          event: 'ASC',
        },
      });
    }
  }

  @Post()
  async save(@Body() dto: OrderMessage, @LoginUser() user: AuthPayload): Promise<OrderMessage> {
    const shop = await this.auth.getPanelUserShop(user);
    if (shop) {
      dto.shop = { id: shop.id } as Shop;
      return this.repo.save(dto);
    }
  }
}
