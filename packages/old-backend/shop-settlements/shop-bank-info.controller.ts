import { ShopBankInfo } from '@menno/types';
import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { ShopBankInfoService } from './shop-bank-info.service';

@Controller('shop-bank-info')
export class ShopBankInfoController {
  constructor(private shopBankInfoService: ShopBankInfoService) {}

  @MessagePattern('shopBanInfo/save')
  save(shopBanInfo: ShopBankInfo): Promise<ShopBankInfo> {
    return this.shopBankInfoService.save(shopBanInfo);
  }

  @MessagePattern('shopBanInfo/get')
  get(shopId: string): Promise<ShopBankInfo> {
    return this.shopBankInfoService.get(shopId);
  }
}
