import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateShopDto } from 'src/core/models/create-shop.dto';
import { FilterShop } from './entities/filter-shop';
import { Shop } from './entities/shop';
import { ShopGroup } from './entities/shop-group';
import { ShopsService } from './shops.service';

@Controller('shops')
export class ShopsController {
    constructor(
        private shopsService: ShopsService,
    ) { }

    @MessagePattern('shops/findByUsernameOrCode')
    findByUsernameOrCode(text: string): Promise<Shop> {
        return this.shopsService.findByUsernameOrCode(text);
    }

    @MessagePattern('shops/getUserShop')
    getUserShop(userId: string): Promise<Shop> {
        return this.shopsService.getUserShop(userId);
    }

    @MessagePattern('shops/findShopGroupByCode')
    findShopGroupByCode(code: string): Promise<ShopGroup> {
        return this.shopsService.findShopGroupByCode(code);
    }

    @MessagePattern('shops/findOne')
    findOne(shopId: string): Promise<Shop> {
        return this.shopsService.findOne(shopId);
    }

    @MessagePattern('shops/save')
    save(shop: Shop): Promise<Shop> {
        return this.shopsService.save(shop);
    }

    @MessagePattern('shops/insert')
    insert(createShopDto: CreateShopDto): Promise<Shop> {
        return this.shopsService.insert(createShopDto);
    }

    @MessagePattern('shops/adminInsert')
    adminInsert(createShopDto: CreateShopDto): Promise<Shop> {
        return this.shopsService.privateInsert(createShopDto);
    }

    @MessagePattern('shops/sendLink')
    sendShopLink(dto: { shopId: string, mobile: string }): Promise<void> {
        return this.shopsService.sendShopLink(dto.shopId, dto.mobile);
    }

    @MessagePattern('shops/filter')
    filter(@Payload() filterShop: FilterShop): Promise<any> {
        return this.shopsService.filter(filterShop)
    }

    @MessagePattern('shops/findByMenuIds')
    findByMenuId(menuIds: string[]): Promise<Shop[]> {
        return this.shopsService.filterByMenuIds(menuIds);
    }


}
