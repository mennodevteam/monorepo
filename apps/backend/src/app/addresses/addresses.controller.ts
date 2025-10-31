import { Address, DeliveryArea, DeliveryType, Shop, User, UserRole } from '@menno/types';
import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoginUser } from '../auth/user.decorator';
import { AuthPayload } from '../core/types/auth-payload';
import { Roles } from '../auth/roles.decorators';
import { AuthService } from '../auth/auth.service';
import { HttpService } from '@nestjs/axios';

@Controller('addresses')
export class AddressesController {
  constructor(
    @InjectRepository(Address)
    private repo: Repository<Address>,
    @InjectRepository(Shop)
    private shopsRepo: Repository<Shop>,
    @InjectRepository(User)
    private usersRepo: Repository<User>,
    private auth: AuthService,
    private http: HttpService,
  ) {}

  @Roles(UserRole.App)
  @Get()
  async get(@LoginUser() user: AuthPayload, @Query('shopId') shopId: string) {
    const addresses = await this.repo.find({
      where: {
        user: { id: user.id },
      },
      relations: ['region'],
    });
    if (shopId && addresses) {
      const shop = await this.shopsRepo.findOne({
        where: { id: shopId },
        relations: ['deliveryAreas.region', 'appConfig'],
      });
      const allCountryDeliveryArea = shop.deliveryAreas.find(
        (area) => area.region === null && area.state === null,
      );
      for (const add of addresses) {
        if (shop.appConfig?.deliveryType === DeliveryType.Standard && add.latitude && add.longitude)
          add.deliveryArea = DeliveryArea.isInWitchArea(shop.deliveryAreas, [add.latitude, add.longitude]);
        else if (shop.appConfig?.deliveryType === DeliveryType.Post) {
          if (add.region) {
            add.deliveryArea = DeliveryArea.isInWitchArea(shop.deliveryAreas, undefined, add.region);
          } else if (allCountryDeliveryArea) {
            add.deliveryArea = allCountryDeliveryArea;
          }
        }
      }
    }
    return addresses;
  }

  @Roles(UserRole.Panel)
  @Get(':userId')
  async getMemberAddresses(@LoginUser() user: AuthPayload, @Param('userId') userId: string) {
    const shop = await this.auth.getPanelUserShop(user, ['deliveryAreas.region', 'appConfig']);
    const addresses = await this.repo.find({
      where: {
        user: { id: userId },
      },
      order: {
        id: 'desc',
      },
      relations: ['deliveryArea', 'region'],
    });
    if (shop && addresses) {
      for (const add of addresses) {
        if (shop.appConfig?.deliveryType === DeliveryType.Standard && add.latitude && add.longitude)
          add.deliveryArea = DeliveryArea.isInWitchArea(shop.deliveryAreas, [add.latitude, add.longitude]);
        else if (shop.appConfig?.deliveryType === DeliveryType.Post && add.region)
          add.deliveryArea = DeliveryArea.isInWitchArea(shop.deliveryAreas, undefined, add.region);
      }
    }
    return addresses;
  }

  @Post()
  async save(@Body() dto: Address, @LoginUser() user: AuthPayload, @Query('shopId') shopId: string) {
    if (user.role === UserRole.App) {
      if (dto.id) {
        const add = await this.repo.findOneBy({ id: dto.id, user: { id: user.id } });
        if (!add) throw new HttpException('no permission', HttpStatus.FORBIDDEN);
      }
      dto.user = { id: user.id } as User;
    }
    const add = await this.repo.save(dto);
    if (shopId && add) {
      const shop = await this.shopsRepo.findOne({
        where: { id: shopId },
        relations: ['deliveryAreas.region', 'appConfig'],
      });
      if (shop.appConfig?.deliveryType === DeliveryType.Standard && add.latitude && add.longitude)
        add.deliveryArea = DeliveryArea.isInWitchArea(shop.deliveryAreas || [], [
          add.latitude,
          add.longitude,
        ]);
      else if (shop.appConfig?.deliveryType === DeliveryType.Post && add.region)
        add.deliveryArea = DeliveryArea.isInWitchArea(shop.deliveryAreas || [], undefined, add.region);
    }
    return add;
  }

  @Delete(':id')
  async delete(@LoginUser() user: AuthPayload, @Param('id') id: string) {
    if (user.role === UserRole.App) {
      const add = await this.repo.findOneBy({ id: Number(id), user: { id: user.id } });
      if (!add) throw new HttpException('no permission', HttpStatus.FORBIDDEN);
    }
    await this.repo.delete(id);
  }
}
