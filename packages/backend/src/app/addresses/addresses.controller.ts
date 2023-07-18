import { Address, DeliveryArea, Shop, User, UserRole } from '@menno/types';
import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoginUser } from '../auth/user.decorator';
import { AuthPayload } from '../core/types/auth-payload';
import { Roles } from '../auth/roles.decorators';
import { AuthService } from '../auth/auth.service';
import { HttpService } from '@nestjs/axios';
import { OldTypes } from '@menno/old-types';

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
    private http: HttpService
  ) {}

  @Roles(UserRole.App)
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

  @Roles(UserRole.Panel)
  @Get(':userId')
  async getMemberAddresses(@LoginUser() user: AuthPayload, @Param('userId') userId: string) {
    const { mobilePhone } = await this.usersRepo.findOneBy({ id: userId });
    const shop = await this.auth.getPanelUserShop(user, ['deliveryAreas']);
    let addresses = await this.repo.find({
      where: {
        user: { id: userId },
      },
      relations: ['deliveryArea'],
    });
    if (!addresses?.length) {
      try {
        const res = await this.http
          .get<{ user: OldTypes.User; addresses: OldTypes.Address[] }>(
            `http://65.21.237.12:3002/auth/getUserPhone/${mobilePhone}`,
            {
              timeout: 4000,
            }
          )
          .toPromise();
        console.log(res.data, mobilePhone);
        if (res?.data?.addresses?.length) {
          await this.repo.save(
            res?.data?.addresses.map(
              (x) =>
                ({
                  description: x.description,
                  latitude: x.latitude,
                  longitude: x.longitude,
                  user: { id: userId },
                  deliveryArea: x.deliveryArea && { id: x.deliveryArea.id },
                } as Address)
            )
          );
          addresses = await this.repo.find({
            where: {
              user: { id: userId },
            },
            relations: ['deliveryArea'],
          });
        }
      } catch (error) {}
    }
    if (shop && addresses) {
      for (const add of addresses) {
        if (add.latitude && add.longitude)
          add.deliveryArea = DeliveryArea.isInWitchArea(shop.deliveryAreas, [add.latitude, add.longitude]);
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
    if (shopId && add && add.latitude && add.longitude) {
      const shop = await this.shopsRepo.findOne({
        where: { id: shopId },
        relations: ['deliveryAreas'],
      });
      add.deliveryArea = DeliveryArea.isInWitchArea(shop.deliveryAreas, [add.latitude, add.longitude]);
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
