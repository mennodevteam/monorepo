import { ShopIntegrationService } from './shop-integration.service';
import { Menu, Product, ProductType, Status, MenuCost } from '@menno/types';

describe('ShopIntegrationService.getMenu', () => {
  let service: ShopIntegrationService;
  let mockRedis: any;
  let mockCampaignsService: any;

  beforeEach(() => {
    mockRedis = {
      updateMenu: jest.fn(),
    };
    mockCampaignsService = {
      getActiveCampaign: jest.fn(),
      findOne: jest.fn(),
    };

    service = new ShopIntegrationService(
      {} as any, // shopRepo
      {} as any, // productRepo
      {} as any, // orderRepo
      {} as any, // categoryRepo
      {} as any, // memberRepo
      {} as any, // materialRepo
      {} as any, // bomRepo
      {} as any, // bopRepo
      {} as any, // productPackItemRepository
      {} as any, // inventoryTransactionRepo
      {} as any, // costsRepo
      {} as any, // purchaseInvoiceRepo
      {} as any, // purchaseInvoiceItemRepo
      {} as any, // stocktakingRepo
      {} as any, // stocktakingItemRepo
      {} as any, // addressRepo
      {} as any, // regionRepo
      {} as any, // menuStatsRepo
      mockRedis,
      {} as any, // ordersService
      {} as any, // clubsService
      {} as any, // smsService
      mockCampaignsService,
    );
  });

  const createBaseMenu = () => {
    const menu = new Menu();
    menu.id = 'menu-1';
    menu.title = 'Test Menu';
    menu.costs = [];

    const cat1: any = {
      id: 10,
      title: 'Food',
      status: Status.Active,
      products: [],
    };

    const pStandard = new Product();
    pStandard.id = 'p-standard';
    pStandard.title = 'Cheeseburger';
    pStandard.price = 100000;
    pStandard.type = ProductType.Standard;
    pStandard.status = Status.Active;
    pStandard.stock = 10;
    pStandard.imageFiles = [
      {
        md: 'products/cheeseburger_md.webp',
        origin: 'products/cheeseburger_origin.webp',
      } as any,
    ];
    pStandard.variants = [];
    pStandard.costs = [];

    const pFries = new Product();
    pFries.id = 'p-fries';
    pFries.title = 'French Fries';
    pFries.price = 50000;
    pFries.type = ProductType.Standard;
    pFries.status = Status.Active;
    pFries.stock = 5;
    pFries.variants = [];
    pFries.costs = [];

    const pPack = new Product();
    pPack.id = 'p-pack';
    pPack.title = 'Combo Pack';
    pPack.price = 0; // In DB, pack price is 0!
    pPack.type = ProductType.Pack;
    pPack.status = Status.Active;
    pPack.stock = null;
    pPack.packItems = [
      { product: pStandard, quantity: 1 } as any,
      { product: pFries, quantity: 2 } as any, // 100k + (2 * 50k) = 200k
    ];
    pPack.variants = [];
    pPack.costs = [];

    cat1.products = [pStandard, pFries, pPack];
    menu.categories = [cat1];

    return { menu, cat1, pStandard, pFries, pPack };
  };

  it('1. should calculate pack price dynamically instead of returning 0', async () => {
    const { menu } = createBaseMenu();
    mockRedis.updateMenu.mockResolvedValue(JSON.stringify(menu));
    mockCampaignsService.getActiveCampaign.mockResolvedValue(null);

    const result = await service.getMenu('shop-1');

    const pack = result.categories[0].products.find((p: any) => p.id === 'p-pack');
    expect(pack).toBeDefined();
    // 100,000 + (2 * 50,000) = 200,000
    expect(pack.price).toBe(200000);
    expect(pack.totalPrice).toBe(200000);
    expect(pack.basePrice).toBe(200000);
    expect(pack.isAvailable).toBe(true);
    expect(pack.isFinished).toBe(false);
    expect(pack.packItems.length).toBe(2);
    expect(pack.packItems[0].productTitle).toBe('Cheeseburger');
    expect(pack.packItems[1].productTitle).toBe('French Fries');
  });

  it('2. should mark pack as finished/unavailable when a child item is out of stock', async () => {
    const { menu, pFries } = createBaseMenu();
    pFries.stock = 0; // Fries ran out!
    mockRedis.updateMenu.mockResolvedValue(JSON.stringify(menu));
    mockCampaignsService.getActiveCampaign.mockResolvedValue(null);

    const result = await service.getMenu('shop-1');

    const pack = result.categories[0].products.find((p: any) => p.id === 'p-pack');
    expect(pack.isAvailable).toBe(false);
    expect(pack.isFinished).toBe(true);

    const friesItemInPack = pack.packItems.find((pi: any) => pi.productId === 'p-fries');
    expect(friesItemInPack.isAvailable).toBe(false);
  });

  it('3. should inject active campaign discounts and update price, realPrice, and hasDiscount', async () => {
    const { menu } = createBaseMenu();
    mockRedis.updateMenu.mockResolvedValue(JSON.stringify(menu));

    const activeCampaign = {
      id: 'camp-1',
      title: 'Summer Sale',
      enabled: true,
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000),
      actions: [
        {
          type: 'product_discount',
          payload: {
            productId: 'p-standard',
            discountType: 'percent',
            discountValue: 20, // 20% off
          },
        },
      ],
    };
    mockCampaignsService.getActiveCampaign.mockResolvedValue(activeCampaign);

    const result = await service.getMenu('shop-1');

    const burger = result.categories[0].products.find((p: any) => p.id === 'p-standard');
    // Base = 100,000, 20% discount = 20,000 -> final price = 80,000
    expect(burger.price).toBe(80000);
    expect(burger.totalPrice).toBe(80000);
    expect(burger.realPrice).toBe(100000);
    expect(burger.hasDiscount).toBe(true);
    expect(burger.discountAmount).toBe(20000);
    expect(burger.discountPercent).toBe(20);

    expect(result.activeCampaign).toBeDefined();
    expect(result.activeCampaign.id).toBe('camp-1');
  });

  it('4. should cascade category blocked status to all products', async () => {
    const { menu, cat1 } = createBaseMenu();
    cat1.status = Status.Blocked; // Category is Blocked!
    mockRedis.updateMenu.mockResolvedValue(JSON.stringify(menu));
    mockCampaignsService.getActiveCampaign.mockResolvedValue(null);

    const result = await service.getMenu('shop-1');

    const category = result.categories[0];
    expect(category.isAvailable).toBe(false);

    for (const prod of category.products) {
      expect(prod.isAvailable).toBe(false);
      expect(prod.isFinished).toBe(true);
    }
  });

  it('5. should provide full CDN URLs for images and guide for AI agents', async () => {
    const { menu } = createBaseMenu();
    mockRedis.updateMenu.mockResolvedValue(JSON.stringify(menu));
    mockCampaignsService.getActiveCampaign.mockResolvedValue(null);

    const result = await service.getMenu('shop-1');

    const burger = result.categories[0].products.find((p: any) => p.id === 'p-standard');
    expect(burger.imageUrl).toMatch(/^https:\/\/file\.menno\.pro\/products\/cheeseburger_md\.webp/);
    expect(burger.imageUrls[0]).toMatch(/^https:\/\/file\.menno\.pro\/products\/cheeseburger_md\.webp/);
    expect(result._guideForAiAgents).toBeDefined();
    expect(result._guideForAiAgents.imagesNote).toContain('imageUrl');
  });

  it('6. should be cleanly serializable with JSON.stringify without circular reference errors', async () => {
    const { menu } = createBaseMenu();
    mockRedis.updateMenu.mockResolvedValue(JSON.stringify(menu));
    mockCampaignsService.getActiveCampaign.mockResolvedValue(null);

    const result = await service.getMenu('shop-1');

    expect(() => JSON.stringify(result)).not.toThrow();
    const parsed = JSON.parse(JSON.stringify(result));
    expect(parsed.id).toBe('menu-1');
  });

  it('7. should wire pack items correctly even when deserialized from raw Redis JSON with shallow product references', async () => {
    const rawMenu = {
      id: 'menu-1',
      title: 'Raw Redis Menu',
      costs: [],
      categories: [
        {
          id: 10,
          title: 'Food',
          status: Status.Active,
          products: [
            {
              id: 'p-standard',
              title: 'Cheeseburger',
              price: 100000,
              type: ProductType.Standard,
              status: Status.Active,
              stock: 10,
              variants: [],
            },
            {
              id: 'p-fries',
              title: 'French Fries',
              price: 50000,
              type: ProductType.Standard,
              status: Status.Active,
              stock: 5,
              variants: [],
            },
            {
              id: 'p-pack',
              title: 'Combo Pack',
              price: 0,
              type: ProductType.Pack,
              status: Status.Active,
              stock: null,
              variants: [],
              packItems: [
                { product: { id: 'p-standard' }, quantity: 1 },
                { product: { id: 'p-fries' }, quantity: 2 },
              ],
            },
          ],
        },
      ],
    };

    mockRedis.updateMenu.mockResolvedValue(JSON.stringify(rawMenu));
    mockCampaignsService.getActiveCampaign.mockResolvedValue(null);

    const result = await service.getMenu('shop-1');

    const pack = result.categories[0].products.find((p: any) => p.id === 'p-pack');
    expect(pack).toBeDefined();
    // 100k + (2 * 50k) = 200k
    expect(pack.price).toBe(200000);
    expect(pack.totalPrice).toBe(200000);
    expect(pack.isAvailable).toBe(true);
    expect(pack.packItems[0].productTitle).toBe('Cheeseburger');
    expect(pack.packItems[0].unitPrice).toBe(100000);
    expect(pack.packItems[1].productTitle).toBe('French Fries');
    expect(pack.packItems[1].unitPrice).toBe(50000);
  });
});
