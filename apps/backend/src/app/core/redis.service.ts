import { Plugin, Shop, Status, ThirdPartyApp, Product, ProductCategory, ProductVariant, ProductPackItem } from '@menno/types';
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Redis } from 'ioredis';
import { Repository, In } from 'typeorm';

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
    @InjectRepository(Product)
    private productsRepo: Repository<Product>,
    @InjectRepository(ProductPackItem)
    private packItemsRepo: Repository<ProductPackItem>,
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
        await this.client.del(`customer-manifest:${host}`);
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
          'menu.categories',
          'menu.costs',
          'menu.costs.includeProductCategory',
          'menu.costs.includeProduct',
        ],
      });

      if (!shop || !shop.menu) return;

      const menu = shop.menu;

      if (menu.categories && menu.categories.length > 0) {
        const categoryIds = menu.categories.map((c) => c.id);

        // Fetch products with variants and category for mapping
        const products = await this.productsRepo.find({
          where: { category: { id: In(categoryIds) } },
          relations: ['variants', 'category'],
        });

        const productIds = products.map((p) => p.id);
        const variantIds = products.flatMap((p) => p.variants || []).map((v) => v.id);

        let packItems: ProductPackItem[] = [];
        if (productIds.length > 0 || variantIds.length > 0) {
          const whereClause: any[] = [];
          if (productIds.length > 0) {
            whereClause.push({ parentProduct: { id: In(productIds) } });
          }
          if (variantIds.length > 0) {
            whereClause.push({ parentVariant: { id: In(variantIds) } });
          }

          packItems = await this.packItemsRepo.find({
            where: whereClause,
            relations: ['product.variants', 'variant', 'parentProduct', 'parentVariant'],
          });
        }

        // Stitch everything together in memory
        const productMap = new Map<string, Product>();
        for (const p of products) {
          p.packItems = [];
          if (p.variants) {
            for (const v of p.variants) {
              v.packItems = [];
            }
          }
          productMap.set(p.id, p);
        }

        const variantMap = new Map<number, ProductVariant>();
        for (const p of products) {
          if (p.variants) {
            for (const v of p.variants) {
              variantMap.set(v.id, v);
            }
          }
        }

        for (const item of packItems) {
          if (item.parentProduct && item.parentProduct.id) {
            const parentProduct = productMap.get(item.parentProduct.id);
            if (parentProduct) {
              parentProduct.packItems = parentProduct.packItems || [];
              parentProduct.packItems.push(item);
            }
          }
          if (item.parentVariant && item.parentVariant.id) {
            const parentVariant = variantMap.get(item.parentVariant.id);
            if (parentVariant) {
              parentVariant.packItems = parentVariant.packItems || [];
              parentVariant.packItems.push(item);
            }
          }
        }

        const categoryMap = new Map<number, ProductCategory>();
        for (const c of menu.categories) {
          c.products = [];
          categoryMap.set(c.id, c);
        }

        for (const p of products) {
          if (p.category && p.category.id) {
            const category = categoryMap.get(p.category.id);
            if (category) {
              category.products.push(p);
            }
          }
        }
      }

      // Save to Redis
      const shopMenuRedisKey = this.key(RedisKey.PanelMenu, shop.id);
      await this.client.set(shopMenuRedisKey, JSON.stringify(shop.menu));
      this.client.expire(shopMenuRedisKey, 3600 * 12);

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
    } catch (error) {
      console.error('Error updating menu cache:', error);
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
