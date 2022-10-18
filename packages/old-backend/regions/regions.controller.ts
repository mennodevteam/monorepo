import { Region } from '@menno/types';
import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { RegionsService } from './regions.service';

@Controller('regions')
export class RegionsController {
  constructor(private regionsService: RegionsService) {}

  @MessagePattern('regions/find')
  find(): Promise<Region[]> {
    return this.regionsService.find();
  }

  @MessagePattern('regions/findOne')
  findOne(regionId: string): Promise<Region> {
    return this.regionsService.findOne(regionId);
  }

  @MessagePattern('regions/save')
  save(region: Region): Promise<Region> {
    return this.regionsService.save(region);
  }
  @MessagePattern('regions/delete')
  delete(id: string): Promise<void> {
    return this.regionsService.delete(id);
  }
}
