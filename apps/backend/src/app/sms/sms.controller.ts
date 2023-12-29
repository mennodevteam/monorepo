import {
  FilterSmsDto,
  Member,
  NewSmsDto,
  Shop,
  Sms,
  SmsGroup,
  SmsTemplate,
  User,
  UserRole,
} from '@menno/types';
import { Body, Controller, ForbiddenException, Get, Param, Post } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Not, Repository } from 'typeorm';
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
    @InjectRepository(Member) private membersRepo: Repository<Member>,
    @InjectRepository(SmsGroup) private groupsRepo: Repository<SmsGroup>
  ) {}

  @Post('filter')
  @Roles(UserRole.Panel)
  async filter(@Body() filter: FilterSmsDto, @LoginUser() user: AuthPayload): Promise<[SmsGroup[], number]> {
    const { smsAccount } = await this.authService.getPanelUserShop(user, ['smsAccount']);
    filter.accountId = smsAccount.id;
    return this.smsService.filter(filter);
  }

  @Get('group/:id')
  @Roles(UserRole.Panel)
  async list(@Param('id') id: string, @LoginUser() user: AuthPayload): Promise<SmsGroup> {
    const { smsAccount } = await this.authService.getPanelUserShop(user, ['smsAccount']);
    const group = await this.groupsRepo.findOne({ where: { id }, relations: ['account', 'list'] });
    if (smsAccount?.id !== group.account?.id) throw new ForbiddenException();
    return group;
  }

  @Post('send')
  @Roles(UserRole.Admin)
  async send(@Body() dto: NewSmsDto, @LoginUser() user: AuthPayload) {
    return this.smsService.send(dto)
  }

  @Post('sendTemplate')
  @Roles(UserRole.Panel)
  async sendTemplate(@Body() dto: NewSmsDto, @LoginUser() user: AuthPayload) {
    const shop = await this.authService.getPanelUserShop(user, ['smsAccount', 'club']);
    dto.accountId = shop.smsAccount.id;
    const members = await this.membersRepo.find({
      where: {
        id: dto.memberIds ? In(dto.memberIds) : undefined,
        club: { id: shop.club.id },
        user: Not(IsNull()),
      },
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
