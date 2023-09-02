import { FilterSmsDto, Member, NewSmsDto, Shop, Sms, SmsGroup, SmsTemplate, User, UserRole } from '@menno/types';
import { Body, Controller, Post } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { Roles } from '../auth/roles.decorators';
import { LoginUser } from '../auth/user.decorator';
import { AuthPayload } from '../core/types/auth-payload';
import { SmsService } from './sms.service';

@Controller('sms')
export class SmsController {
  constructor(
    private authService: AuthService,
    private smsService: SmsService,
    @InjectRepository(Member) private membersRepo: Repository<Member>
  ) {}

  @Post('filter')
  @Roles(UserRole.Panel)
  async filter(@Body() filter: FilterSmsDto, @LoginUser() user: AuthPayload): Promise<[SmsGroup[], number]> {
    const { smsAccount } = await this.authService.getPanelUserShop(user, ['smsAccount']);
    filter.accountId = smsAccount.id;
    return this.smsService.filter(filter);
  }

  @Post('sendTemplate')
  @Roles(UserRole.Panel)
  async sendTemplate(@Body() dto: NewSmsDto, @LoginUser() user: AuthPayload): Promise<SmsGroup> {
    const shop = await this.authService.getPanelUserShop(user, ['smsAccount', 'club']);
    dto.accountId = shop.smsAccount.id;
    const members = await this.membersRepo.find({
      where: { id: dto.memberIds ? In(dto.memberIds) : undefined, club: { id: shop.club.id } },
      relations: ['user'],
    });
    dto.receptors = members.map((x) => x.user.mobilePhone);
    dto.templateParams = SmsTemplate.getTemplateParams(
      members.map((x) => x.user),
      shop,
      process.env.APP_ORIGIN
    );

    return this.smsService.sendTemplate(dto);
  }
}
