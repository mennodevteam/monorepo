import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryTransaction, InventoryTransactionType, Material } from '@menno/types';
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
        averageCost: () =>
          `CASE WHEN averageCost IS NULL THEN ${data.unitPrice} ELSE ((stock * averageCost + ${data.quantity} * ${data.unitPrice}) / (stock + ${data.quantity})) END`,
      });
    } else if (data.type === InventoryTransactionType.Adjustment) {
      await this.materialRepository.update(data.material.id, { stock: data.quantity });
    }

    return transaction;
  }
}
