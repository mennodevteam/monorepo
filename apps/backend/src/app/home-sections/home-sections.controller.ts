import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HomeSection, Shop, UserRole } from '@menno/types';
import { AuthService } from '../auth/auth.service';
import { Public } from '../auth/public.decorator';
import { Roles } from '../auth/roles.decorators';
import { LoginUser } from '../auth/user.decorator';
import { AuthPayload } from '../core/types/auth-payload';
import { HomeSectionsService } from './home-sections.service';

@Controller('home-sections')
export class HomeSectionsController {
  constructor(
    private homeSectionsService: HomeSectionsService,
    private auth: AuthService,
    @InjectRepository(Shop)
    private shopsRepo: Repository<Shop>,
  ) {}

  @Get()
  @Roles(UserRole.Panel)
  async getHomeSections(@LoginUser() user: AuthPayload): Promise<HomeSection[]> {
    const shop = await this.auth.getPanelUserShop(user);
    return this.homeSectionsService.findAllByShop(shop.id);
  }

  @Post()
  @Roles(UserRole.Panel)
  async create(@Body() dto: HomeSection, @LoginUser() user: AuthPayload): Promise<HomeSection> {
    const shop = await this.auth.getPanelUserShop(user);
    return this.homeSectionsService.create(dto, shop.id);
  }

  @Put(':id')
  @Roles(UserRole.Panel)
  async update(
    @Param('id') id: string,
    @Body() dto: Partial<HomeSection>,
    @LoginUser() user: AuthPayload,
  ): Promise<HomeSection> {
    const shop = await this.auth.getPanelUserShop(user);
    return this.homeSectionsService.update(id, dto, shop.id);
  }

  @Delete(':id')
  @Roles(UserRole.Panel)
  async delete(@Param('id') id: string, @LoginUser() user: AuthPayload): Promise<void> {
    const shop = await this.auth.getPanelUserShop(user);
    return this.homeSectionsService.delete(id, shop.id);
  }

  @Post('reorder')
  @Roles(UserRole.Panel)
  async reorder(@Body() body: { ids: string[] }, @LoginUser() user: AuthPayload): Promise<HomeSection[]> {
    const shop = await this.auth.getPanelUserShop(user);
    return this.homeSectionsService.reorder(body.ids, shop.id);
  }

  @Put(':id/visibility')
  @Roles(UserRole.Panel)
  async toggleVisibility(
    @Param('id') id: string,
    @Body() body: { isVisible: boolean },
    @LoginUser() user: AuthPayload,
  ): Promise<HomeSection> {
    const shop = await this.auth.getPanelUserShop(user);
    return this.homeSectionsService.toggleVisibility(id, shop.id, body.isVisible);
  }

  @Public()
  @Get('shop/:shopId')
  async getPublicHomeSectionsByShopId(@Param('shopId') shopId: string): Promise<HomeSection[]> {
    const shop = await this.shopsRepo.findOne({
      where: { id: shopId },
      select: ['id'],
    });

    if (!shop) {
      throw new HttpException('Shop not found', HttpStatus.NOT_FOUND);
    }

    const sections = await this.homeSectionsService.findAllByShop(shopId);
    return sections.filter((s) => s.isVisible);
  }

  @Public()
  @Get(':username')
  async getPublicHomeSections(@Param('username') username: string): Promise<HomeSection[]> {
    const shop = await this.shopsRepo.findOne({
      where: [{ domain: username }, { username: username }, { code: username }],
      select: ['id'],
    });

    if (!shop) {
      throw new HttpException('Shop not found', HttpStatus.NOT_FOUND);
    }

    const sections = await this.homeSectionsService.findAllByShop(shop.id);
    return sections.filter((s) => s.isVisible);
  }
}

