import { Controller, Get } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { Roles } from '../auth/roles.decorators';
import { LoginUser } from '../auth/user.decorator';
import { AuthPayload } from '../core/types/auth-payload';
import { Role } from '../core/types/role.enum';

@Roles(Role.Panel)
@Controller('shopPlugins')
export class ShopPluginsController {
  constructor(private auth: AuthService) {}

  @Get()
  async get(@LoginUser() user: AuthPayload) {
    const shop = await this.auth.getPanelUserShop(user, ['plugins']);
    return shop?.plugins;
  }
}
