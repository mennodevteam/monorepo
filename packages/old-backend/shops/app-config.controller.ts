import { AppConfig } from '@menno/types';
import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { AppConfigService } from './app-config.service';

@Controller()
export class AppConfigController {
  constructor(private appConfigService: AppConfigService) {}

  @MessagePattern('appConfigs/find')
  find(shopId: string): Promise<AppConfig[]> {
    return this.appConfigService.find(shopId);
  }
  @MessagePattern('appConfigs/save')
  save(appConfig: AppConfig): Promise<AppConfig> {
    return this.appConfigService.save(appConfig);
  }
  @MessagePattern('appConfigs/delete')
  delete(id: string): Promise<any> {
    return this.appConfigService.delete(id);
  }
}
