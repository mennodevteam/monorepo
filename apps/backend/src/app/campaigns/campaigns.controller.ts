import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpCode,
  Header,
} from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { Campaign, UserRole } from '@menno/types';
import { Roles } from '../auth/roles.decorators';
import { LoginUser } from '../auth/user.decorator';
import { AuthPayload } from '../core/types/auth-payload';
import { AuthService } from '../auth/auth.service';
import { Public } from '../auth/public.decorator';

@Controller('campaigns')
export class CampaignsController {
  constructor(
    private campaignsService: CampaignsService,
    private auth: AuthService,
  ) {}

  @Post()
  @Roles(UserRole.Panel)
  async create(@Body() dto: Partial<Campaign>, @LoginUser() user: AuthPayload) {
    const shop = await this.auth.getPanelUserShop(user);
    return this.campaignsService.create(shop.id, dto);
  }

  @Get()
  @Roles(UserRole.Panel)
  async findAll(@LoginUser() user: AuthPayload) {
    const shop = await this.auth.getPanelUserShop(user);
    return this.campaignsService.findAll(shop.id);
  }

  @Get(':id')
  @Roles(UserRole.Panel)
  async findOne(@Param('id') id: string, @LoginUser() user: AuthPayload) {
    const shop = await this.auth.getPanelUserShop(user);
    return this.campaignsService.findOne(id, shop.id);
  }

  @Put(':id')
  @Roles(UserRole.Panel)
  async update(
    @Param('id') id: string,
    @Body() dto: Partial<Campaign>,
    @LoginUser() user: AuthPayload,
  ) {
    const shop = await this.auth.getPanelUserShop(user);
    return this.campaignsService.update(id, shop.id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.Panel)
  async remove(@Param('id') id: string, @LoginUser() user: AuthPayload) {
    const shop = await this.auth.getPanelUserShop(user);
    return this.campaignsService.remove(id, shop.id);
  }

  @Get(':id/report')
  @Roles(UserRole.Panel)
  async getReport(@Param('id') id: string, @LoginUser() user: AuthPayload) {
    const shop = await this.auth.getPanelUserShop(user);
    return this.campaignsService.getCampaignReport(id, shop.id);
  }

  @Public()
  @Get('active/:query')
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate')
  async getActive(@Param('query') query: string) {
    // Check if query is uuid
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(query)) {
      return this.campaignsService.getActiveCampaign(query);
    }
    return this.campaignsService.getActiveCampaignByUsername(query);
  }
}
