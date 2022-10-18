import { ShopBankInfo } from '@menno/types';
import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class ShopBankInfoService {
  constructor(
    @InjectRepository(ShopBankInfo)
    private shopBankInfoRepository: Repository<ShopBankInfo>
  ) {}

  async save(shopBanInfo: ShopBankInfo): Promise<ShopBankInfo> {
    const duplicatedShop = await this.shopBankInfoRepository.findOne({
      where: { shop: { id: shopBanInfo.shop.id } },
    });
    if (duplicatedShop && shopBanInfo.id != duplicatedShop.id) {
      throw new RpcException({ status: 409, message: 'Duplicated Shop' });
    }
    return await this.shopBankInfoRepository.save(shopBanInfo);
  }

  async get(shopId: string): Promise<ShopBankInfo> {
    return this.shopBankInfoRepository.findOne({
      where: { shop: { id: shopId } },
    });
  }
}
