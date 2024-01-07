import { AppConfig, Shop, Theme } from '@menno/types';
import { Body, Controller, Get, Post } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { LoginUser } from '../auth/user.decorator';
import { AuthPayload } from '../core/types/auth-payload';
import { RedisService } from '../core/redis.service';

@Controller('appConfigs')
export class AppConfigsController {
  constructor(
    @InjectRepository(AppConfig)
    private appConfigsRepo: Repository<AppConfig>,
    @InjectRepository(Shop)
    private shopsRepo: Repository<Shop>,
    @InjectRepository(Theme)
    private themesRepo: Repository<Theme>,
    private auth: AuthService,
    private redis: RedisService
  ) {}

  @Get('themes')
  getThemes() {
    return this.themesRepo.find();
  }

  @Post()
  async save(@Body() dto: AppConfig, @LoginUser() user: AuthPayload) {
    const shop = await this.auth.getPanelUserShop(user, ['appConfig']);
    if (shop) {
      if (shop.appConfig) {
        dto.id = shop.appConfig.id;
        return this.appConfigsRepo.save(dto);
      } else {
        const newConfig = await this.appConfigsRepo.save(dto);
        this.shopsRepo.update(shop.id, {
          appConfig: { id: newConfig.id },
        });
        this.redis.updateShop(shop.id);
        return newConfig;
      }
    }
  }
}
