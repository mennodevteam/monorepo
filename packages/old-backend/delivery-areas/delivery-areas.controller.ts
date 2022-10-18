import { DeliveryArea } from '@menno/types';
import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { DeliveryAreasService } from './delivery-areas.service';

@Controller()
export class DeliveryAreasController {
  constructor(private deliveryAreasService: DeliveryAreasService) {}

  @MessagePattern('deliveryAreas/save')
  async save(deliveryArea: DeliveryArea): Promise<DeliveryArea> {
    return await this.deliveryAreasService.save(deliveryArea);
  }

  @MessagePattern('deliveryAreas/findShopDeliveryAreaInPoint')
  async findShopDeliveryAreaInPoint(dto: {
    shopId: string;
    point: [number, number];
  }): Promise<DeliveryArea> {
    return await this.deliveryAreasService.findShopDeliveryAreaInPoint(
      dto.shopId,
      dto.point
    );
  }

  @MessagePattern('deliveryAreas/find')
  async find(shopId: string): Promise<DeliveryArea[]> {
    return await this.deliveryAreasService.findByShop(shopId);
  }

  @MessagePattern('deliveryAreas/delete')
  async delete(deliveryId: number): Promise<any> {
    return await this.deliveryAreasService.delete(deliveryId);
  }
}
