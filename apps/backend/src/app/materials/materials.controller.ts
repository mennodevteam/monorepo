import { Controller, Get, Post, Body, Param, Put, Delete, Query, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CostUpdateStrategy,
  InventoryTransaction,
  InventoryTransactionType,
  Material,
  MaterialUnit,
  PurchaseInvoice,
  PurchaseInvoiceItem,
  Stocktaking,
  StocktakingItem,
} from '@menno/types';
import { LoginUser } from '../auth/user.decorator';
import { AuthPayload } from '../core/types/auth-payload';
import { AuthService } from '../auth/auth.service';

@Controller('materials')
export class MaterialsController {
  constructor(
    @InjectRepository(Material)
    private readonly materialRepository: Repository<Material>,
    @InjectRepository(InventoryTransaction)
    private readonly inventoryTransactionRepository: Repository<InventoryTransaction>,
    @InjectRepository(PurchaseInvoice)
    private readonly purchaseInvoiceRepository: Repository<PurchaseInvoice>,
    @InjectRepository(PurchaseInvoiceItem)
    private readonly purchaseInvoiceItemRepository: Repository<PurchaseInvoiceItem>,
    @InjectRepository(Stocktaking)
    private readonly stocktakingRepository: Repository<Stocktaking>,
    @InjectRepository(StocktakingItem)
    private readonly stocktakingItemRepository: Repository<StocktakingItem>,
    private auth: AuthService,
  ) {}

  @Post()
  async create(@Body() data: Partial<Material>, @LoginUser() user: AuthPayload) {
    const shop = await this.auth.getPanelUserShop(user);
    return await this.materialRepository.save({ ...data, shop });
  }

  @Get()
  async findAll(@LoginUser() user: AuthPayload) {
    const shop = await this.auth.getPanelUserShop(user);
    return this.materialRepository.find({
      where: { shop: { id: shop.id } },
      relations: ['boms', 'boms.product', 'boms.variant'],
      order: { createdAt: 'DESC' },
    });
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @LoginUser() user: AuthPayload) {
    const shop = await this.auth.getPanelUserShop(user);
    return this.materialRepository.delete({ id, shop });
  }

  @Post('transactions')
  async createTransaction(@Body() data: Partial<InventoryTransaction>, @LoginUser() user: AuthPayload) {
    const shop = await this.auth.getPanelUserShop(user);
    const transaction = await this.inventoryTransactionRepository.save({ ...data, shop });
    if (data.type === InventoryTransactionType.Consumption) {
      await this.materialRepository.decrement({ id: data.material.id }, 'stock', data.quantity);
    } else if (data.type === InventoryTransactionType.Purchase) {
      await this.materialRepository.update(data.material.id, {
        stock: () => `stock + ${data.quantity}`,
        cost: () => {
          if (data.unitPrice && data.costUpdateStrategy === CostUpdateStrategy.Last)
            return data.unitPrice.toString();
          if (data.unitPrice && data.costUpdateStrategy === CostUpdateStrategy.Average)
            return `CASE WHEN cost IS NULL THEN ${data.unitPrice} ELSE ((stock * cost + ${data.quantity} * ${data.unitPrice}) / (stock + ${data.quantity})) END`;
          return 'cost';
        },
      });
    } else if (data.type === InventoryTransactionType.Adjustment) {
      await this.materialRepository.update(data.material.id, { stock: data.quantity });
    }

    return transaction;
  }

  @Post('upload')
  async uploadMaterials(@Body() materials: Array<Partial<Material>>, @LoginUser() user: AuthPayload) {
    const shop = await this.auth.getPanelUserShop(user);

    // Save all materials in the array (create new or update existing based on ID)
    const materialsToSave = materials.map((material) => ({
      ...material,
      stock: material.stock || 0,
      shop,
    }));

    return this.materialRepository.save(materialsToSave);
  }

  @Get('purchase-invoices')
  async findPurchaseInvoices(@LoginUser() user: AuthPayload) {
    const shop = await this.auth.getPanelUserShop(user);
    return this.purchaseInvoiceRepository.find({
      where: { shop: { id: shop.id } },
      relations: ['items', 'items.material'],
      order: { date: 'DESC', createdAt: 'DESC' },
    });
  }

  @Post('purchase-invoices')
  async createPurchaseInvoice(@Body() dto: Partial<PurchaseInvoice>, @LoginUser() user: AuthPayload) {
    const shop = await this.auth.getPanelUserShop(user);
    
    const invoice = this.purchaseInvoiceRepository.create({
      date: dto.date || new Date(),
      supplier: dto.supplier,
      description: dto.description,
      shop: shop,
    });
    const savedInvoice = await this.purchaseInvoiceRepository.save(invoice);

    const savedItems: PurchaseInvoiceItem[] = [];
    for (const itemDto of dto.items || []) {
      if (!itemDto.material?.id) continue;
      
      const material = await this.materialRepository.findOne({
        where: { id: itemDto.material.id, shop: { id: shop.id } },
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

      await this.materialRepository.update(material.id, {
        stock: material.stock + qty,
        cost: newCost,
      });

      const invoiceItem = this.purchaseInvoiceItemRepository.create({
        purchaseInvoice: savedInvoice,
        material: material,
        quantity: qty,
        unitPrice: price,
        costUpdateStrategy: strategy,
        previousStock: previousStock,
        previousCost: previousCost,
      });
      
      savedItems.push(await this.purchaseInvoiceItemRepository.save(invoiceItem));
    }

    savedInvoice.items = savedItems;
    return savedInvoice;
  }

  @Delete('purchase-invoices/:id')
  async deletePurchaseInvoice(
    @Param('id') id: string,
    @Query('revertStock') revertStock: string,
    @LoginUser() user: AuthPayload,
  ) {
    const shop = await this.auth.getPanelUserShop(user);
    const invoice = await this.purchaseInvoiceRepository.findOne({
      where: { id, shop: { id: shop.id } },
      relations: ['items', 'items.material'],
    });
    if (!invoice) {
      throw new NotFoundException('Purchase invoice not found');
    }

    if (revertStock === 'true') {
      for (const item of invoice.items || []) {
        if (item.material) {
          const updateData: any = {
            stock: () => `stock - ${item.quantity}`,
          };
          if (item.previousCost !== null && item.previousCost !== undefined) {
            updateData.cost = item.previousCost;
          }
          await this.materialRepository.update(item.material.id, updateData);
        }
      }
    }

    return this.purchaseInvoiceRepository.delete(id);
  }

  @Get('stocktakings')
  async findStocktakings(@LoginUser() user: AuthPayload) {
    const shop = await this.auth.getPanelUserShop(user);
    return this.stocktakingRepository.find({
      where: { shop: { id: shop.id } },
      relations: ['items', 'items.material'],
      order: { date: 'DESC', createdAt: 'DESC' },
    });
  }

  @Post('stocktakings')
  async createStocktaking(@Body() dto: Partial<Stocktaking>, @LoginUser() user: AuthPayload) {
    const shop = await this.auth.getPanelUserShop(user);
    const stocktaking = this.stocktakingRepository.create({
      date: dto.date || new Date(),
      description: dto.description,
      shop: shop,
    });
    const savedStocktaking = await this.stocktakingRepository.save(stocktaking);

    const savedItems: StocktakingItem[] = [];
    for (const itemDto of dto.items || []) {
      if (!itemDto.material?.id) continue;
      const material = await this.materialRepository.findOne({
        where: { id: itemDto.material.id, shop: { id: shop.id } },
      });
      if (!material) continue;

      const previousStock = material.stock;

      await this.materialRepository.update(material.id, {
        stock: itemDto.countedQuantity,
      });

      const stocktakingItem = this.stocktakingItemRepository.create({
        stocktaking: savedStocktaking,
        material: material,
        countedQuantity: itemDto.countedQuantity,
        previousStock: previousStock,
      });
      savedItems.push(await this.stocktakingItemRepository.save(stocktakingItem));
    }

    savedStocktaking.items = savedItems;
    return savedStocktaking;
  }

  @Delete('stocktakings/:id')
  async deleteStocktaking(
    @Param('id') id: string,
    @Query('revertStock') revertStock: string,
    @LoginUser() user: AuthPayload,
  ) {
    const shop = await this.auth.getPanelUserShop(user);
    const stocktaking = await this.stocktakingRepository.findOne({
      where: { id, shop: { id: shop.id } },
      relations: ['items', 'items.material'],
    });
    if (!stocktaking) {
      throw new NotFoundException('Stocktaking not found');
    }

    if (revertStock === 'true') {
      for (const item of stocktaking.items || []) {
        if (item.material && item.previousStock !== null && item.previousStock !== undefined) {
          await this.materialRepository.update(item.material.id, {
            stock: item.previousStock,
          });
        }
      }
    }

    return this.stocktakingRepository.delete(id);
  }
}
