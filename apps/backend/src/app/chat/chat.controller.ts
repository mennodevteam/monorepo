import { Address, Chat, ChatType, Order, Region, Shop, User, UserRole } from '@menno/types';
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
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

  @Get('threads')
  @Roles(UserRole.Panel)
  async getThreads(@LoginUser() user: AuthPayload): Promise<any[]> {
    const shop = await this.auth.getPanelUserShop(user);
    const chats = await this.repo.find({
      where: { shop: { id: shop.id } },
      relations: ['user', 'order'],
      order: { createdAt: 'DESC' },
    });

    const threadsMap = new Map<string, {
      user: User;
      lastChat: Chat;
      unreadCount: number;
      order: Order;
    }>();

    for (const chat of chats) {
      if (!chat.order) continue;
      const orderId = chat.order.id;
      if (!threadsMap.has(orderId)) {
        threadsMap.set(orderId, {
          user: chat.user || chat.order.customer,
          lastChat: chat,
          unreadCount: 0,
          order: chat.order,
        });
      }
      const thread = threadsMap.get(orderId)!;
      if (chat.type === ChatType.Send && !chat.seen) {
        thread.unreadCount++;
      }
    }

    return Array.from(threadsMap.values());
  }

  @Get('threads-paginated')
  @Roles(UserRole.Panel)
  async getThreadsPaginated(
    @LoginUser() user: AuthPayload,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
    @Query('search') search?: string,
  ): Promise<any[]> {
    const limit = take ? parseInt(take, 10) : 20;
    const offset = skip ? parseInt(skip, 10) : 0;
    const shop = await this.auth.getPanelUserShop(user);

    const qb = this.repo.createQueryBuilder('chat')
      .leftJoin('chat.user', 'user')
      .select('chat.userId', 'userId')
      .addSelect('MAX(chat.createdAt)', 'maxCreatedAt')
      .where('chat.shopId = :shopId', { shopId: shop.id })
      .groupBy('chat.userId')
      .orderBy('maxCreatedAt', 'DESC')
      .offset(offset)
      .limit(limit);

    if (search) {
      qb.andWhere(
        '(user.firstName LIKE :search OR user.lastName LIKE :search OR user.mobilePhone LIKE :search)',
        { search: `%${search}%` }
      );
    }

    const rows = await qb.getRawMany<{ userId: string }>();
    const userIds = rows.map((r) => r.userId).filter(Boolean);
    if (!userIds.length) return [];

    const chats = await this.repo.find({
      where: {
        shop: { id: shop.id },
        user: { id: In(userIds) }
      },
      relations: ['user', 'order'],
      order: { createdAt: 'DESC' },
    });

    const threadsMap = new Map<string, {
      user: User;
      lastChat: Chat;
      unreadCount: number;
    }>();

    for (const chat of chats) {
      if (!chat.user) continue;
      const userId = chat.user.id;
      if (!threadsMap.has(userId)) {
        threadsMap.set(userId, {
          user: chat.user,
          lastChat: chat,
          unreadCount: 0,
        });
      }
      const thread = threadsMap.get(userId)!;
      if (chat.type === ChatType.Send && !chat.seen) {
        thread.unreadCount++;
      }
    }

    return userIds.map((id) => threadsMap.get(id)).filter(Boolean);
  }

  @Get('user/:userId')
  @Roles(UserRole.Panel)
  async findByUser(
    @Param('userId') userId: string,
    @LoginUser() user: AuthPayload,
  ): Promise<Chat[]> {
    const shop = await this.auth.getPanelUserShop(user);
    return this.repo.find({
      where: {
        user: { id: userId },
        shop: { id: shop.id },
      },
      relations: ['user', 'shop', 'order'],
      order: {
        createdAt: 'ASC',
      },
    });
  }

  @Get('last-order/:userId')
  @Roles(UserRole.Panel)
  async getLastOrder(
    @Param('userId') userId: string,
    @LoginUser() user: AuthPayload,
  ): Promise<Order | null> {
    const shop = await this.auth.getPanelUserShop(user);
    return this.ordersRepo.findOne({
      where: {
        customer: { id: userId },
        shop: { id: shop.id },
      },
      order: { createdAt: 'DESC' },
    });
  }

  @Post()
  @Roles(UserRole.Panel, UserRole.App)
  async save(@Body() chat: Chat, @LoginUser() user: AuthPayload): Promise<Chat> {
    if (user.role === UserRole.Panel) {
      const shop = await this.auth.getPanelUserShop(user, ['appConfig', 'smsAccount']);
      if (chat.order && !chat.id) {
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
      this.ordersRepo
        .findOne({
          where: { id: chat.order.id },
          relations: ['shop.smsAccount', 'shop.appConfig', 'customer'],
        })
        .then((order) => {
          try {
            if (order.shop?.smsAccount && order.shop?.appConfig?.smsOnNewOrder) {
              void this.sms
                .send({
                  accountId: order.shop.smsAccount.id,
                  receptors: order.shop.appConfig.smsOnNewOrder,
                  messages: order.shop.appConfig.smsOnNewOrder.map(
                    (item) => `یک پیام جدید از ${User.fullName(order.customer)}: ${chat.text}`,
                  ),
                })
                .catch(() => undefined);
            }
          } catch (error) {
            // do nothing
          }
        })
        .catch((error) => {
          // do nothing
        });
      return this.repo.save({ ...chat, type: ChatType.Send, user: { id: user.id } });
    }
  }

  @Public()
  @Post('seen')
  async seen(@Body() ids: string[], @LoginUser() user: AuthPayload): Promise<void> {
    this.repo.update({ id: In(ids) }, { seen: true });
  }
}
