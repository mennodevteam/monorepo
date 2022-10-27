import { SmsTemplate } from '@menno/types';
import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { Public } from '../auth/public.decorator';
import { Roles } from '../auth/roles.decorator';
import { LoginUser } from '../auth/user.decorator';
import { AuthPayload } from '../core/types/auth-payload';
import { Role } from '../core/types/role.enum';
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
  @Roles(Role.Panel)
  async save(@Body() smsTemplate: SmsTemplate, @LoginUser() user: AuthPayload): Promise<SmsTemplate> {
    const { smsAccount } = await this.auth.getPanelUserShop(user, ['smsAccount']);

    if (smsAccount) {
      smsTemplate.account = smsAccount;
      smsTemplate.creatorId = user.id;
      return this.smsTemplatesService.createSmsTemplateFromPanel(smsTemplate);
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
    return this.smsTemplatesRepo.find({
      where: {
        account: smsAccount,
      },
      order: {
        createdAt: 'desc',
      },
    });
  }
}
