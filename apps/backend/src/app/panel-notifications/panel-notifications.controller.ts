import { Controller, Get } from '@nestjs/common';
import { PanelNotificationsService } from './panel-notifications.service';
import { AuthPayload } from '../core/types/auth-payload';
import { Roles } from '../auth/roles.decorators';
import { UserRole } from '@menno/types';
import { LoginUser } from '../auth/user.decorator';
import { AuthService } from '../auth/auth.service';

@Roles(UserRole.Panel)
@Controller('panelNotifications')
export class PanelNotificationsController {
  constructor(
    private readonly panelNotificationsService: PanelNotificationsService,
    private readonly authService: AuthService,
  ) {}

  @Get()
  async getNotifications(@LoginUser() user: AuthPayload) {
    const shop = await this.authService.getPanelUserShop(user);
    return this.panelNotificationsService.getNotifications(shop.id);
  }
}
