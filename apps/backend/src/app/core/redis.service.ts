import { Plugin, Shop, Status, ThirdPartyApp } from '@menno/types';
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

const CUSTOMER_SSR_HTML_PREFIX = 'customer-ssr-html:';
const CUSTOMER_SITEMAP_PREFIX = 'customer-sitemap:';

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

  private customerCacheHosts(shop: Pick<Shop, 'username' | 'domain'>): string[] {
    const hosts = new Set<string>();
    const appOrigin = (process.env.APP_ORIGIN ?? 'menno.pro').split(':')[0].toLowerCase();

    if (shop.domain) {
      const domain = shop.domain.toLowerCase().replace(/^www\./, '');
      hosts.add(domain);
      hosts.add(`www.${domain}`);
    }

    if (shop.username) {
      hosts.add(`${shop.username}.${appOrigin}`);
      hosts.add(`${shop.username}.localhost`);
    }

    return [...hosts];
  }

  private async deleteKeysByPattern(pattern: string): Promise<void> {
    let cursor = '0';
    do {
      const [nextCursor, keys] = await this.client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = nextCursor;
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } while (cursor !== '0');
  }

  async clearCustomerSsrCache(shopId: string): Promise<void> {
    try {
      const shop = await this.shopsRepo.findOne({
        where: { id: shopId },
        select: ['id', 'username', 'domain'],
      });
      if (!shop) {
        return;
      }

      for (const host of this.customerCacheHosts(shop)) {
        await this.client.del(`${CUSTOMER_SITEMAP_PREFIX}${host}`);
        await this.deleteKeysByPattern(`${CUSTOMER_SSR_HTML_PREFIX}${host}:*`);
      }
    } catch {
      // Cache purge failures must not block shop/menu updates
    }
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
              cat.products = cat.products.filter((x) =>
                x.variants?.length > 0
                  ? x.variants.find((v) => v.status !== Status.Inactive)
                  : x.status !== Status.Inactive,
              );
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
    } finally {
      await this.clearCustomerSsrCache(shopId);
    }
    return;
  }

  async updateShop(shopId: string) {
    try {
      const shop = await this.shopsRepo.findOne({
        where: { id: shopId },
        relations: [
          'region',
          'shopGroup',
          'appConfig.theme',
          'paymentGateway',
          'plugins',
          'club',
          'aiChatbot',
          'thirdParties',
        ],
      });

      // this.http
      //   .request({
      //     url: `https://api.menno.pro/shops/${shop.username}`,
      //     method: 'PURGE',
      //     headers: { 'X-Purge-Method': 'PURGE' },
      //   })
      //   .subscribe();

      if (shop?.thirdParties) {
        shop.thirdParties = shop.thirdParties.filter((x) => x.app === ThirdPartyApp.Clarity);
      }

      if (!(shop.plugins?.plugins?.indexOf(Plugin.Ordering) >= 0)) shop.appConfig.disableOrdering = true;
      const redisKey = this.key(RedisKey.Shop, shop.id);
      await this.client.set(redisKey, JSON.stringify(shop));
      this.client.expire(redisKey, 3600 * 24);
      return JSON.stringify(shop);
    } catch (error) {
      return;
    } finally {
      await this.clearCustomerSsrCache(shopId);
    }
  }
}
