import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CoreModule } from '../core/core.module';
import { ShopPluginsController } from './shop-plugins.controller';
import { ScheduleModule } from '@nestjs/schedule';
import { ShopPluginsService } from './shop-plugins.service';
import { SmsModule } from '../sms/sms.module';

@Module({
  imports: [CoreModule, AuthModule, ScheduleModule.forRoot(), SmsModule],
  controllers: [ShopPluginsController],
  providers: [ShopPluginsService],
})
export class ShopPluginsModule {}
