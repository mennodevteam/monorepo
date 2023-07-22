import { Club, ClubConfig, User, UserRole } from '@menno/types';
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { Public } from '../auth/public.decorator';
import { Roles } from '../auth/roles.decorators';
import { LoginUser } from '../auth/user.decorator';
import { AuthPayload } from '../core/types/auth-payload';
import { ClubsService } from './clubs.service';

@Controller('clubs')
export class ClubsController {
  constructor(
    private auth: AuthService,
    private clubsService: ClubsService,
    @InjectRepository(Club)
    private clubsRepo: Repository<Club>
  ) {}

  @Post('config')
  @Roles(UserRole.Panel)
  async saveConfig(@Body() config: ClubConfig, @LoginUser() user: AuthPayload): Promise<Club> {
    const { club } = await this.auth.getPanelUserShop(user, ['club']);
    club.config = config;
    return this.clubsRepo.save(club);
  }

  @Get()
  @Roles(UserRole.Panel)
  async findConfig(@LoginUser() user: User): Promise<Club> {
    const { club } = await this.auth.getPanelUserShop(user, ['club']);
    return club;
  }

  @Get('join/:clubId')
  @Roles(UserRole.App)
  async joinClub(@Param('clubId') clubId: string, @LoginUser() user: AuthPayload) {
    return this.clubsService.join(clubId, user.id);
  }

  @Public()
  @Get('sync/:code')
  async syncClub(@Param('code') code: string) {
    return this.clubsService.syncClub(code);
  }
}
