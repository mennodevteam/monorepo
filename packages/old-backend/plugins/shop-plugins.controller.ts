import { Plugin, ShopPlugin } from '@menno/types';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ShopPluginsService } from './shop-plugins.service';

@Controller('shop-plugins')
export class ShopPluginsController {
  constructor(private shopPluginsService: ShopPluginsService) {}

  @MessagePattern('shopPlugins/save')
  save(@Payload() shopPlugin: ShopPlugin): Promise<ShopPlugin> {
    return this.shopPluginsService.save(shopPlugin);
  }

  @MessagePattern('shopPlugins/find')
  find(@Payload() shop: string): Promise<ShopPlugin[]> {
    return this.shopPluginsService.find(shop);
  }

  @MessagePattern('shopPlugins/actives')
  activePlugins(@Payload() shop: string): Promise<Plugin[]> {
    return this.shopPluginsService.getAvailablePlugin(shop);
  }

  @MessagePattern('shopPlugins/getAllPlugins')
  findAll(): Promise<ShopPlugin[]> {
    return this.shopPluginsService.findAll();
  }
  @MessagePattern('shopPlugins/delete')
  delete(id: number): Promise<any> {
    return this.shopPluginsService.delete(id);
  }
}
