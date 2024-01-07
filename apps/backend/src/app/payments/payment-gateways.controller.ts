import { Body, Controller, Get, HttpException, HttpStatus, Param, Post, Req, Response } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { Public } from '../auth/public.decorator';
import { LoginUser } from '../auth/user.decorator';
import { AuthPayload } from '../core/types/auth-payload';
import { Roles } from '../auth/roles.decorators';
import { environment } from '../../environments/environment';
import { PaymentGateway, PaymentGatewayType, Shop, UserRole } from '@menno/types';
import { RedisService } from '../core/redis.service';

@Roles(UserRole.Panel)
@Controller('paymentGateways')
export class PaymentGatewaysController {
  constructor(
    private auth: AuthService,
    @InjectRepository(PaymentGateway)
    private repo: Repository<PaymentGateway>,
    @InjectRepository(Shop)
    private shopsRepo: Repository<Shop>,
    private redis: RedisService
  ) {}

  @Get()
  async get(@Body() dto: PaymentGateway, @LoginUser() user: AuthPayload) {
    const shop = await this.auth.getPanelUserShop(user, ['paymentGateway']);
    if (shop.paymentGateway) {
      const g = await this.repo.findOne({ where: { id: shop.paymentGateway.id }, select: ['keys'] });
      shop.paymentGateway.keys = g.keys;
    }
    return shop.paymentGateway;
  }

  @Post()
  async save(@Body() dto: PaymentGateway, @LoginUser() user: AuthPayload) {
    const shop = await this.auth.getPanelUserShop(user, ['paymentGateway']);
    if (shop.paymentGateway) {
      dto.id = shop.paymentGateway.id;
    }
    if (!dto.type) dto.type = PaymentGatewayType.Sizpay;
    dto.title = shop.title;
    const result = await this.repo.save(dto);
    if (!shop.paymentGateway) this.shopsRepo.update(shop.id, { paymentGateway: { id: result.id } });
    this.redis.updateShop(shop.id);
    return result;
  }
}
