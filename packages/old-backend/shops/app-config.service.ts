import { AppConfig } from '@menno/types';
import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class AppConfigService {
  constructor(
    @InjectRepository(AppConfig)
    private appConfigRepository: Repository<AppConfig>
  ) {}

  find(shopId: string): Promise<AppConfig[]> {
    return this.appConfigRepository.find({ where: { shop: { id: shopId } } });
  }

  async save(appConfig: AppConfig): Promise<AppConfig> {
    const duplicatedAppConfig = await this.appConfigRepository.findOne({
      where: { shop: { id: appConfig.shop.id } },
    });
    if (duplicatedAppConfig && duplicatedAppConfig.id !== appConfig.id) {
      throw new RpcException({ status: 409, message: 'Duplicated Shop' });
    }
    return await this.appConfigRepository.save(appConfig);
  }
  delete(id: string): Promise<any> {
    return this.appConfigRepository.delete(id);
  }
}
