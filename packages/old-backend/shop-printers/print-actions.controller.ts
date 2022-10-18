import { PrintAction, PrintOderDto } from '@menno/types';
import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { PrintActionsService } from './print-actions.service';

@Controller('print-actions')
export class PrintActionsController {
  constructor(private printActionsService: PrintActionsService) {}

  @MessagePattern('printActions/printOrder')
  printOrder(dto: PrintOderDto): Promise<PrintAction[]> {
    return this.printActionsService.printOrder(dto);
  }

  @MessagePattern('printActions/findByShopId')
  findByShopId(shopId: string): Promise<PrintAction[]> {
    return this.printActionsService.findByShopId(shopId);
  }

  @MessagePattern('printActions/findByIds')
  findByIds(ids: string[]): Promise<PrintAction[]> {
    return this.printActionsService.findByIds(ids);
  }

  @MessagePattern('printActions/setPrinted')
  setPrinted(id: string): Promise<void> {
    return this.printActionsService.setPrinted(id);
  }

  @MessagePattern('printActions/setFailed')
  setFailed(id: string): Promise<void> {
    return this.printActionsService.setFailed(id);
  }
}
