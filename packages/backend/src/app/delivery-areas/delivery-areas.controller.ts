import { Controller, Get } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { Roles } from '../auth/roles.decorators';
import { LoginUser } from '../auth/user.decorator';
import { AuthPayload } from '../core/types/auth-payload';
import { Role } from '../core/types/role.enum';

@Controller('deliveryAreas')
export class DeliveryAreasController {
  constructor(private auth: AuthService) {}

  @Get()
  @Roles(Role.Panel)
  async getDeliveryAreas(@LoginUser() user: AuthPayload) {
    const shop = await this.auth.getPanelUserShop(user, ['deliveryAreas']);
    return shop?.deliveryAreas;
  }
}
