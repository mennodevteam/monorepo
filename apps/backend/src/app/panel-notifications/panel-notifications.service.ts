import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, MoreThan, Repository } from 'typeorm';
import { Order, Chat, ChatType } from '@menno/types';

interface NotificationItem {
  date: Date;
  order?: Order;
  chat?: Chat;
}

@Injectable()
export class PanelNotificationsService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Chat)
    private readonly chatRepository: Repository<Chat>,
  ) {}

  async getNotifications(shopId: string) {
    const [orders, chats] = await Promise.all([
      this.getOrderNotifications(shopId),
      this.getChatNotifications(shopId),
    ]);

    const notifications: NotificationItem[] = [
      ...orders.map((order) => ({
        date: new Date(order.createdAt),
        order,
      })),
      ...chats.map((chat) => ({
        date: new Date(chat.createdAt),
        chat,
      })),
    ];

    return notifications.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  private async getOrderNotifications(shopId: string) {
    return this.orderRepository.find({
      select: ['id', 'createdAt', 'seenAt'],
      where: {
        seenAt: IsNull(),
        createdAt: MoreThan(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)),
        shop: { id: shopId },
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  private async getChatNotifications(shopId: string) {
    return this.chatRepository.find({
      select: {
        id: true,
        order: {
          id: true,
        },
      },
      where: {
        type: ChatType.Send,
        seen: false,
        createdAt: MoreThan(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)),
        shop: { id: shopId },
      },
      relations: ['order'],
      order: {
        createdAt: 'DESC',
      },
    });
  }
}
