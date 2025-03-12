import { Address, Chat, ChatType, Order, Region, Shop, UserRole } from '@menno/types';
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Public } from '../auth/public.decorator';
import { Roles } from '../auth/roles.decorators';
import { LoginUser } from '../auth/user.decorator';
import { AuthPayload } from '../core/types/auth-payload';
import { AuthService } from '../auth/auth.service';
import { SmsService } from '../sms/sms.service';

@Controller('chat')
export class ChatController {
  constructor(
    @InjectRepository(Order)
    private ordersRepo: Repository<Order>,
    @InjectRepository(Chat)
    private repo: Repository<Chat>,
    private auth: AuthService,
    private sms: SmsService,
  ) {}

  @Public()
  @Get('order/:id')
  find(@Param('id') id: string): Promise<Chat[]> {
    return this.repo.find({
      where: {
        order: { id },
      },
      relations: ['user', 'shop'],
      order: {
        createdAt: 'DESC',
      },
    });
  }

  @Post()
  @Roles(UserRole.Panel, UserRole.App)
  async save(@Body() chat: Chat, @LoginUser() user: AuthPayload): Promise<Chat> {
    if (user.role === UserRole.Panel) {
      const shop = await this.auth.getPanelUserShop(user);
      if (chat.order) {
        this.ordersRepo
          .findOne({ where: { id: chat.order.id }, relations: ['shop.smsAccount', 'customer'] })
          .then((order) => {
            try {
              if (order?.customer?.mobilePhone && order?.shop?.smsAccount) {
                const tokens: string[] = [];
                tokens[0] = Order.getLink(order.id, order.shop, process.env.APP_ORIGIN, '/orders');
                tokens[3] = order.shop.title;
                this.sms
                  .lookup(order.shop.smsAccount.id, order.customer.mobilePhone, 'newchat', tokens)
                  .catch((err) => {
                    // do nothing
                  });
              }
            } catch (error) {
              // do nothing
            }
          });
      }

      return this.repo.save({ ...chat, type: ChatType.Receive, shop: { id: shop.id } });
    } else {
      return this.repo.save({ ...chat, type: ChatType.Send, user: { id: user.id } });
    }
  }

  @Public()
  @Post('seen')
  async seen(@Body() ids: string[], @LoginUser() user: AuthPayload): Promise<void> {
    this.repo.update({ id: In(ids) }, { seen: true });
  }
}
