import { NewSmsDto, ShopPlugins, ShopUserRole } from '@menno/types';
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SmsService } from '../sms/sms.service';

@Injectable()
export class ShopPluginsService {
  constructor(
    @InjectRepository(ShopPlugins)
    private repo: Repository<ShopPlugins>,
    private smsService: SmsService
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_11AM)
  async checkPluginExpiration(): Promise<void> {
    const plugins = await this.repo.find({ relations: ['shop.users.user'] });

    for (const plugin of plugins) {
      const admin = plugin.shop?.users.find((x) => x.user && x.role === ShopUserRole.Admin)?.user;
      const expireDateValue = new Date(plugin.expiredAt).valueOf();
      if (admin?.mobilePhone) {
        const expireDateDatDiff = Math.floor((expireDateValue.valueOf() - Date.now()) / 1000 / 3600 / 24);

        if (expireDateDatDiff === 5) {
          const smsDto = new NewSmsDto();
          smsDto.messages = [
            `⚠️ مدیریت محترم مجموعه ${plugin.shop.title}:\n\nکمتر از یک هفته تا منقضی شدن سرویس منوی دیجیتال شما باقی مانده است.
            لطفا جهت جلوگیری از قطع شدن سرویس از طریق پنل مدیریت خود به آدرس panel.menno.pro مراجعه کنید\n\nبا تشکر\nMENNO`,
          ];
          smsDto.receptors = [admin.mobilePhone];
          this.smsService.send(smsDto);
        } else if (expireDateDatDiff === 2) {
          const smsDto = new NewSmsDto();
          smsDto.messages = [
            `⚠️ مدیریت محترم مجموعه ${plugin.shop.title}:\n\nکمتر از سه روز تا منقضی شدن سرویس منوی دیجیتال شما باقی مانده است.
            لطفا جهت جلوگیری از قطع شدن سرویس از طریق پنل مدیریت خود به آدرس panel.menno.pro مراجعه کنید\n\nبا تشکر\nMENNO`,
          ];
          smsDto.receptors = [admin.mobilePhone];
          this.smsService.send(smsDto);
        } else if (expireDateDatDiff === -1) {
          const smsDto = new NewSmsDto();
          smsDto.messages = [
            `❌ مدیریت محترم مجموعه ${plugin.shop.title}:\n\nسرویس منوی دیجیتال شما منقضی شده است.
            دیتاهای شما به مدت یک هفته به حالت معلق در سامانه موجود است و می‌توانید برای راه اندازی مجدد از طریق پنل مدیریت خود به آدرسpanel.menno.pro مراجعه کنید
            \n\nبا تشکر\nMENNO`,
          ];
          smsDto.receptors = [admin.mobilePhone];
          this.smsService.send(smsDto);
        }
      }
    }
  }
}
