import { Product } from './product';
import { ProductVariant } from './product-variant';
import { ProductType } from './product';
import { MenuCost } from './menu-cost';
import { Status } from './status.enum';
import { BillOfMaterial } from './inventory';
import { Material } from './inventory';
import { OrderDto } from './order.dto';
import { Menu } from './menu';
import { Campaign } from './campaign';

describe('Product & Order Pricing & Cost Calculations', () => {
  // Helper to create a standard product
  const createProduct = (id: string, price: number, type = ProductType.Standard): Product => {
    const p = new Product();
    p.id = id;
    p.title = `Product ${id}`;
    p.price = price;
    p.type = type;
    p.status = Status.Active;
    p.costs = [];
    return p;
  };

  // Helper to create a variant
  const createVariant = (id: number, price: number, title = 'Variant'): ProductVariant => {
    const v = new ProductVariant();
    v.id = id;
    v.title = title;
    v.price = price;
    v.status = Status.Active;
    return v;
  };

  describe('1. Standard Product Pricing', () => {
    it('should return base price when no costs/surcharges exist', () => {
      const p = createProduct('p1', 10000);
      expect(Product.totalPrice(p)).toBe(10000);
      expect(Product.realPrice(p)).toBe(10000);
    });

    it('should add positive surcharges correctly to totalPrice and realPrice', () => {
      const p = createProduct('p1', 10000);
      
      const tax = new MenuCost();
      tax.fixedCost = 1000;
      tax.showOnItem = true;
      
      const service = new MenuCost();
      service.percentageCost = 10; // 10%
      service.showOnItem = true;

      p.costs = [tax, service];

      // 10000 + 1000 + 10% of 10000 (1000) = 12000
      expect(Product.totalPrice(p)).toBe(12000);
      expect(Product.realPrice(p)).toBe(12000);
    });

    it('should apply negative campaign discounts to totalPrice, but NOT to realPrice', () => {
      const p = createProduct('p1', 10000);

      const discount = new MenuCost();
      discount.percentageCost = -20; // 20% discount
      discount.showOnItem = true;

      p.costs = [discount];

      // totalPrice should have discount: 10000 - 2000 = 8000
      expect(Product.totalPrice(p)).toBe(8000);
      // realPrice should NOT have discount: 10000
      expect(Product.realPrice(p)).toBe(10000);
    });
  });

  describe('2. Pack Product Pricing', () => {
    it('should calculate pack price as sum of child items', () => {
      const pack = createProduct('pack1', 0, ProductType.Pack);
      
      const child1 = createProduct('c1', 3000);
      const child2 = createProduct('c2', 5000);

      pack.packItems = [
        { product: child1, quantity: 2 } as any, // 2 * 3000 = 6000
        { product: child2, quantity: 1 } as any, // 1 * 5000 = 5000
      ];

      // Pack price = 6000 + 5000 = 11000
      expect(Product.totalPrice(pack)).toBe(11000);
      expect(Product.realPrice(pack)).toBe(11000);
    });

    it('should ignore child item discounts when calculating pack price', () => {
      const pack = createProduct('pack1', 0, ProductType.Pack);
      
      const child1 = createProduct('c1', 10000);
      // child1 has a 20% campaign discount
      const discount = new MenuCost();
      discount.percentageCost = -20;
      discount.showOnItem = true;
      child1.costs = [discount];

      pack.packItems = [
        { product: child1, quantity: 1 } as any,
      ];

      // Child1 totalPrice is 8000, but pack should use original price 10000
      expect(Product.totalPrice(child1)).toBe(8000);
      expect(Product.totalPrice(pack)).toBe(10000);
      expect(Product.realPrice(pack)).toBe(10000);
    });

    it('should support variant pricing in pack items', () => {
      const pack = createProduct('pack1', 0, ProductType.Pack);
      
      const child1 = createProduct('c1', 10000);
      const variant1 = createVariant(101, 12000);

      pack.packItems = [
        { product: child1, variant: variant1, quantity: 2 } as any, // 2 * 12000 = 24000
      ];

      expect(Product.totalPrice(pack)).toBe(24000);
    });

    it('should apply pack-level surcharges and campaign discounts correctly', () => {
      const pack = createProduct('pack1', 0, ProductType.Pack);
      const child1 = createProduct('c1', 5000);
      pack.packItems = [{ product: child1, quantity: 2 } as any]; // Base = 10000

      const packTax = new MenuCost();
      packTax.fixedCost = 1000;
      packTax.showOnItem = true;

      const packCampaign = new MenuCost();
      packCampaign.percentageCost = -15; // 15% discount on pack itself
      packCampaign.showOnItem = true;

      pack.costs = [packTax, packCampaign];

      // Base = 10000
      // Tax = 1000
      // Campaign = -1500
      // totalPrice = 10000 + 1000 - 1500 = 9500 (rounded to 9500)
      expect(Product.totalPrice(pack)).toBe(9500);
      // realPrice ignores campaign discount but includes tax: 10000 + 1000 = 11000
      expect(Product.realPrice(pack)).toBe(11000);
    });
  });

  describe('3. Cost & Materials Calculations', () => {
    it('should calculate cost correctly and ignore direct BOMs of a Pack product', () => {
      const pack = createProduct('pack1', 0, ProductType.Pack);
      const child = createProduct('c1', 5000);

      // Materials
      const mat = { id: 'm1', cost: 100 } as any as Material;

      // Pack has a direct BOM (which should be IGNORED)
      const packBom = { product: pack, material: mat, quantity: 10 } as BillOfMaterial; // cost = 1000
      // Child has a BOM
      const childBom = { product: child, material: mat, quantity: 5 } as BillOfMaterial; // cost = 500

      pack.packItems = [{ product: child, quantity: 2 } as any]; // 2 * child = 2 * 500 = 1000 cost

      const allBoms = [packBom, childBom];
      const allPackItems = [
        { parentProduct: pack, product: child, quantity: 2 } as any
      ];

      // Cost of pack should be 2 * 500 = 1000 (ignoring the 1000 pack direct BOM)
      const cost = Product.calculateCost(pack, null, allBoms, allPackItems);
      expect(cost).toBe(1000);

      // Materials of pack should be 2 * 5 = 10 quantity of m1
      const materials = Product.getAllMaterials(pack, null, allBoms, allPackItems);
      expect(materials.length).toBe(1);
      expect(materials[0].quantity).toBe(10);
    });

    it('should gracefully handle circular dependency in pack items and not infinite loop', () => {
      const packA = createProduct('packA', 0, ProductType.Pack);
      const packB = createProduct('packB', 0, ProductType.Pack);

      // packA contains packB, and packB contains packA
      packA.packItems = [{ product: packB, quantity: 1 } as any];
      packB.packItems = [{ product: packA, quantity: 1 } as any];

      const allBoms: BillOfMaterial[] = [];
      const allPackItems = [
        { parentProduct: packA, product: packB, quantity: 1 } as any,
        { parentProduct: packB, product: packA, quantity: 1 } as any,
      ];

      // calculateCost should detect the loop and return null/cost without crashing
      const cost = Product.calculateCost(packA, null, allBoms, allPackItems);
      expect(cost).toBeNull();

      // getAllMaterials should detect the loop and return empty array without crashing
      const materials = Product.getAllMaterials(packA, null, allBoms, allPackItems);
      expect(materials).toEqual([]);
    });
  });

  describe('4. Order Dto Calculations with Campaigns', () => {
    it('should inject campaign discounts dynamically and calculate totals correctly', () => {
      const menu = new Menu();
      const cat = { id: 1, title: 'Main' } as any;
      const p1 = createProduct('p1', 10000);
      cat.products = [p1];
      menu.categories = [cat];

      const campaign = new Campaign();
      campaign.title = 'Test Campaign';
      campaign.actions = [
        {
          type: 'product_discount',
          payload: {
            productId: 'p1',
            discountType: 'percent',
            discountValue: 10 // 10% discount
          }
        } as any
      ];

      // Before setRefsAndSort, p1 has no discount
      expect(Product.totalPrice(p1)).toBe(10000);

      // Run setRefsAndSort with Campaign
      Menu.setRefsAndSort(menu, undefined, false, false, undefined, false, campaign);

      // p1 should now have 10% discount dynamic MenuCost
      expect(Product.totalPrice(p1)).toBe(9000);
      expect(Product.realPrice(p1)).toBe(10000);

      // Create Order DTO
      const dto = {
        productItems: [
          { productId: 'p1', quantity: 2 }
        ],
        campaign: campaign
      } as OrderDto;

      // Calculate totals
      expect(OrderDto.sum(dto, menu)).toBe(18000); // 2 * 9000
      expect(OrderDto.realSum(dto, menu)).toBe(20000); // 2 * 10000
      expect(OrderDto.total(dto, menu)).toBe(18000);
      expect(OrderDto.totalDiscount(dto, menu)).toBe(2000); // 20000 - 18000
    });
  });
});
