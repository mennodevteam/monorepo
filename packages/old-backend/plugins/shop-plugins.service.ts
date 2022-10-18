import { Plugin, ShopPlugin, Status } from '@menno/types';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, MoreThan, Repository } from 'typeorm';

@Injectable()
export class ShopPluginsService {
  constructor(
    @InjectRepository(ShopPlugin)
    private shopPluginsRepository: Repository<ShopPlugin>
  ) {}

  async save(shopPlugin: ShopPlugin): Promise<ShopPlugin> {
    const existingShopPlugin = await this.shopPluginsRepository.findOne({
      where: {
        shop: { id: shopPlugin.shop.id },
        plugin: shopPlugin.plugin,
      },
    });
    if (existingShopPlugin) {
      existingShopPlugin.status = shopPlugin.status;
      existingShopPlugin.expiredAt = shopPlugin.expiredAt;
    }

    return await this.shopPluginsRepository.save(
      existingShopPlugin ? existingShopPlugin : shopPlugin
    );
  }

  find(shopId: string): Promise<ShopPlugin[]> {
    return this.shopPluginsRepository.findBy({ shop: { id: shopId } });
  }

  async getAvailablePlugin(shopId: string): Promise<Plugin[]> {
    const shopPlugins: ShopPlugin[] = await this.shopPluginsRepository.find({
      where: {
        shop: { id: shopId },
        status: Status.Active,
        expiredAt: MoreThan(new Date()),
      },
    });
    return shopPlugins.map((x) => x.plugin);
  }

  findAll(): Promise<ShopPlugin[]> {
    return this.shopPluginsRepository.find();
  }
  async delete(id: number): Promise<void> {
    await this.shopPluginsRepository.delete(id);
  }
}
