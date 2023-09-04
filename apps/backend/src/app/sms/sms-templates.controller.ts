import { SmsTemplate, UserRole } from '@menno/types';
import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { Public } from '../auth/public.decorator';
import { Roles } from '../auth/roles.decorators';
import { LoginUser } from '../auth/user.decorator';
import { AuthPayload } from '../core/types/auth-payload';
import { SmsTemplatesService } from './sms-templates.service';

@Controller('smsTemplates')
export class SmsTemplatesController {
  constructor(
    private auth: AuthService,
    @InjectRepository(SmsTemplate)
    private smsTemplatesRepo: Repository<SmsTemplate>,
    private smsTemplatesService: SmsTemplatesService
  ) {}

  @Post()
  @Roles(UserRole.Panel)
  async save(@Body() smsTemplate: SmsTemplate, @LoginUser() user: AuthPayload): Promise<SmsTemplate> {
    const shop = await this.auth.getPanelUserShop(user, ['smsAccount']);

    if (shop.smsAccount) {
      smsTemplate.account = shop.smsAccount;
      smsTemplate.creatorId = user.id;
      return this.smsTemplatesService.createSmsTemplateFromPanel(smsTemplate, shop);
    }
  }

  @Public()
  @Get('verify/:id')
  async verify(@Param('id') id: string) {
    return this.smsTemplatesRepo.update(id, {
      isVerified: true,
    });
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.smsTemplatesRepo.delete(id);
  }

  @Get()
  async filter(@LoginUser() user: AuthPayload): Promise<SmsTemplate[]> {
    const { smsAccount } = await this.auth.getPanelUserShop(user, ['smsAccount']);
    const accountTemplates = await this.smsTemplatesRepo.find({
      where: [
        {
          account: { id: smsAccount.id },
        },
      ],
      order: {
        createdAt: 'desc',
      },
    });
    const globalTemplates = await this.smsTemplatesRepo.find({
      where: [{ account: IsNull(), isVerified: true }],
      order: {
        createdAt: 'asc',
      },
    });

    return [...accountTemplates, ...globalTemplates];
  }
}
