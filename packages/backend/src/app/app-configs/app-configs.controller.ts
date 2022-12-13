import { AppConfig } from '@menno/types';
import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Controller()
export class AppConfigsController {
  constructor(
    @InjectRepository(AppConfig)
    private repo: Repository<AppConfig>
  ) {}

  @MessagePattern('appConfigs/find')
  find(shopId: string): Promise<AppConfig[]> {
    return this.repo.findBy({ shop: { id: shopId } });
  }
  @MessagePattern('appConfigs/save')
  save(appConfig: AppConfig): Promise<AppConfig> {
    return this.repo.save(appConfig);
  }
  @MessagePattern('appConfigs/delete')
  delete(id: string): Promise<any> {
    return this.repo.delete(id);
  }
}
