import { Shop, User, UserRole, WebPushNotificationDto, WebPushSubscription } from '@menno/types';
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Public } from '../auth/public.decorator';
import { Roles } from '../auth/roles.decorators';
import { LoginUser } from '../auth/user.decorator';
import { AuthPayload } from '../core/types/auth-payload';
import { AuthService } from '../auth/auth.service';
import { WebPushNotificationsService } from './web-push-notifications.service';

@Controller('webPushNotifications')
export class WebPushNotificationsController {
  constructor(
    @InjectRepository(WebPushSubscription)
    private repo: Repository<WebPushSubscription>,
    private auth: AuthService,
    private service: WebPushNotificationsService
  ) {}

  @Roles(UserRole.Panel)
  @Post('subscribe')
  async subscribe(
    @LoginUser() user: AuthPayload,
    @Body() dto: WebPushSubscription
  ): Promise<WebPushSubscription> {
    const shop = await this.auth.getPanelUserShop(user);
    if (shop) {
      dto.shop = { id: shop.id } as Shop;
      dto.user = { id: user.id } as User;
      return this.repo.save(dto);
    }
  }

  @Public()
  @Post('test/:shopId')
  async test(@Param('shopId') shopId: string, @Body() dto: WebPushNotificationDto): Promise<void> {
    this.service.notifToShop(shopId, dto);
  }
}
