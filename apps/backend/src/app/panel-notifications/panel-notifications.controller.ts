import { Controller, Get } from '@nestjs/common';
import { PanelNotificationsService } from './panel-notifications.service';
import { AuthPayload } from '../core/types/auth-payload';
import { Roles } from '../auth/roles.decorators';
import { UserRole } from '@menno/types';
import { LoginUser } from '../auth/user.decorator';

@Roles(UserRole.Panel)
@Controller('panelNotifications')
export class PanelNotificationsController {
  constructor(private readonly panelNotificationsService: PanelNotificationsService) {}

  @Get()
  async getNotifications(@LoginUser() user: AuthPayload) {
    return this.panelNotificationsService.getNotifications(user.shopId);
  }
}
