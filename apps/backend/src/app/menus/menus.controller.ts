import { Menu, OrderType, Product, Shop, Status } from '@menno/types';
import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { Public } from '../auth/public.decorator';
import { LoginUser } from '../auth/user.decorator';
import { AuthPayload } from '../core/types/auth-payload';
import { MenusService } from './menu.service';
import { RedisKey, RedisService } from '../core/redis.service';

@Controller('menus')
export class MenusController {
  constructor(
    @InjectRepository(Shop)
    private shopsRepo: Repository<Shop>,
    @InjectRepository(Menu)
    private menusRepo: Repository<Menu>,
    private auth: AuthService,
    private menuService: MenusService,
    private redis: RedisService,
  ) {}

  @Get()
  async getPanelMenu(@LoginUser() user: AuthPayload): Promise<Menu> {
    let shop = await this.auth.getPanelUserShop(user);
    if (shop) {
      const redisKey = this.redis.key(RedisKey.PanelMenu, shop.id);
      const data = await this.redis.client.get(redisKey);
      console.log(data)
      if (data) {
        return JSON.parse(data);
      }
      shop = await this.shopsRepo.findOne({
        where: { id: shop.id },
        relations: [
          'menu.categories.products.variants',
          'menu.costs',
          'menu.costs.includeProductCategory',
          'menu.costs.includeProduct',
        ],
      });
      this.redis.updateMenu(shop.id);
    }
    return shop.menu;
  }

  @Public()
  @Get('sync/:prevCode')
  async syncMenu(@Param('prevCode') prevCode: string) {
    const shop = await this.shopsRepo.findOne({
      where: { prevServerCode: prevCode },
      relations: ['menu'],
    });

    this.menuService.syncMenu(shop.menu.id, prevCode);
    this.redis.updateMenu(shop.id);
  }

  @Public()
  @Get(':query')
  async findOne(@Param('query') query: string): Promise<Menu> {
    const shop = await this.shopsRepo.findOne({
      where: [{ domain: query }, { username: query }, { code: query }],
      select: ['id'],
    });

    if (shop) {
      const redisKey = this.redis.key(RedisKey.Menu, shop.id);
      let data = await this.redis.client.get(redisKey);
      if (!data) data = await this.redis.updateMenu(shop.id);
      const menu = JSON.parse(data);
      return menu;
    }
    return;
  }

  @Public()
  @HttpCode(200)
  @Post('torob/:shopId/products')
  async torobProducts(
    @Body() dto: { page_unique?: string; page_url?: string; page?: number },
    @Param('shopId') shopId: string,
  ) {
    const shop = await this.shopsRepo.findOne({
      where: { id: shopId },
      relations: [
        'menu.categories.products.variants',
        'menu.costs',
        'menu.costs.includeProductCategory',
        'menu.costs.includeProduct',
      ],
    });

    if (shop?.menu) {
      Menu.setRefsAndSort(shop.menu, undefined, true);
      const products = Menu.getProductList(shop.menu);
      products.sort((a, b) => new Date(b.updatedAt).valueOf() - new Date(a.updatedAt).valueOf());
      const torobProducts = products.map((p) => ({
        title: p.title,
        page_unique: p.id,
        current_price: Product.totalPrice(p, p.variants[0]),
        old_price: Product.hasDiscount(p, p.variants[0]) ? Product.realPrice(p, p.variants[0]) : undefined,
        availability:
          p.status === Status.Active && !Product.isFinished(p, p.variants[0]) ? 'instock' : undefined,
        category_name: p.category.title,
        image_link: Product.mainImageFile(p)
          ? `https://menno.storage.iran.liara.space/${Product.mainImageFile(p).origin}`
          : undefined,
        // image_links: ['https://domain.com/images/test.jpg', 'https://domain.com/images/test-2.jpg'],
        page_url: `${Shop.appLink(shop, process.env.APP_ORIGIN)}/menu/product/${p.id}`,
        short_desc: p.description,
      }));

      if (dto.page_url)
        return {
          count: 1,
          max_pages: 1,
          products: [torobProducts.find((item) => item.page_url === dto.page_url)],
        };
      if (dto.page_unique)
        return {
          count: 1,
          max_pages: 1,
          products: [torobProducts.find((item) => item.page_unique === dto.page_unique)],
        };

      const page = dto.page || 1;
      const pageSize = 100;
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedProducts = torobProducts.slice(startIndex, endIndex);

      return {
        count: torobProducts.length,
        max_pages: Math.ceil(torobProducts.length / 100),
        products: paginatedProducts,
      };
    }
  }
}
