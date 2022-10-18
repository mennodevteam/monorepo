import { ShopSettlement, ShopSettlementFilterDto } from '@menno/types';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ShopSettlementsService } from './shop-settlements.service';

@Controller('settlements')
export class ShopSettlementsController {
  constructor(private shopSettlementsService: ShopSettlementsService) {}

  @MessagePattern('settlements/findNotCompleted')
  findNotCompleted(): Promise<ShopSettlement[]> {
    return this.shopSettlementsService.findNotCompleted();
  }

  @MessagePattern('settlements/delete')
  delete(@Payload() id: number): Promise<any> {
    return this.shopSettlementsService.delete(id);
  }

  @MessagePattern('settlements/filter')
  filter(
    @Payload() shopSettlementFilterDto: ShopSettlementFilterDto
  ): Promise<ShopSettlement[]> {
    return this.shopSettlementsService.filter(shopSettlementFilterDto);
  }

  @MessagePattern('settlements/completedUnresolved')
  setTrue(trackingCode: string): Promise<void> {
    return this.shopSettlementsService.setTrue(trackingCode);
  }

  @MessagePattern('settlements/completeByIds')
  completeByIds(dto: { ids: number[]; trackingCode?: string }): Promise<void> {
    return this.shopSettlementsService.completeByIds(dto.ids, dto.trackingCode);
  }

  @MessagePattern('settlements/notCompleted')
  getNotCompleted(): Promise<ShopSettlement[]> {
    return this.shopSettlementsService.getNotCompleted();
  }

  @MessagePattern('settlements/removeByIds')
  removeByIdes(ids: number[]): Promise<void> {
    return this.shopSettlementsService.removeByIds(ids);
  }
}
