import { Injectable, NotFoundException, ForbiddenException, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import {
  Order,
  Product,
  Shop,
  FilterOrderDto,
  OrderReportDto,
  OrderState,
  User,
  OrderMessageEvent,
  ProductCategory,
  Member,
  FilterMemberV2Dto,
  NewSmsDto,
  Material,
  BillOfMaterial,
  BillOfProduct,
  ProductPackItem,
  InventoryTransaction,
  InventoryTransactionType,
  CostUpdateStrategy,
  MenuCost,
  PurchaseInvoice,
  PurchaseInvoiceItem,
  Stocktaking,
  StocktakingItem,
  Address,
  Region,
  DeliveryType,
  DeliveryArea,
  OrderDto,
  ProductItem,
  MANUAL_DISCOUNT_TITLE,
  MANUAL_COST_TITLE,
  DELIVERY_COST_TITLE,
  ProductType,
  MenuStat,
  StatAction,
  Menu,
  Status,
  ProductVariant,
} from '@menno/types';
import { RedisService } from '../core/redis.service';
import { OrdersService } from '../orders/orders.service';
import { ClubsService } from '../clubs/clubs.service';
import { SmsService } from '../sms/sms.service';
import { CampaignsService } from '../campaigns/campaigns.service';

@Injectable()
export class ShopIntegrationService {
  constructor(
    @InjectRepository(Shop)
    private shopRepo: Repository<Shop>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,
    @InjectRepository(ProductCategory)
    private categoryRepo: Repository<ProductCategory>,
    @InjectRepository(Member)
    private memberRepo: Repository<Member>,
    @InjectRepository(Material)
    private materialRepo: Repository<Material>,
    @InjectRepository(BillOfMaterial)
    private bomRepo: Repository<BillOfMaterial>,
    @InjectRepository(BillOfProduct)
    private bopRepo: Repository<BillOfProduct>,
    @InjectRepository(ProductPackItem)
    private productPackItemRepository: Repository<ProductPackItem>,
    @InjectRepository(InventoryTransaction)
    private inventoryTransactionRepo: Repository<InventoryTransaction>,
    @InjectRepository(MenuCost)
    private costsRepo: Repository<MenuCost>,
    @InjectRepository(PurchaseInvoice)
    private purchaseInvoiceRepo: Repository<PurchaseInvoice>,
    @InjectRepository(PurchaseInvoiceItem)
    private purchaseInvoiceItemRepo: Repository<PurchaseInvoiceItem>,
    @InjectRepository(Stocktaking)
    private stocktakingRepo: Repository<Stocktaking>,
    @InjectRepository(StocktakingItem)
    private stocktakingItemRepo: Repository<StocktakingItem>,
    @InjectRepository(Address)
    private addressRepo: Repository<Address>,
    @InjectRepository(Region)
    private regionRepo: Repository<Region>,
    @InjectRepository(MenuStat)
    private menuStatsRepo: Repository<MenuStat>,
    private redis: RedisService,
    private ordersService: OrdersService,
    private clubsService: ClubsService,
    private smsService: SmsService,
    private campaignsService: CampaignsService,
  ) {}

  private resolveFileUrl(key?: string | null): string {
    if (!key) return '';
    if (key.startsWith('http')) return key;
    const bucketUrl = process.env.PUBLIC_FILE_URL || process.env.BUCKET_URL || 'https://file.menno.pro';
    return `${bucketUrl.replace(/\/+$/, '')}/${key.replace(/^\/+/, '')}`;
  }

  private enrichProductImages(product: Product): {
    imageUrl: string;
    imageUrls: string[];
    imageFiles?: any;
    images: string[];
  } {
    const mainImageFile = Product.mainImageFile(product);
    let primaryUrl = '';

    if (mainImageFile && typeof mainImageFile === 'object') {
      const selectedKey = (mainImageFile as any).md || (mainImageFile as any).origin || (mainImageFile as any).sm || (mainImageFile as any).xs;
      if (selectedKey) {
        primaryUrl = this.resolveFileUrl(selectedKey);
      }
    } else if (product.images && product.images.length > 0) {
      primaryUrl = this.resolveFileUrl(product.images[0]);
    }

    const allUrls: string[] = [];
    const filesArray: any[] = Array.isArray(product.imageFiles)
      ? product.imageFiles
      : product.imageFiles
      ? [product.imageFiles]
      : [];

    for (const f of filesArray) {
      if (f && typeof f === 'object') {
        const key = f.origin || f.md || f.sm || f.xs;
        if (key) {
          const url = this.resolveFileUrl(key);
          if (url && !allUrls.includes(url)) allUrls.push(url);
        }
      }
    }

    if (product.images && Array.isArray(product.images)) {
      for (const img of product.images) {
        if (img) {
          const url = this.resolveFileUrl(img);
          if (url && !allUrls.includes(url)) allUrls.push(url);
        }
      }
    }

    if (primaryUrl) {
      const idx = allUrls.indexOf(primaryUrl);
      if (idx > -1) {
        allUrls.splice(idx, 1);
      }
      allUrls.unshift(primaryUrl);
    } else if (allUrls.length > 0) {
      primaryUrl = allUrls[0];
    }

    const enrichedImageFiles = filesArray.map((f) => ({
      origin: f.origin ? this.resolveFileUrl(f.origin) : undefined,
      md: f.md ? this.resolveFileUrl(f.md) : undefined,
      sm: f.sm ? this.resolveFileUrl(f.sm) : undefined,
      xs: f.xs ? this.resolveFileUrl(f.xs) : undefined,
      xxs: f.xxs ? this.resolveFileUrl(f.xxs) : undefined,
    }));

    return {
      imageUrl: primaryUrl,
      imageUrls: allUrls,
      imageFiles: enrichedImageFiles.length > 0 ? enrichedImageFiles : undefined,
      images: allUrls,
    };
  }

  private isProductFinished(
    product: Product,
    variant?: ProductVariant,
    visited = new Set<string>(),
  ): boolean {
    if (Product.isFinished(product, variant)) {
      return true;
    }

    const packItems = variant?.packItems && variant.packItems.length > 0
      ? variant.packItems
      : product.packItems;

    if (product.type === ProductType.Pack && packItems && packItems.length > 0) {
      const key = `${product.id}_${variant?.id || ''}`;
      if (visited.has(key)) return false;
      const nextVisited = new Set(visited);
      nextVisited.add(key);

      for (const item of packItems) {
        if (
          !item.product ||
          item.product.status === Status.Inactive ||
          (item.variant && item.variant.status === Status.Inactive) ||
          this.isProductFinished(item.product, item.variant, nextVisited)
        ) {
          return true;
        }
      }
    }

    return false;
  }

  private isProductUnavailable(product: Product): boolean {
    const variants = product.variants ?? [];
    if (!variants.length) {
      return this.isProductFinished(product);
    }
    return variants.every((variant) => this.isProductFinished(product, variant));
  }

  private wirePackItems(menu: Menu): void {
    if (!menu.categories) return;

    const productMap = new Map<string, Product>();
    const variantMap = new Map<string, ProductVariant>();

    for (const cat of menu.categories) {
      if (cat.products) {
        for (const prod of cat.products) {
          if (prod.id) productMap.set(String(prod.id), prod);
          if (prod.variants) {
            for (const v of prod.variants) {
              if (v.id) variantMap.set(String(v.id), v);
            }
          }
        }
      }
    }

    const wireList = (items?: any[]) => {
      if (!items) return;
      for (const item of items) {
        const pId = item.product?.id || item.productId;
        if (pId && productMap.has(String(pId))) {
          item.product = productMap.get(String(pId));
        }
        const vId = item.variant?.id || item.variantId;
        if (vId && variantMap.has(String(vId))) {
          item.variant = variantMap.get(String(vId));
        }
      }
    };

    for (const cat of menu.categories) {
      if (cat.products) {
        for (const prod of cat.products) {
          if (prod.type === ProductType.Pack) {
            wireList(prod.packItems);
            if (prod.variants) {
              for (const variant of prod.variants) {
                wireList(variant.packItems);
              }
            }
          }
        }
      }
    }
  }

  private enrichMenuForIntegration(
    menu: Menu,
    activeCampaign: any | null,
    options?: {
      categoryId?: number;
      query?: string;
      onlyAvailable?: boolean;
      includeInactive?: boolean;
      campaignId?: string;
    },
  ) {
    const categories: any[] = [];
    const searchQuery = options?.query?.trim().toLowerCase();

    if (menu.categories) {
      for (const cat of menu.categories) {
        if (options?.categoryId !== undefined && Number(cat.id) !== Number(options.categoryId)) {
          continue;
        }

        if (!options?.includeInactive && cat.status === Status.Inactive) {
          continue;
        }

        const enrichedProducts: any[] = [];

        if (cat.products) {
          for (const product of cat.products) {
            if (!options?.includeInactive && product.status === Status.Inactive) {
              continue;
            }

            if (searchQuery) {
              const titleMatch = product.title?.toLowerCase().includes(searchQuery);
              const descMatch = product.description?.toLowerCase().includes(searchQuery);
              if (!titleMatch && !descMatch) {
                continue;
              }
            }

            const isUnavailable = this.isProductUnavailable(product);
            const isFinished = this.isProductFinished(product);
            const isAvailable = !isUnavailable && product.status === Status.Active && cat.status === Status.Active;

            if (options?.onlyAvailable && !isAvailable) {
              continue;
            }

            const hasDiscount = Product.hasDiscount(product);
            const totalPrice = Product.totalPrice(product);
            const realPrice = Product.realPrice(product);
            const fixedDiscount = Product.fixedDiscount(product);
            const percentageDiscount = Product.percentageDiscount(product);

            let effectivePrice = totalPrice;
            if ((!effectivePrice || effectivePrice === 0) && product.variants && product.variants.length > 0) {
              const variantPrices = product.variants
                .map((v) => Product.totalPrice(product, v))
                .filter((p) => p > 0);
              if (variantPrices.length > 0) {
                effectivePrice = Math.min(...variantPrices);
              }
            }

            const basePrice = product.type === ProductType.Pack
              ? Product.getPackPrice(product)
              : (product.price || effectivePrice);

            const imagesInfo = this.enrichProductImages(product);

            const enrichedVariants = (product.variants || []).map((variant) => {
              const vIsFinished = this.isProductFinished(product, variant);
              const vIsAvailable = !vIsFinished && variant.status === Status.Active && product.status === Status.Active && cat.status === Status.Active;
              const vHasDiscount = Product.hasDiscount(product, variant);
              const vTotalPrice = Product.totalPrice(product, variant);
              const vRealPrice = Product.realPrice(product, variant);
              const vFixedDiscount = Product.fixedDiscount(product, variant);
              const vPercentageDiscount = Product.percentageDiscount(product, variant);

              let variantPackItems: any[] | undefined = undefined;
              if (product.type === ProductType.Pack && variant.packItems && variant.packItems.length > 0) {
                variantPackItems = variant.packItems.map((item) => {
                  const childProduct = item.product;
                  const childVariant = item.variant;
                  const childUnitPrice = childVariant
                    ? childVariant.price
                    : (childProduct?.price || 0);
                  const childIsFinished = childProduct ? this.isProductFinished(childProduct, childVariant) : true;
                  const childIsAvailable = childProduct
                    ? !childIsFinished && childProduct.status === Status.Active && (!childVariant || childVariant.status === Status.Active)
                    : false;

                  return {
                    productId: childProduct?.id,
                    productTitle: childProduct?.title,
                    variantId: childVariant?.id,
                    variantTitle: childVariant?.title,
                    quantity: item.quantity,
                    unitPrice: childUnitPrice,
                    isAvailable: childIsAvailable,
                  };
                });
              }

              return {
                id: variant.id,
                title: variant.title,
                description: variant.description,
                price: vTotalPrice,
                basePrice: variant.price || vTotalPrice,
                realPrice: vRealPrice,
                totalPrice: vTotalPrice,
                hasDiscount: vHasDiscount,
                discountAmount: vFixedDiscount,
                discountPercent: vPercentageDiscount,
                status: variant.status,
                stock: variant.stock ?? null,
                isAvailable: vIsAvailable,
                isFinished: vIsFinished,
                packItems: variantPackItems,
              };
            });

            let enrichedPackItems: any[] | undefined = undefined;
            if (product.type === ProductType.Pack && product.packItems && product.packItems.length > 0) {
              enrichedPackItems = product.packItems.map((item) => {
                const childProduct = item.product;
                const childVariant = item.variant;
                const childUnitPrice = childVariant
                  ? childVariant.price
                  : (childProduct?.price || 0);
                const childIsFinished = childProduct ? this.isProductFinished(childProduct, childVariant) : true;
                const childIsAvailable = childProduct
                  ? !childIsFinished && childProduct.status === Status.Active && (!childVariant || childVariant.status === Status.Active)
                  : false;

                return {
                  productId: childProduct?.id,
                  productTitle: childProduct?.title,
                  variantId: childVariant?.id,
                  variantTitle: childVariant?.title,
                  quantity: item.quantity,
                  unitPrice: childUnitPrice,
                  isAvailable: childIsAvailable,
                };
              });
            }

            let priceRange: { min: number; max: number } | undefined = undefined;
            if (enrichedVariants.length > 1) {
              const prices = enrichedVariants.map((v) => v.price);
              priceRange = { min: Math.min(...prices), max: Math.max(...prices) };
            }

            enrichedProducts.push({
              id: product.id,
              title: product.title,
              description: product.description,
              type: product.type || ProductType.Standard,
              category: { id: cat.id, title: cat.title },
              price: effectivePrice,
              basePrice,
              realPrice,
              totalPrice,
              priceRange,
              hasDiscount,
              discountAmount: fixedDiscount,
              discountPercent: percentageDiscount,
              isAvailable,
              isFinished,
              status: product.status,
              stock: product.stock ?? null,
              imageUrl: imagesInfo.imageUrl,
              imageUrls: imagesInfo.imageUrls,
              imageFiles: imagesInfo.imageFiles,
              images: imagesInfo.images,
              variants: enrichedVariants,
              packItems: enrichedPackItems,
            });
          }
        }

        if (!options?.includeInactive && enrichedProducts.length === 0 && (!cat.products || cat.products.length === 0)) {
          continue;
        }

        categories.push({
          id: cat.id,
          title: cat.title,
          description: cat.description,
          status: cat.status,
          isAvailable: cat.status === Status.Active,
          products: enrichedProducts,
        });
      }
    }

    return {
      id: menu.id,
      title: menu.title,
      currency: 'تومان',
      _guideForAiAgents: {
        imagesNote: 'فیلد imageUrl حاوی آدرس مستقیم و کامل عکس اصلی است. فیلد images دپریکیت شده است.',
        pricingNote: 'فیلد price و totalPrice قیمت نهایی قابل پرداخت به تومان با احتساب تخفیف‌ها است. فیلد realPrice قیمت اصلی خط‌خورده قبل از تخفیف است.',
        availabilityNote: 'فیلد isAvailable مشخص می‌کند محصول هم‌اکنون موجود و قابل سفارش است یا خیر.',
      },
      activeCampaign: activeCampaign
        ? {
            id: activeCampaign.id,
            title: activeCampaign.title,
            startDate: activeCampaign.startDate,
            endDate: activeCampaign.endDate,
            actions: activeCampaign.actions,
          }
        : null,
      categories,
    };
  }

  async getMenu(shopId: string, options?: {
    categoryId?: number;
    query?: string;
    onlyAvailable?: boolean;
    includeInactive?: boolean;
    campaignId?: string;
  }) {
    const menuRedisData = await this.redis.updateMenu(shopId, true);
    if (!menuRedisData) {
      throw new NotFoundException('Menu not found for this shop');
    }
    const menu: Menu = JSON.parse(menuRedisData);

    let activeCampaign = null;
    try {
      if (options?.campaignId) {
        activeCampaign = await this.campaignsService.findOne(options.campaignId, shopId);
      } else {
        activeCampaign = await this.campaignsService.getActiveCampaign(shopId);
      }
    } catch (e) {
      // Fallback
    }

    Menu.setRefsAndSort(
      menu,
      undefined,
      options?.includeInactive ?? false,
      false,
      undefined,
      false,
      activeCampaign || undefined,
    );

    this.wirePackItems(menu);

    return this.enrichMenuForIntegration(menu, activeCampaign, options);
  }

  private mapPackItems(packItems: any[]): any[] {
    if (!packItems) return [];
    return packItems.map((item: any) => ({
      id: item.id || undefined,
      product: item.productId ? { id: item.productId } : undefined,
      variant: item.variantId ? { id: item.variantId } : null,
      quantity: Number(item.quantity || 1),
    }));
  }

  async createProduct(shopId: string, dto: Partial<Product>) {
    const shop = await this.shopRepo.findOne({ where: { id: shopId }, relations: ['menu'] });
    if (!shop || !shop.menu) {
      throw new NotFoundException('Shop or shop menu not found');
    }

    if (!dto.category?.id) {
      throw new HttpException('category.id is required', HttpStatus.BAD_REQUEST);
    }

    // Process pack items if type is pack
    if (dto.type === ProductType.Pack) {
      dto.price = 0;
      if (dto.packItems) {
        dto.packItems = this.mapPackItems(dto.packItems) as any;
      }
      if (dto.variants) {
        for (const variant of dto.variants) {
          variant.price = 0;
          if (variant.packItems) {
            variant.packItems = this.mapPackItems(variant.packItems);
          }
        }
      }
    } else {
      dto.packItems = [];
      if (dto.variants) {
        for (const variant of dto.variants) {
          variant.packItems = [];
        }
      }
    }

    const newProduct = this.productRepo.create({
      ...dto,
      category: { id: dto.category.id, menu: shop.menu },
    });

    const saved = await this.productRepo.save(newProduct);
    await this.redis.updateMenu(shopId);
    return saved;
  }

  async updateProduct(shopId: string, productId: string, dto: Partial<Product>) {
    const shop = await this.shopRepo.findOne({ where: { id: shopId }, relations: ['menu'] });
    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    // Verify product belongs to this shop's menu
    const existing = await this.productRepo.findOne({
      where: {
        id: productId,
        category: { menu: { id: shop.menu?.id } },
      },
      relations: ['variants'],
    });

    if (!existing) {
      throw new NotFoundException('Product not found in this shop');
    }

    // Process pack items
    const isPack = dto.type === ProductType.Pack || (!dto.type && existing.type === ProductType.Pack);

    if (isPack) {
      dto.price = 0;

      // Delete existing BOMs and BOPs of the product and its variants
      await this.bomRepo.delete({ product: { id: productId } });
      await this.bopRepo.delete({ product: { id: productId } });
      if (existing.variants && existing.variants.length > 0) {
        const variantIds = existing.variants.map((v) => v.id);
        await this.bomRepo.delete({ variant: { id: In(variantIds) } });
        await this.bopRepo.delete({ variant: { id: In(variantIds) } });
      }

      if (dto.packItems) {
        // Delete old pack items of product
        await this.productPackItemRepository.delete({ parentProduct: { id: productId } });
        dto.packItems = this.mapPackItems(dto.packItems) as any;
      }
      if (dto.variants) {
        for (const variant of dto.variants) {
          variant.price = 0;
          if (variant.packItems) {
            if (variant.id) {
              await this.productPackItemRepository.delete({ parentVariant: { id: variant.id } });
            }
            variant.packItems = this.mapPackItems(variant.packItems);
          }
        }
      }
    } else {
      if (dto.packItems !== undefined) {
        await this.productPackItemRepository.delete({ parentProduct: { id: productId } });
        dto.packItems = [];
      }
      if (dto.variants) {
        for (const variant of dto.variants) {
          if (variant.packItems !== undefined) {
            if (variant.id) {
              await this.productPackItemRepository.delete({ parentVariant: { id: variant.id } });
            }
            variant.packItems = [];
          }
        }
      }
    }

    // Update fields
    const updated = await this.productRepo.save({
      ...existing,
      ...dto,
      id: productId, // ensure ID is not changed
    });

    await this.redis.updateMenu(shopId);
    return updated;
  }

  async getOrders(shopId: string, filters: FilterOrderDto) {
    filters.shopId = shopId;
    // Call the existing orders service filter method
    return this.ordersService.filter(filters, [
      'items.product',
      'items.productVariant',
      'customer',
      'waiter',
      'creator',
      'campaign',
    ]);
  }

  async updateOrderCampaign(shopId: string, orderId: string, campaignId: string | null) {
    return this.ordersService.updateOrderCampaign(orderId, shopId, campaignId);
  }

  async updateOrderState(shopId: string, orderId: string, state: number, waiterId?: string) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId, shop: { id: shopId } },
      relations: ['waiter'],
    });

    if (!order) {
      throw new NotFoundException('Order not found in this shop');
    }

    order.state = state as OrderState;
    if (waiterId && !order.waiter) {
      order.waiter = { id: waiterId } as User;
    }

    await this.orderRepo.save(order);
    
    // Trigger existing side effects (like SMS sending)
    this.ordersService.checkAfterUpdateOrderMessage(orderId, OrderMessageEvent.OnChangeState);
    
    return order;
  }

  async getSalesReport(shopId: string, query: { fromDate?: string; toDate?: string; groupBy?: string }) {
    const dto: OrderReportDto = {
      shopId,
      fromDate: query.fromDate ? new Date(query.fromDate) : undefined,
      toDate: query.toDate ? new Date(query.toDate) : undefined,
      groupBy: (query.groupBy || 'date') as any,
    };
    return this.ordersService.report(dto);
  }

  async createCategory(shopId: string, dto: Partial<ProductCategory>) {
    const shop = await this.shopRepo.findOne({ where: { id: shopId }, relations: ['menu'] });
    if (!shop || !shop.menu) {
      throw new NotFoundException('Shop or shop menu not found');
    }

    const newCategory = this.categoryRepo.create({
      ...dto,
      menu: shop.menu,
    });

    const saved = await this.categoryRepo.save(newCategory);
    await this.redis.updateMenu(shopId);
    return saved;
  }

  async updateCategory(shopId: string, categoryId: number, dto: Partial<ProductCategory>) {
    const shop = await this.shopRepo.findOne({ where: { id: shopId }, relations: ['menu'] });
    if (!shop || !shop.menu) {
      throw new NotFoundException('Shop or shop menu not found');
    }

    const existing = await this.categoryRepo.findOne({
      where: {
        id: categoryId,
        menu: { id: shop.menu.id },
      },
    });

    if (!existing) {
      throw new NotFoundException('Category not found in this shop');
    }

    const updated = await this.categoryRepo.save({
      ...existing,
      ...dto,
      id: categoryId,
    });

    await this.redis.updateMenu(shopId);
    return updated;
  }

  async getCustomers(shopId: string, filters: FilterMemberV2Dto) {
    const shop = await this.shopRepo.findOne({
      where: { id: shopId },
      relations: ['club', 'menu'],
    });
    if (!shop || !shop.club) {
      throw new NotFoundException('Shop or club not found');
    }

    return this.clubsService.filterMembersV2(filters, shop);
  }

  async createOrUpdateCustomer(shopId: string, dto: Partial<Member>) {
    const shop = await this.shopRepo.findOne({
      where: { id: shopId },
      relations: ['club'],
    });
    if (!shop || !shop.club) {
      throw new NotFoundException('Shop or club not found');
    }

    const member = {
      ...dto,
      club: shop.club,
    } as Member;

    if (member.tags) {
      for (const t of member.tags) {
        if (!t.id) t.club = shop.club;
      }
    }

    return this.clubsService.saveMember(member);
  }

  async sendCustomerSms(shopId: string, dto: { receptors?: string[]; message: string; filter?: FilterMemberV2Dto }) {
    const shop = await this.shopRepo.findOne({
      where: { id: shopId },
      relations: ['smsAccount', 'club', 'menu'],
    });

    if (!shop || !shop.smsAccount) {
      throw new NotFoundException('Shop or SMS account not found');
    }

    let receptors: string[] = [];
    let messages: string[] = [];

    if (dto.receptors && dto.receptors.length > 0) {
      receptors = [...dto.receptors];
      messages = dto.receptors.map(() => dto.message);
    } else if (dto.filter) {
      const members = await this.clubsService.filterMembersV2(dto.filter, shop);
      const pairs = members.data
        .map((row) => ({
          phone: row.member.user?.mobilePhone,
          message: dto.message.replace('@@@', User.fullName(row.member.user)),
        }))
        .filter((row): row is { phone: string; message: string } => !!row.phone);

      receptors = pairs.map((p) => p.phone);
      messages = pairs.map((p) => p.message);
    } else {
      throw new HttpException('Either receptors or filter must be provided', HttpStatus.BAD_REQUEST);
    }

    if (receptors.length === 0) {
      return { count: 0, status: 'No receptors found' };
    }

    const newSmsDto: NewSmsDto = {
      receptors,
      messages,
      accountId: shop.smsAccount.id,
    };

    return this.smsService.send(newSmsDto);
  }

  // Materials management
  async getMaterials(shopId: string) {
    return this.materialRepo.find({
      where: { shop: { id: shopId } },
      relations: ['boms', 'boms.product', 'boms.variant'],
      order: { createdAt: 'DESC' },
    });
  }

  async createOrUpdateMaterial(shopId: string, dto: Partial<Material>) {
    const shop = await this.shopRepo.findOneBy({ id: shopId });
    if (!shop) {
      throw new NotFoundException('Shop not found');
    }
    return this.materialRepo.save({ ...dto, shop });
  }

  async deleteMaterial(shopId: string, id: string) {
    const material = await this.materialRepo.findOne({ where: { id, shop: { id: shopId } } });
    if (!material) {
      throw new NotFoundException('Material not found in this shop');
    }
    return this.materialRepo.delete(id);
  }

  // BOM management
  async getBoms(shopId: string) {
    return this.bomRepo.find({
      where: { material: { shop: { id: shopId } } },
      relations: ['material', 'product', 'variant'],
    });
  }

  async createOrUpdateBom(shopId: string, dto: Partial<BillOfMaterial>) {
    if (dto.material?.id) {
      const material = await this.materialRepo.findOne({ where: { id: dto.material.id, shop: { id: shopId } } });
      if (!material) {
        throw new NotFoundException('Material not found in this shop');
      }
    }
    return this.bomRepo.save({ ...dto, shop: { id: shopId } });
  }

  async deleteBom(shopId: string, id: string) {
    const bom = await this.bomRepo.findOne({ where: { id, material: { shop: { id: shopId } } } });
    if (!bom) {
      throw new NotFoundException('BOM entry not found in this shop');
    }
    return this.bomRepo.delete(id);
  }

  // BOP management
  async getBops(shopId: string) {
    return this.bopRepo.find({
      where: { shop: { id: shopId } },
      relations: ['productSource', 'variantSource', 'product', 'variant'],
    });
  }

  async createOrUpdateBop(shopId: string, dto: Partial<BillOfProduct>) {
    return this.bopRepo.save({ ...dto, shop: { id: shopId } });
  }

  async deleteBop(shopId: string, id: string) {
    const bop = await this.bopRepo.findOne({ where: { id, shop: { id: shopId } } });
    if (!bop) {
      throw new NotFoundException('BOP entry not found in this shop');
    }
    return this.bopRepo.delete(id);
  }

  // Inventory Transactions
  async createInventoryTransaction(shopId: string, dto: Partial<InventoryTransaction>) {
    const shop = await this.shopRepo.findOneBy({ id: shopId });
    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    if (!dto.material?.id) {
      throw new HttpException('material.id is required', HttpStatus.BAD_REQUEST);
    }
    const material = await this.materialRepo.findOne({ where: { id: dto.material.id, shop: { id: shopId } } });
    if (!material) {
      throw new NotFoundException('Material not found in this shop');
    }

    const transaction = await this.inventoryTransactionRepo.save({ ...dto, shop });

    if (dto.type === InventoryTransactionType.Consumption) {
      await this.materialRepo.decrement({ id: dto.material.id }, 'stock', dto.quantity);
    } else if (dto.type === InventoryTransactionType.Purchase) {
      await this.materialRepo.update(dto.material.id, {
        stock: () => `stock + ${dto.quantity}`,
        cost: () => {
          if (dto.unitPrice && dto.costUpdateStrategy === CostUpdateStrategy.Last)
            return dto.unitPrice.toString();
          if (dto.unitPrice && dto.costUpdateStrategy === CostUpdateStrategy.Average)
            return `CASE WHEN cost IS NULL THEN ${dto.unitPrice} ELSE ((stock * cost + ${dto.quantity} * ${dto.unitPrice}) / (stock + ${dto.quantity})) END`;
          return 'cost';
        },
      });
    } else if (dto.type === InventoryTransactionType.Adjustment) {
      await this.materialRepo.update(dto.material.id, { stock: dto.quantity });
    }

    return transaction;
  }

  async getProductCostsAndProfit(shopId: string) {
    const shop = await this.shopRepo.findOne({
      where: { id: shopId },
      relations: [
        'menu.categories.products.variants',
      ],
    });

    if (!shop || !shop.menu) {
      throw new NotFoundException('Shop or shop menu not found');
    }

    const boms = await this.bomRepo.find({
      where: { material: { shop: { id: shopId } } },
      relations: ['material', 'product', 'variant'],
    });

    const menuId = shop.menu.id;
    const packItems = await this.productPackItemRepository.find({
      where: [
        { parentProduct: { category: { menu: { id: menuId } } } },
        { parentVariant: { product: { category: { menu: { id: menuId } } } } },
      ],
      relations: ['product', 'variant', 'parentProduct', 'parentVariant'],
    });

    const result: Array<{
      productId: string;
      productTitle: string;
      variantId?: number;
      variantTitle?: string;
      salesPrice: number;
      costPrice: number | null;
      grossProfit: number | null;
      profitMarginPercent: number | null;
    }> = [];

    if (shop.menu.categories) {
      for (const cat of shop.menu.categories) {
        if (cat.products) {
          for (const product of cat.products) {
            if (product.variants && product.variants.length > 0) {
              for (const variant of product.variants) {
                const cost = Product.calculateCost(product, variant, boms, packItems);
                let salesPrice = variant.price;
                if (product.type === ProductType.Pack) {
                  const items = packItems.filter((pi) => pi.parentVariant?.id === variant.id);
                  const packPrice = items.reduce((acc, it) => acc + (it.variant ? it.variant.price : (it.product?.price || 0)) * (it.quantity || 1), 0);
                  if (packPrice > 0) salesPrice = packPrice;
                }
                const grossProfit = cost !== null ? salesPrice - cost : null;
                const profitMarginPercent = (cost !== null && salesPrice > 0) ? Math.round((grossProfit / salesPrice) * 100) : null;

                result.push({
                  productId: product.id,
                  productTitle: product.title,
                  variantId: variant.id,
                  variantTitle: variant.title,
                  salesPrice,
                  costPrice: cost,
                  grossProfit,
                  profitMarginPercent,
                });
              }
            } else {
              const cost = Product.calculateCost(product, null, boms, packItems);
              let salesPrice = product.price;
              if (product.type === ProductType.Pack) {
                const items = packItems.filter((pi) => pi.parentProduct?.id === product.id);
                const packPrice = items.reduce((acc, it) => acc + (it.variant ? it.variant.price : (it.product?.price || 0)) * (it.quantity || 1), 0);
                if (packPrice > 0) salesPrice = packPrice;
              }
              const grossProfit = cost !== null ? salesPrice - cost : null;
              const profitMarginPercent = (cost !== null && salesPrice > 0) ? Math.round((grossProfit / salesPrice) * 100) : null;

              result.push({
                productId: product.id,
                productTitle: product.title,
                salesPrice,
                costPrice: cost,
                grossProfit,
                profitMarginPercent,
              });
            }
          }
        }
      }
    }

    return result;
  }

  async getMenuCosts(shopId: string) {
    const shop = await this.shopRepo.findOne({ where: { id: shopId }, relations: ['menu'] });
    if (!shop || !shop.menu) {
      throw new NotFoundException('Shop or shop menu not found');
    }
    return this.costsRepo.find({
      where: { menu: { id: shop.menu.id } },
      relations: ['includeProductCategory', 'includeProduct'],
      order: { createdAt: 'ASC' },
    });
  }

  async createOrUpdateMenuCost(shopId: string, dto: Partial<MenuCost>) {
    const shop = await this.shopRepo.findOne({ where: { id: shopId }, relations: ['menu'] });
    if (!shop || !shop.menu) {
      throw new NotFoundException('Shop or shop menu not found');
    }

    if (dto.id) {
      const existing = await this.costsRepo.findOne({
        where: { id: dto.id, menu: { id: shop.menu.id } },
      });
      if (!existing) {
        throw new NotFoundException('Menu cost not found in this shop');
      }
    }

    if (dto.includeProductCategory && dto.includeProductCategory.length > 0) {
      const catIds = dto.includeProductCategory.map((c) => c.id);
      const count = await this.categoryRepo.count({
        where: { id: In(catIds), menu: { id: shop.menu.id } },
      });
      if (count !== catIds.length) {
        throw new HttpException('Some product categories do not belong to this shop', HttpStatus.BAD_REQUEST);
      }
    }

    if (dto.includeProduct && dto.includeProduct.length > 0) {
      const prodIds = dto.includeProduct.map((p) => p.id);
      const count = await this.productRepo.count({
        where: { id: In(prodIds), category: { menu: { id: shop.menu.id } } },
      });
      if (count !== prodIds.length) {
        throw new HttpException('Some products do not belong to this shop', HttpStatus.BAD_REQUEST);
      }
    }

    const saved = await this.costsRepo.save({
      ...dto,
      menu: shop.menu,
    });

    await this.redis.updateMenu(shopId);
    return saved;
  }

  async deleteMenuCost(shopId: string, id: number) {
    const shop = await this.shopRepo.findOne({ where: { id: shopId }, relations: ['menu'] });
    if (!shop || !shop.menu) {
      throw new NotFoundException('Shop or shop menu not found');
    }

    const cost = await this.costsRepo.findOne({
      where: { id, menu: { id: shop.menu.id } },
    });
    if (!cost) {
      throw new NotFoundException('Menu cost not found in this shop');
    }

    await this.costsRepo.delete(id);
    await this.redis.updateMenu(shopId);
    return { success: true };
  }

  // Purchase Invoices
  async getPurchaseInvoices(shopId: string) {
    return this.purchaseInvoiceRepo.find({
      where: { shop: { id: shopId } },
      relations: ['items', 'items.material'],
      order: { date: 'DESC', createdAt: 'DESC' },
    });
  }

  async createPurchaseInvoice(shopId: string, dto: Partial<PurchaseInvoice>) {
    const shop = await this.shopRepo.findOneBy({ id: shopId });
    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    const invoice = this.purchaseInvoiceRepo.create({
      date: dto.date || new Date(),
      supplier: dto.supplier,
      description: dto.description,
      shop: shop,
    });
    const savedInvoice = await this.purchaseInvoiceRepo.save(invoice);

    const savedItems: PurchaseInvoiceItem[] = [];
    for (const itemDto of dto.items || []) {
      if (!itemDto.material?.id) continue;
      const material = await this.materialRepo.findOne({
        where: { id: itemDto.material.id, shop: { id: shopId } },
      });
      if (!material) continue;

      const previousStock = material.stock;
      const previousCost = material.cost;

      let newCost = material.cost;
      const qty = itemDto.quantity || 0;
      const price = itemDto.unitPrice || 0;
      const strategy = itemDto.costUpdateStrategy || CostUpdateStrategy.Last;

      if (strategy === CostUpdateStrategy.Last) {
        newCost = price;
      } else if (strategy === CostUpdateStrategy.Average) {
        const currentStock = material.stock || 0;
        const currentCost = material.cost || 0;
        if (material.cost === null || material.cost === undefined) {
          newCost = price;
        } else {
          newCost = (currentStock * currentCost + qty * price) / (currentStock + qty);
        }
      }

      await this.materialRepo.update(material.id, {
        stock: material.stock + qty,
        cost: newCost,
      });

      const invoiceItem = this.purchaseInvoiceItemRepo.create({
        purchaseInvoice: savedInvoice,
        material: material,
        quantity: qty,
        unitPrice: price,
        costUpdateStrategy: strategy,
        previousStock: previousStock,
        previousCost: previousCost,
      });
      savedItems.push(await this.purchaseInvoiceItemRepo.save(invoiceItem));
    }

    savedInvoice.items = savedItems;
    return savedInvoice;
  }

  async deletePurchaseInvoice(shopId: string, id: string, revertStock: boolean) {
    const invoice = await this.purchaseInvoiceRepo.findOne({
      where: { id, shop: { id: shopId } },
      relations: ['items', 'items.material'],
    });
    if (!invoice) {
      throw new NotFoundException('Purchase invoice not found');
    }

    if (revertStock) {
      for (const item of invoice.items || []) {
        if (item.material) {
          const updateData: any = {
            stock: () => `stock - ${item.quantity}`,
          };
          if (item.previousCost !== null && item.previousCost !== undefined) {
            updateData.cost = item.previousCost;
          }
          await this.materialRepo.update(item.material.id, updateData);
        }
      }
    }

    return this.purchaseInvoiceRepo.delete(id);
  }

  // Stocktakings
  async getStocktakings(shopId: string) {
    return this.stocktakingRepo.find({
      where: { shop: { id: shopId } },
      relations: ['items', 'items.material'],
      order: { date: 'DESC', createdAt: 'DESC' },
    });
  }

  async createStocktaking(shopId: string, dto: Partial<Stocktaking>) {
    const shop = await this.shopRepo.findOneBy({ id: shopId });
    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    const stocktaking = this.stocktakingRepo.create({
      date: dto.date || new Date(),
      description: dto.description,
      shop: shop,
    });
    const savedStocktaking = await this.stocktakingRepo.save(stocktaking);

    const savedItems: StocktakingItem[] = [];
    for (const itemDto of dto.items || []) {
      if (!itemDto.material?.id) continue;
      const material = await this.materialRepo.findOne({
        where: { id: itemDto.material.id, shop: { id: shopId } },
      });
      if (!material) continue;

      const previousStock = material.stock;

      await this.materialRepo.update(material.id, {
        stock: itemDto.countedQuantity,
      });

      const stocktakingItem = this.stocktakingItemRepo.create({
        stocktaking: savedStocktaking,
        material: material,
        countedQuantity: itemDto.countedQuantity,
        previousStock: previousStock,
      });
      savedItems.push(await this.stocktakingItemRepo.save(stocktakingItem));
    }

    savedStocktaking.items = savedItems;
    return savedStocktaking;
  }

  async deleteStocktaking(shopId: string, id: string, revertStock: boolean) {
    const stocktaking = await this.stocktakingRepo.findOne({
      where: { id, shop: { id: shopId } },
      relations: ['items', 'items.material'],
    });
    if (!stocktaking) {
      throw new NotFoundException('Stocktaking not found');
    }

    if (revertStock) {
      for (const item of stocktaking.items || []) {
        if (item.material && item.previousStock !== null && item.previousStock !== undefined) {
          await this.materialRepo.update(item.material.id, {
            stock: item.previousStock,
          });
        }
      }
    }

    return this.stocktakingRepo.delete(id);
  }

  async createOrder(shopId: string, dto: Partial<OrderDto>) {
    dto.shopId = shopId;
    dto.isManual = true;
    if (dto.type === undefined) {
      dto.type = 1; // Delivery
    }
    return this.ordersService.addOrder(dto as OrderDto);
  }

  async updateOrderItems(shopId: string, orderId: string, productItems: ProductItem[]) {
    throw new ForbiddenException('Editing order items is not allowed');
  }

  async updateOrderProperties(
    shopId: string,
    orderId: string,
    properties: {
      state?: number;
      extraCosts?: number;
    },
  ) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId, shop: { id: shopId } },
    });

    if (!order) {
      throw new NotFoundException('Order not found in this shop');
    }

    let changed = false;

    if (properties.extraCosts !== undefined) {
      order.extraCosts = properties.extraCosts;
      changed = true;
    }

    if (properties.state !== undefined && properties.state !== order.state) {
      order.state = properties.state;
      changed = true;
    }

    if (changed) {
      await this.orderRepo.save(order);
      if (properties.state !== undefined) {
        this.ordersService.checkAfterUpdateOrderMessage(orderId, OrderMessageEvent.OnChangeState);
      }
    }

    return this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['items.product', 'items.productVariant', 'customer'],
    });
  }
  async updateOrderCustomer(shopId: string, orderId: string, memberId: string | null) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId, shop: { id: shopId } },
      relations: ['customer'],
    });

    if (!order) {
      throw new NotFoundException('Order not found in this shop');
    }

    if (!memberId) {
      order.customer = null;
    } else {
      const member = await this.memberRepo.findOne({
        where: { id: memberId },
        relations: ['user'],
      });
      if (!member) {
        throw new NotFoundException('Customer/Member not found');
      }
      order.customer = member.user;
    }

    await this.orderRepo.save(order);
    return order;
  }

  async getCustomerAddresses(shopId: string, memberId: string) {
    const member = await this.memberRepo.findOne({
      where: { id: memberId },
      relations: ['user'],
    });
    if (!member) {
      throw new NotFoundException('Customer/Member not found');
    }

    return this.addressRepo.find({
      where: { user: { id: member.user.id } },
      relations: ['region'],
      order: { id: 'DESC' },
    });
  }

  async createCustomerAddress(
    shopId: string,
    memberId: string,
    dto: {
      description: string;
      regionId: string;
      title?: string;
      latitude?: number;
      longitude?: number;
      unit?: string;
      ring?: string;
      postalCode?: string;
    },
  ) {
    const member = await this.memberRepo.findOne({
      where: { id: memberId },
      relations: ['user'],
    });
    if (!member) {
      throw new NotFoundException('Customer/Member not found');
    }

    if (!dto.regionId) {
      throw new HttpException('regionId (city) is required', HttpStatus.BAD_REQUEST);
    }

    const region = await this.regionRepo.findOneBy({ id: dto.regionId });
    if (!region) {
      throw new NotFoundException('Region/City not found');
    }

    const address = new Address();
    address.user = member.user;
    address.region = region;
    address.description = dto.description;
    address.title = dto.title;
    address.latitude = dto.latitude;
    address.longitude = dto.longitude;
    address.unit = dto.unit;
    address.ring = dto.ring;
    address.postalCode = dto.postalCode;

    const shop = await this.shopRepo.findOne({
      where: { id: shopId },
      relations: ['deliveryAreas.region', 'appConfig'],
    });

    if (shop) {
      const deliveryType = shop.appConfig?.deliveryType;
      const deliveryAreas = shop.deliveryAreas || [];
      if ((!deliveryType || deliveryType === DeliveryType.Standard) && address.latitude && address.longitude) {
        address.deliveryArea = DeliveryArea.isInWitchArea(deliveryAreas, [address.latitude, address.longitude]);
      } else if (deliveryType === DeliveryType.Post && address.region) {
        address.deliveryArea = DeliveryArea.isInWitchArea(deliveryAreas, undefined, address.region);
      }
    }

    return this.addressRepo.save(address);
  }

  async getRegions() {
    return this.regionRepo.find({
      order: { title: 'ASC' },
    });
  }

  async getAnalyticsViews(shopId: string, fromDate?: Date, toDate?: Date) {
    const shop = await this.shopRepo.findOne({ where: { id: shopId }, relations: ['menu', 'club'] });
    if (!shop || !shop.menu) {
      throw new NotFoundException('Menu not found for this shop');
    }
    const from = fromDate || new Date(new Date().setDate(new Date().getDate() - 30));
    const to = toDate || new Date();

    const menuStatResult = await this.menuStatsRepo
      .createQueryBuilder('stat')
      .select(`DATE_TRUNC('day', stat.createdAt AT TIME ZONE 'Asia/Tehran')`, 'day')
      .addSelect('CAST(COUNT(DISTINCT stat.user) AS INTEGER)', 'count')
      .where('stat.createdAt BETWEEN :from AND :to', { from, to })
      .andWhere('stat.action = :action', { action: StatAction.LoadMenu })
      .andWhere('stat.menuId = :menuId', { menuId: shop.menu.id })
      .groupBy('day')
      .orderBy('day')
      .getRawMany();

    const memberResult = shop.club?.id
      ? await this.memberRepo
          .createQueryBuilder('member')
          .select(`DATE_TRUNC('day', member.joinedAt AT TIME ZONE 'Asia/Tehran')`, 'day')
          .addSelect('CAST(COUNT(member.id) AS INTEGER)', 'count')
          .where('member.joinedAt BETWEEN :from AND :to', { from, to })
          .andWhere('member.clubId = :clubId', { clubId: shop.club.id })
          .groupBy('day')
          .orderBy('day')
          .getRawMany()
      : [];

    const dailyBreakdown = [];
    const current = new Date(from);
    current.setHours(current.getHours() + 5);
    const end = new Date(to);

    let totalViews = 0;
    let totalMembers = 0;

    while (current <= end) {
      const dateStr = current.toLocaleDateString('en-CA');
      const menuCount = menuStatResult.find((item) => item.day.toLocaleDateString('en-CA') === dateStr)?.count || 0;
      const memberCount = memberResult.find((item) => item.day.toLocaleDateString('en-CA') === dateStr)?.count || 0;
      totalViews += menuCount;
      totalMembers += memberCount;
      dailyBreakdown.push({
        date: dateStr,
        menuViews: menuCount,
        clubMemberSignups: memberCount,
      });
      current.setDate(current.getDate() + 1);
    }

    return {
      fromDate: from.toISOString(),
      toDate: to.toISOString(),
      totalViews,
      totalClubMemberSignups: totalMembers,
      dailyBreakdown,
    };
  }

  async getAnalyticsUserRetention(shopId: string, fromDate?: Date, toDate?: Date) {
    const shop = await this.shopRepo.findOne({ where: { id: shopId }, relations: ['menu'] });
    if (!shop || !shop.menu) {
      throw new NotFoundException('Menu not found for this shop');
    }
    const from = fromDate || new Date(new Date().setDate(new Date().getDate() - 30));
    const to = toDate || new Date();

    const totalUniqueUsers = await this.menuStatsRepo
      .createQueryBuilder('stat')
      .select('CAST(COUNT(DISTINCT stat.user) AS INTEGER)', 'uniqueUserCount')
      .where('stat.createdAt BETWEEN :from AND :to', { from, to })
      .andWhere('stat.action = :action', { action: StatAction.LoadMenu })
      .andWhere('stat.menuId = :menuId', { menuId: shop.menu.id })
      .getRawOne();

    const retentionCount = await this.menuStatsRepo
      .createQueryBuilder('stat')
      .select('CAST(COUNT(DISTINCT stat.user) AS INTEGER)', 'retentionCount')
      .where('stat.createdAt BETWEEN :from AND :to', { from, to })
      .andWhere('stat.action = :action', { action: StatAction.LoadMenu })
      .andWhere('stat.menuId = :menuId', { menuId: shop.menu.id })
      .andWhere(
        `stat.user IN (SELECT DISTINCT ms."userId" FROM menu_stat ms WHERE ms."createdAt" < :from AND ms.action = :action AND ms."menuId" = :menuId)`,
        { from, action: StatAction.LoadMenu, menuId: shop.menu.id },
      )
      .getRawOne();

    const uniqueUsers = parseInt(totalUniqueUsers?.uniqueUserCount) || 0;
    const returningUsers = parseInt(retentionCount?.retentionCount) || 0;
    const newUsers = Math.max(0, uniqueUsers - returningUsers);
    const retentionRatePercent = uniqueUsers > 0 ? Number(((returningUsers / uniqueUsers) * 100).toFixed(2)) : 0;

    return {
      fromDate: from.toISOString(),
      toDate: to.toISOString(),
      uniqueUserCount: uniqueUsers,
      newUserCount: newUsers,
      returningUserCount: returningUsers,
      retentionRatePercent,
    };
  }

  async getAnalyticsConversionFunnel(shopId: string, fromDate?: Date, toDate?: Date) {
    const shop = await this.shopRepo.findOne({ where: { id: shopId }, relations: ['menu'] });
    if (!shop || !shop.menu) {
      throw new NotFoundException('Menu not found for this shop');
    }
    const from = fromDate || new Date(new Date().setDate(new Date().getDate() - 30));
    const to = toDate || new Date();

    const getCountForAction = async (action: StatAction) => {
      const res = await this.menuStatsRepo
        .createQueryBuilder('stat')
        .select('CAST(COUNT(DISTINCT stat.user) AS INTEGER)', 'count')
        .where('stat.createdAt BETWEEN :from AND :to', { from, to })
        .andWhere('stat.action = :action', { action })
        .andWhere('stat.menuId = :menuId', { menuId: shop.menu.id })
        .getRawOne();
      return parseInt(res?.count) || 0;
    };

    const loadMenu = await getCountForAction(StatAction.LoadMenu);
    const addToCart = await getCountForAction(StatAction.AddToCart);
    const viewCart = await getCountForAction(StatAction.ViewCart);
    const viewCheckout = await getCountForAction(StatAction.ViewCheckout);
    const selectAddress = await getCountForAction(StatAction.SelectAddress);
    const addOrder = await getCountForAction(StatAction.AddOrder);

    const ordersStat = await this.orderRepo
      .createQueryBuilder('order')
      .select('CAST(COUNT(order.id) AS INTEGER)', 'completedOrdersCount')
      .addSelect('COALESCE(SUM(order.totalPrice), 0)', 'totalRevenueToman')
      .where('order.shopId = :shopId', { shopId: shop.id })
      .andWhere('order.deletedAt IS NULL')
      .andWhere('order.mergeToId IS NULL')
      .andWhere('order.createdAt BETWEEN :from AND :to', { from, to })
      .getRawOne();

    const completedOrders = parseInt(ordersStat?.completedOrdersCount) || 0;
    const totalRevenueToman = Number(ordersStat?.totalRevenueToman) || 0;
    const overallConversionRatePercent = loadMenu > 0 ? Number(((addOrder / loadMenu) * 100).toFixed(2)) : 0;
    const averageOrderValueToman = completedOrders > 0 ? Math.round(totalRevenueToman / completedOrders) : 0;

    return {
      fromDate: from.toISOString(),
      toDate: to.toISOString(),
      funnelSteps: {
        loadMenu,
        addToCart,
        viewCart,
        viewCheckout,
        selectAddress,
        addOrder,
      },
      completedOrdersCount: completedOrders,
      totalRevenueToman,
      averageOrderValueToman,
      overallConversionRatePercent,
    };
  }

  async getAnalyticsTrafficSources(shopId: string, fromDate?: Date, toDate?: Date) {
    const shop = await this.shopRepo.findOne({ where: { id: shopId }, relations: ['menu'] });
    if (!shop || !shop.menu) {
      throw new NotFoundException('Menu not found for this shop');
    }
    const from = fromDate || new Date(new Date().setDate(new Date().getDate() - 30));
    const to = toDate || new Date();

    const menuStatByRef = await this.menuStatsRepo
      .createQueryBuilder('stat')
      .select('stat.referrer', 'referrer')
      .addSelect('stat.utmSource', 'utmSource')
      .addSelect('stat.utmCampaign', 'utmCampaign')
      .addSelect('stat.utmMedium', 'utmMedium')
      .addSelect('CAST(COUNT(DISTINCT COALESCE(CAST(stat.user AS VARCHAR), stat.guestId, CAST(stat.id AS VARCHAR))) AS INTEGER)', 'count')
      .where('stat.createdAt BETWEEN :from AND :to', { from, to })
      .andWhere('stat.action = :action', { action: StatAction.LoadMenu })
      .andWhere('stat.menuId = :menuId', { menuId: shop.menu.id })
      .groupBy('stat.referrer')
      .addGroupBy('stat.utmSource')
      .addGroupBy('stat.utmCampaign')
      .addGroupBy('stat.utmMedium')
      .orderBy('count', 'DESC')
      .getRawMany();

    const sourcesMap: Record<string, number> = {};
    const utmCampaignsMap: Record<string, number> = {};
    let totalTrackedVisitors = 0;

    menuStatByRef.forEach(({ referrer, utmSource, utmCampaign, count }) => {
      const c = Number(count) || 0;
      if (c === 0) return;
      let source = 'direct';

      if (utmSource) {
        source = utmSource.toLowerCase().trim();
      } else if (referrer) {
        try {
          const url = new URL(referrer);
          const hostParts = url.hostname.split('.');
          source = hostParts.length >= 3 ? hostParts[hostParts.length - 2] : hostParts[0];
        } catch (e) {
          source = 'direct';
        }
      }

      if (utmCampaign) {
        utmCampaignsMap[utmCampaign] = (utmCampaignsMap[utmCampaign] || 0) + c;
      }

      sourcesMap[source] = (sourcesMap[source] || 0) + c;
      totalTrackedVisitors += c;
    });

    return {
      fromDate: from.toISOString(),
      toDate: to.toISOString(),
      totalTrackedVisitors,
      sourcesBreakdown: sourcesMap,
      utmCampaignsBreakdown: utmCampaignsMap,
    };
  }

  async getRawMenuStats(
    shopId: string,
    filters: {
      fromDate?: Date;
      toDate?: Date;
      actions?: StatAction[];
      productId?: string;
      userId?: string;
      referrer?: string;
      utmSource?: string;
      utmCampaign?: string;
      utmMedium?: string;
      groupBy?: 'none' | 'product' | 'action' | 'date' | 'user' | 'utm';
      take?: number;
      skip?: number;
    },
  ) {
    const shop = await this.shopRepo.findOne({ where: { id: shopId }, relations: ['menu'] });
    if (!shop || !shop.menu) {
      throw new NotFoundException('Menu not found for this shop');
    }

    const from = filters.fromDate || new Date(new Date().setDate(new Date().getDate() - 30));
    const to = filters.toDate || new Date();
    const groupBy = filters.groupBy || 'none';
    const take = Math.min(filters.take || 50, 500);
    const skip = filters.skip || 0;

    const baseQb = this.menuStatsRepo
      .createQueryBuilder('stat')
      .leftJoin('stat.product', 'product')
      .leftJoin('stat.user', 'user')
      .where('stat.menuId = :menuId', { menuId: shop.menu.id })
      .andWhere('stat.createdAt BETWEEN :from AND :to', { from, to });

    if (filters.actions && filters.actions.length > 0) {
      baseQb.andWhere('stat.action IN (:...actions)', { actions: filters.actions });
    }

    if (filters.productId) {
      baseQb.andWhere('stat.productId = :productId', { productId: filters.productId });
    }

    if (filters.userId) {
      baseQb.andWhere('stat.userId = :userId', { userId: filters.userId });
    }

    if (filters.referrer) {
      baseQb.andWhere('stat.referrer ILIKE :referrer', { referrer: `%${filters.referrer}%` });
    }

    if (filters.utmSource) {
      baseQb.andWhere('stat.utmSource ILIKE :utmSource', { utmSource: `%${filters.utmSource}%` });
    }

    if (filters.utmCampaign) {
      baseQb.andWhere('stat.utmCampaign ILIKE :utmCampaign', { utmCampaign: `%${filters.utmCampaign}%` });
    }

    if (filters.utmMedium) {
      baseQb.andWhere('stat.utmMedium ILIKE :utmMedium', { utmMedium: `%${filters.utmMedium}%` });
    }

    if (groupBy === 'product') {
      const productStats = await baseQb
        .select('stat.productId', 'productId')
        .addSelect('product.title', 'productTitle')
        .addSelect('product.price', 'productPriceToman')
        .addSelect(`COUNT(CASE WHEN stat.action = 'CLICK_PRODUCT' THEN 1 END)`, 'clickCount')
        .addSelect(`COUNT(CASE WHEN stat.action = 'ADD_TO_CART' THEN 1 END)`, 'addToCartCount')
        .addSelect('COUNT(stat.id)', 'totalEventsCount')
        .groupBy('stat.productId')
        .addGroupBy('product.title')
        .addGroupBy('product.price')
        .orderBy('clickCount', 'DESC')
        .limit(take)
        .offset(skip)
        .getRawMany();

      return {
        fromDate: from.toISOString(),
        toDate: to.toISOString(),
        groupBy: 'product',
        productStats: productStats.map((p) => ({
          productId: p.productId,
          productTitle: p.productTitle || 'نامشخص',
          productPriceToman: Number(p.productPriceToman) || 0,
          clickCount: Number(p.clickCount) || 0,
          addToCartCount: Number(p.addToCartCount) || 0,
          totalEventsCount: Number(p.totalEventsCount) || 0,
        })),
      };
    }

    if (groupBy === 'action') {
      const actionStats = await baseQb
        .select('stat.action', 'action')
        .addSelect('COUNT(stat.id)', 'count')
        .addSelect('CAST(COUNT(DISTINCT COALESCE(CAST(stat.user AS VARCHAR), stat.guestId, CAST(stat.id AS VARCHAR))) AS INTEGER)', 'uniqueUsersCount')
        .groupBy('stat.action')
        .orderBy('count', 'DESC')
        .getRawMany();

      return {
        fromDate: from.toISOString(),
        toDate: to.toISOString(),
        groupBy: 'action',
        actionStats: actionStats.map((a) => ({
          action: a.action,
          count: Number(a.count) || 0,
          uniqueUsersCount: Number(a.uniqueUsersCount) || 0,
        })),
      };
    }

    if (groupBy === 'user') {
      const userStats = await baseQb
        .select('stat.userId', 'userId')
        .addSelect('user.firstName', 'firstName')
        .addSelect('user.lastName', 'lastName')
        .addSelect('user.mobilePhone', 'mobilePhone')
        .addSelect('COUNT(stat.id)', 'totalEventsCount')
        .addSelect('MAX(stat.createdAt)', 'lastEventAt')
        .groupBy('stat.userId')
        .addGroupBy('user.firstName')
        .addGroupBy('user.lastName')
        .addGroupBy('user.mobilePhone')
        .orderBy('totalEventsCount', 'DESC')
        .limit(take)
        .offset(skip)
        .getRawMany();

      return {
        fromDate: from.toISOString(),
        toDate: to.toISOString(),
        groupBy: 'user',
        userStats: userStats.map((u) => ({
          userId: u.userId,
          name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'کاربر ناشناس',
          mobilePhone: u.mobilePhone || null,
          totalEventsCount: Number(u.totalEventsCount) || 0,
          lastEventAt: u.lastEventAt ? new Date(u.lastEventAt).toISOString() : null,
        })),
      };
    }

    if (groupBy === 'date') {
      const dateStats = await baseQb
        .select(`DATE_TRUNC('day', stat.createdAt AT TIME ZONE 'Asia/Tehran')`, 'day')
        .addSelect('COUNT(stat.id)', 'totalEventsCount')
        .addSelect('CAST(COUNT(DISTINCT COALESCE(CAST(stat.user AS VARCHAR), stat.guestId, CAST(stat.id AS VARCHAR))) AS INTEGER)', 'uniqueUsersCount')
        .groupBy('day')
        .orderBy('day', 'ASC')
        .getRawMany();

      return {
        fromDate: from.toISOString(),
        toDate: to.toISOString(),
        groupBy: 'date',
        dateStats: dateStats.map((d) => ({
          date: d.day ? new Date(d.day).toLocaleDateString('en-CA') : null,
          totalEventsCount: Number(d.totalEventsCount) || 0,
          uniqueUsersCount: Number(d.uniqueUsersCount) || 0,
        })),
      };
    }

    if (groupBy === 'utm') {
      const utmStats = await baseQb
        .select('stat.utmCampaign', 'campaign')
        .addSelect('stat.utmSource', 'source')
        .addSelect('stat.utmMedium', 'medium')
        .addSelect(`COUNT(CASE WHEN stat.action = '${StatAction.LoadMenu}' THEN 1 END)`, 'visits')
        .addSelect(`COUNT(CASE WHEN stat.action = '${StatAction.ClickProduct}' THEN 1 END)`, 'clicks')
        .addSelect(`COUNT(CASE WHEN stat.action = '${StatAction.AddToCart}' THEN 1 END)`, 'cartAdds')
        .addSelect(`COUNT(CASE WHEN stat.action = '${StatAction.AddOrder}' THEN 1 END)`, 'orderEvents')
        .addSelect('CAST(COUNT(DISTINCT COALESCE(CAST(stat.user AS VARCHAR), stat.guestId, CAST(stat.id AS VARCHAR))) AS INTEGER)', 'uniqueVisitors')
        .where('(stat.utmCampaign IS NOT NULL OR stat.utmSource IS NOT NULL)')
        .groupBy('stat.utmCampaign')
        .addGroupBy('stat.utmSource')
        .addGroupBy('stat.utmMedium')
        .orderBy('visits', 'DESC')
        .limit(take)
        .offset(skip)
        .getRawMany();

      return {
        fromDate: from.toISOString(),
        toDate: to.toISOString(),
        groupBy: 'utm',
        utmStats: utmStats.map((u) => ({
          campaign: u.campaign || '—',
          source: u.source || '—',
          medium: u.medium || '—',
          visits: Number(u.visits) || 0,
          clicks: Number(u.clicks) || 0,
          cartAdds: Number(u.cartAdds) || 0,
          orderEvents: Number(u.orderEvents) || 0,
          uniqueVisitors: Number(u.uniqueVisitors) || 0,
        })),
      };
    }

    // Default: groupBy === 'none' -> Return raw log items
    const [stats, totalCount] = await baseQb
      .select([
        'stat.id',
        'stat.action',
        'stat.referrer',
        'stat.campaign',
        'stat.utmSource',
        'stat.utmMedium',
        'stat.utmCampaign',
        'stat.utmTerm',
        'stat.utmContent',
        'stat.guestId',
        'stat.value',
        'stat.createdAt',
        'product.id',
        'product.title',
        'product.price',
        'user.id',
        'user.firstName',
        'user.lastName',
        'user.mobilePhone',
      ])
      .orderBy('stat.createdAt', 'DESC')
      .take(take)
      .skip(skip)
      .getManyAndCount();

    return {
      fromDate: from.toISOString(),
      toDate: to.toISOString(),
      totalCount,
      take,
      skip,
      groupBy: 'none',
      stats: stats.map((s) => ({
        id: s.id,
        createdAt: s.createdAt?.toISOString(),
        action: s.action,
        referrer: s.referrer || null,
        campaign: s.campaign || null,
        utmSource: s.utmSource || null,
        utmMedium: s.utmMedium || null,
        utmCampaign: s.utmCampaign || null,
        utmTerm: s.utmTerm || null,
        utmContent: s.utmContent || null,
        guestId: s.guestId || null,
        value: s.value || null,
        product: s.product
          ? {
              id: s.product.id,
              title: s.product.title,
              priceToman: s.product.price,
            }
          : null,
        user: s.user
          ? {
              id: s.user.id,
              name: `${s.user.firstName || ''} ${s.user.lastName || ''}`.trim() || 'کاربر ناشناس',
              mobilePhone: s.user.mobilePhone || null,
            }
          : null,
      })),
    };
  }

  async getUtmCampaignsReport(shopId: string, fromDate?: Date, toDate?: Date) {
    const shop = await this.shopRepo.findOne({ where: { id: shopId }, relations: ['menu'] });
    if (!shop || !shop.menu) {
      throw new NotFoundException('Menu not found for this shop');
    }
    const from = fromDate || new Date(new Date().setDate(new Date().getDate() - 30));
    const to = toDate || new Date();

    const stats = await this.menuStatsRepo
      .createQueryBuilder('stat')
      .select('stat.utmCampaign', 'campaign')
      .addSelect('stat.utmSource', 'source')
      .addSelect('stat.utmMedium', 'medium')
      .addSelect(`COUNT(CASE WHEN stat.action = '${StatAction.LoadMenu}' THEN 1 END)`, 'visits')
      .addSelect(`COUNT(CASE WHEN stat.action = '${StatAction.ClickProduct}' THEN 1 END)`, 'clicks')
      .addSelect(`COUNT(CASE WHEN stat.action = '${StatAction.AddToCart}' THEN 1 END)`, 'cartAdds')
      .addSelect('CAST(COUNT(DISTINCT COALESCE(CAST(stat.user AS VARCHAR), stat.guestId, CAST(stat.id AS VARCHAR))) AS INTEGER)', 'uniqueVisitors')
      .where('stat.createdAt BETWEEN :from AND :to', { from, to })
      .andWhere('stat.menuId = :menuId', { menuId: shop.menu.id })
      .andWhere('(stat.utmCampaign IS NOT NULL OR stat.utmSource IS NOT NULL)')
      .groupBy('stat.utmCampaign')
      .addGroupBy('stat.utmSource')
      .addGroupBy('stat.utmMedium')
      .getRawMany();

    const orders = await this.orderRepo
      .createQueryBuilder('order')
      .select(`order.details::jsonb ->> 'utmCampaign'`, 'campaign')
      .addSelect(`order.details::jsonb ->> 'utmSource'`, 'source')
      .addSelect(`order.details::jsonb ->> 'utmMedium'`, 'medium')
      .addSelect('COUNT(order.id)', 'orderCount')
      .addSelect('COALESCE(SUM(order.totalPrice), 0)', 'totalSales')
      .where('order.shop = :shopId', { shopId: shop.id })
      .andWhere('order.createdAt BETWEEN :from AND :to', { from, to })
      .andWhere('order.deletedAt IS NULL')
      .andWhere('order.mergeToId IS NULL')
      .andWhere('order.excludeFromReports = :excludeFromReports', { excludeFromReports: false })
      .andWhere(
        `order.details IS NOT NULL AND trim(order.details::text) <> '' AND (order.details::jsonb ->> 'utmCampaign' IS NOT NULL OR order.details::jsonb ->> 'utmSource' IS NOT NULL)`,
      )
      .groupBy(`order.details::jsonb ->> 'utmCampaign'`)
      .addGroupBy(`order.details::jsonb ->> 'utmSource'`)
      .addGroupBy(`order.details::jsonb ->> 'utmMedium'`)
      .getRawMany();

    const map = new Map<string, any>();
    const makeKey = (c?: string, s?: string, m?: string) => `${c || ''}___${s || ''}___${m || ''}`;

    for (const s of stats) {
      const key = makeKey(s.campaign, s.source, s.medium);
      map.set(key, {
        campaign: s.campaign || '—',
        source: s.source || '—',
        medium: s.medium || '—',
        visits: parseInt(s.visits) || 0,
        clicks: parseInt(s.clicks) || 0,
        cartAdds: parseInt(s.cartAdds) || 0,
        uniqueVisitors: parseInt(s.uniqueVisitors) || 0,
        orderCount: 0,
        totalSales: 0,
      });
    }

    for (const o of orders) {
      const key = makeKey(o.campaign, o.source, o.medium);
      const existing = map.get(key) || {
        campaign: o.campaign || '—',
        source: o.source || '—',
        medium: o.medium || '—',
        visits: 0,
        clicks: 0,
        cartAdds: 0,
        uniqueVisitors: 0,
        orderCount: 0,
        totalSales: 0,
      };
      existing.orderCount = parseInt(o.orderCount) || 0;
      existing.totalSales = parseFloat(o.totalSales) || 0;
      map.set(key, existing);
    }

    const campaigns = Array.from(map.values())
      .map((row) => ({
        ...row,
        conversionRatePercent: row.visits > 0 ? Math.round((row.orderCount / row.visits) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.visits + b.orderCount - (a.visits + a.orderCount));

    return {
      fromDate: from.toISOString(),
      toDate: to.toISOString(),
      totalCampaigns: campaigns.length,
      campaigns,
    };
  }
}
