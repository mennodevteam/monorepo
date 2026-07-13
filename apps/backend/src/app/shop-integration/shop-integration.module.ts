import { Module } from '@nestjs/common';
import { CoreModule } from '../core/core.module';
import { OrdersModule } from '../orders/orders.module';
import { ClubsModule } from '../clubs/clubs.module';
import { SmsModule } from '../sms/sms.module';
import { CampaignsModule } from '../campaigns/campaigns.module';
import { ShopIntegrationController } from './shop-integration.controller';
import { ShopIntegrationMcpController } from './shop-integration-mcp.controller';
import { ShopIntegrationService } from './shop-integration.service';

@Module({
  imports: [CoreModule, OrdersModule, ClubsModule, SmsModule, CampaignsModule],
  controllers: [ShopIntegrationController, ShopIntegrationMcpController],
  providers: [ShopIntegrationService],
  exports: [ShopIntegrationService],
})
export class ShopIntegrationModule {}
