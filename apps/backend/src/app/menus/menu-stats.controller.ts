import { MenuStat, StatAction, UserRole } from '@menno/types';
import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Roles } from '../auth/roles.decorators';
import { LoginUser } from '../auth/user.decorator';
import { AuthPayload } from '../core/types/auth-payload';

@Controller('menuStats')
export class MenuStatsController {
  constructor(
    @InjectRepository(MenuStat)
    private repo: Repository<MenuStat>,
  ) {}

  @Roles(UserRole.App)
  @Get('loadMenu/:id')
  loadMenu(
    @Param('id') id: string,
    @LoginUser() user: AuthPayload,
    @Query('referrer') referrer?: string,
    @Query('campaign') campaign?: string,
  ) {
    this.repo.save({
      action: StatAction.LoadMenu,
      menu: { id },
      referrer,
      campaign,
      user: { id: user.id },
    });
  }

  @Roles(UserRole.App)
  @Get('clickProduct/:menuId/:id')
  clickProduct(
    @Param('menuId') menuId: string,
    @Param('id') id: string,
    @LoginUser() user: AuthPayload,
    @Query('referrer') referrer?: string,
    @Query('campaign') campaign?: string,
  ) {
    this.repo.save({
      action: StatAction.ClickProduct,
      menu: { id: menuId },
      product: { id },
      referrer,
      campaign,
      user: { id: user.id },
    });
  }
}
