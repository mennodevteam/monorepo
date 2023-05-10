import { SmsAccount, UserRole } from '@menno/types';
import { Controller, Get } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { Roles } from '../auth/roles.decorators';
import { LoginUser } from '../auth/user.decorator';
import { AuthPayload } from '../core/types/auth-payload';

@Controller('smsAccounts')
@Roles(UserRole.Panel)
export class SmsAccountsController {
  constructor(private authService: AuthService) {}

  @Get()
  async find(@LoginUser() user: AuthPayload): Promise<SmsAccount> {
    const shop = await this.authService.getPanelUserShop(user, ['smsAccount']);
    return shop.smsAccount;
  }
}
