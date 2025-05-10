import { Plugin, Shop, Status } from '@menno/types';
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Redis } from 'ioredis';
import { Repository } from 'typeorm';

export enum RedisKey {
  PrintAction = 'print-action',
  WindowsLocalNotification = 'windows-local-notif',
  PanelMenu = 'panelMenu',
  Menu = 'menu',
  Shop = 'shop',
}

@Injectable()
export class RedisService {
  private readonly redisClient: Redis;

  constructor(
    @InjectRepository(Shop)
    private shopsRepo: Repository<Shop>,
    private http: HttpService,
  ) {
    this.redisClient = new Redis(process.env.REDIS_URI);
  }

  get client() {
    return this.redisClient;
  }

  key(key: RedisKey, id: string) {
    return `${key}-${id}`;
  }

  async updateMenu(shopId: string) {
    try {
      const shop = await this.shopsRepo.findOne({
        where: { id: shopId },
        relations: [
          'menu.categories.products.variants',
          'menu.costs',
          'menu.costs.includeProductCategory',
          'menu.costs.includeProduct',
        ],
      });

      if (shop.menu) {
        const shopMenuRedisKey = this.key(RedisKey.PanelMenu, shop.id);
        await this.client.set(shopMenuRedisKey, JSON.stringify(shop.menu));
        this.client.expire(shopMenuRedisKey, 3600 * 12);
        // this.http
        //   .request({
        //     url: `https://api.menno.pro/menus/${shop.username}`,
        //     method: 'PURGE',
        //     headers: { 'X-Purge-Method': 'PURGE' },
        //   })
        //   .subscribe();

        if (shop.menu.costs) shop.menu.costs = shop.menu.costs.filter((x) => x.status !== Status.Inactive);
        if (shop.menu.categories) {
          shop.menu.categories = shop.menu.categories.filter((x) => x.status !== Status.Inactive);
          for (const cat of shop.menu.categories) {
            if (cat.products) {
              cat.products = cat.products.filter((x) => x.variants?.length > 0 ? x.variants.find(v => v.status !== Status.Inactive) : x.status !== Status.Inactive);
              for (const product of cat.products) {
                if (product.variants)
                  product.variants = product.variants.filter((x) => x.status !== Status.Inactive);
              }
            }
          }
        }
        const redisKey = this.key(RedisKey.Menu, shop.id);
        await this.client.set(redisKey, JSON.stringify(shop.menu));
        this.client.expire(redisKey, 3600 * 12);
        return JSON.stringify(shop.menu);
      }
    } catch (error) {
      return;
    }
    return;
  }

  async updateShop(shopId: string) {
    try {
      const shop = await this.shopsRepo.findOne({
        where: { id: shopId },
        relations: ['region', 'shopGroup', 'appConfig.theme', 'paymentGateway', 'plugins', 'club'],
      });

      // this.http
      //   .request({
      //     url: `https://api.menno.pro/shops/${shop.username}`,
      //     method: 'PURGE',
      //     headers: { 'X-Purge-Method': 'PURGE' },
      //   })
      //   .subscribe();

      if (!(shop.plugins?.plugins?.indexOf(Plugin.Ordering) >= 0)) shop.appConfig.disableOrdering = true;
      const redisKey = this.key(RedisKey.Shop, shop.id);
      await this.client.set(redisKey, JSON.stringify(shop));
      this.client.expire(redisKey, 3600 * 24);
      return JSON.stringify(shop);
    } catch (error) {
      return;
    }
  }
}
