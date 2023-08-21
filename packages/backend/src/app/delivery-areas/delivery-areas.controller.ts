import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { Roles } from '../auth/roles.decorators';
import { LoginUser } from '../auth/user.decorator';
import { AuthPayload } from '../core/types/auth-payload';
import { Address, DeliveryArea, Shop, UserRole } from '@menno/types';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Controller('deliveryAreas')
export class DeliveryAreasController {
  constructor(
    private auth: AuthService,
    @InjectRepository(Shop)
    private shopsRepo: Repository<Shop>,
    @InjectRepository(DeliveryArea)
    private repo: Repository<DeliveryArea>
  ) {}

  @Get()
  @Roles(UserRole.Panel)
  async getDeliveryAreas(@LoginUser() user: AuthPayload) {
    const shop = await this.auth.getPanelUserShop(user, ['deliveryAreas']);
    return shop?.deliveryAreas;
  }

  @Post()
  @Roles(UserRole.Panel)
  async save(@Body() dto: DeliveryArea, @LoginUser() user: AuthPayload) {
    const shop = await this.auth.getPanelUserShop(user, ['deliveryAreas']);
    if (dto.id) dto.shop = { id: shop.id } as Shop;
    else if (!shop.deliveryAreas.find((x) => x.id === dto.id)) {
      throw new ForbiddenException();
    }
    return this.repo.save(dto);
  }

  @Get(`:shopId/:lat/:lng`)
  async findDeliveryArea(@Param() params) {
    const shop = await this.shopsRepo.findOne({
      where: { id: params.shopId },
      relations: ['deliveryAreas'],
    });
    const d = DeliveryArea.isInWitchArea(shop.deliveryAreas || [], [Number(params.lat), Number(params.lng)]);
    if (d) return d;
    throw new HttpException('not found', HttpStatus.NOT_FOUND);
  }
}
