import { DeliveryArea } from '@menno/types';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class DeliveryAreasService {
  constructor(
    @InjectRepository(DeliveryArea)
    private deliveryAreaRepository: Repository<DeliveryArea>
  ) {}

  save(delivery: DeliveryArea): Promise<DeliveryArea> {
    return this.deliveryAreaRepository.save(delivery);
  }

  findByShop(shopId: string): Promise<DeliveryArea[]> {
    return this.deliveryAreaRepository.find({
      where: { shop: { id: shopId } },
    });
  }

  async findShopDeliveryAreaInPoint(
    shopId: string,
    point: [number, number]
  ): Promise<DeliveryArea> {
    try {
      const areas = await this.deliveryAreaRepository.find({
        where: { shop: { id: shopId } },
      });
      areas.sort((a, b) => a.price - b.price);
      for (const area of areas) {
        if (DeliveryArea.isInside(point, area.polygon)) return area;
      }
    } catch (error) {
      console.log(error);
    }
    return null;
  }

  async delete(deliveryId: number): Promise<void> {
    await this.deliveryAreaRepository.delete(deliveryId);
  }

  async findById(deliveryAreaId: number): Promise<DeliveryArea> {
    return await this.deliveryAreaRepository.findOne({
      where: { id: deliveryAreaId },
    });
  }
}
