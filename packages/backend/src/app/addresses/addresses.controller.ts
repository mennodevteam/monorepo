import { Address, DeliveryArea, Shop, User, UserRole } from '@menno/types';
import { Body, Controller, Get, HttpException, HttpStatus, Post, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoginUser } from '../auth/user.decorator';
import { AuthPayload } from '../core/types/auth-payload';
import { Roles } from '../auth/roles.decorators';

@Roles(UserRole.App)
@Controller('addresses')
export class AddressesController {
  constructor(
    @InjectRepository(Address)
    private repo: Repository<Address>,
    @InjectRepository(Shop)
    private shopsRepo: Repository<Shop>
  ) {}

  @Get()
  async get(@LoginUser() user: AuthPayload, @Query('shopId') shopId: string) {
    const addresses = await this.repo.find({
      where: {
        user: { id: user.id },
      },
    });
    if (shopId && addresses) {
      const shop = await this.shopsRepo.findOne({
        where: { id: shopId },
        relations: ['deliveryAreas'],
      });
      for (const add of addresses) {
        if (add.latitude && add.longitude)
          add.deliveryArea = DeliveryArea.isInWitchArea(shop.deliveryAreas, [add.latitude, add.longitude]);
      }
    }
    return addresses;
  }

  @Post()
  async save(@Body() dto: Address, @LoginUser() user: AuthPayload, @Query('shopId') shopId: string) {
    if (dto.id) {
      const add = await this.repo.findOneBy({ id: dto.id, user: { id: user.id } });
      if (!add) throw new HttpException('no permission', HttpStatus.FORBIDDEN);
    }
    dto.user = { id: user.id } as User;
    const add = await this.repo.save(dto);
    if (shopId && add && add.latitude && add.longitude) {
      const shop = await this.shopsRepo.findOne({
        where: { id: shopId },
        relations: ['deliveryAreas'],
      });
      add.deliveryArea = DeliveryArea.isInWitchArea(shop.deliveryAreas, [add.latitude, add.longitude]);
    }
    return add;
  }
}
