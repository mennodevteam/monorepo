import { OrderConfig } from '@menno/types';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShopsService } from '../shops/shops.service';

@Injectable()
export class OrderConfigsService {
  constructor(
    @InjectRepository(OrderConfig)
    private configsRepository: Repository<OrderConfig>,
    private shopsService: ShopsService
  ) {}

  findOne(shopId: string): Promise<OrderConfig> {
    return this.configsRepository.findOne({ where: { shopId } });
  }

  save(orderConfig: OrderConfig): Promise<OrderConfig> {
    return this.configsRepository.save(orderConfig);
  }
}
