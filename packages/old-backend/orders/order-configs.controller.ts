import { OrderConfig } from '@menno/types';
import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { OrderConfigsService } from './order-configs.service';

@Controller()
export class OrderConfigsController {
  constructor(private ordersConfigService: OrderConfigsService) {}

  @MessagePattern('orderConfigs/find')
  find(shopId: string): Promise<OrderConfig> {
    return this.ordersConfigService.findOne(shopId);
  }
  @MessagePattern('orderConfigs/save')
  save(orderConfig: OrderConfig): Promise<OrderConfig> {
    return this.ordersConfigService.save(orderConfig);
  }
}
