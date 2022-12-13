import { FilterSmsDto, Member, NewSmsDto, Sms, User } from '@menno/types';
import { Body, Controller, Post } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { Roles } from '../auth/roles.decorators';
import { LoginUser } from '../auth/user.decorator';
import { AuthPayload } from '../core/types/auth-payload';
import { Role } from '../core/types/role.enum';
import { SmsService } from './sms.service';

@Controller('sms')
export class SmsController {
  constructor(private authService: AuthService, private smsService: SmsService) {}

  @Post('filter')
  @Roles(Role.Panel)
  async filter(@Body() filter: FilterSmsDto, @LoginUser() user: AuthPayload): Promise<[Sms[], number]> {
    const { smsAccount } = await this.authService.getPanelUserShop(user, ['smsAccount']);
    filter.accountId = smsAccount.id;
    return this.smsService.filter(filter);
  }
}
