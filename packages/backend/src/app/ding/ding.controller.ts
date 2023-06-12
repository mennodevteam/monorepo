import { Ding, UserRole } from '@menno/types';
import { Controller, Get, HttpException, HttpStatus, Param, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { Roles } from '../auth/roles.decorators';
import { LoginUser } from '../auth/user.decorator';
import { AuthPayload } from '../core/types/auth-payload';
import { WebPushNotificationsService } from '../web-push-notifications/web-push-notifications.service';

@Controller('ding')
export class DingController {
  constructor(
    @InjectRepository(Ding)
    private repo: Repository<Ding>,
    private webPushService: WebPushNotificationsService
  ) {}

  @Roles(UserRole.App)
  @Get(':shopId/:table')
  async ding(
    @Param('shopId') shopId: string,
    @Param('table') table: string,
    @Query() query,
    @LoginUser() user: AuthPayload
  ) {
    const prevDate = new Date();
    prevDate.setSeconds(prevDate.getSeconds() - 55);
    const last = await this.repo.findOne({
      where: {
        customer: { id: user.id },
        shop: { id: shopId },
        createdAt: MoreThan(prevDate),
      },
    });
    if (last) throw new HttpException('too many request', HttpStatus.TOO_MANY_REQUESTS);
    const ding = await this.repo.save({
      customer: { id: user.id },
      shop: { id: shopId },
      table,
      description: query.description,
    });
    let body = `میز ${table}`;
    if (ding.description) body += `: ${ding.description}`;
    this.webPushService.notifToShop(shopId, {
      title: 'درخواست سالن‌دار',
      options: {
        body,
        data: ding,
      },
    });
    return ding;
  }
}
