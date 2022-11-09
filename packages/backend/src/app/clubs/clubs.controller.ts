import { Club, ClubConfig, User } from '@menno/types';
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { Roles } from '../auth/roles.decorator';
import { LoginUser } from '../auth/user.decorator';
import { AuthPayload } from '../core/types/auth-payload';
import { Role } from '../core/types/role.enum';
import { ClubsService } from './clubs.service';

@Controller('clubs')
@Roles(Role.Panel)
export class ClubsController {
  constructor(
    private auth: AuthService,
    private clubsService: ClubsService,
    @InjectRepository(Club)
    private clubsRepo: Repository<Club>,
  ) {}

  @Post('config')
  async saveConfig(@Body() config: ClubConfig, @LoginUser() user: AuthPayload): Promise<Club> {
    const { club } = await this.auth.getPanelUserShop(user, ['club']);
    club.config = config;
    return this.clubsRepo.save(club);
  }

  @Get()
  async findConfig(@LoginUser() user: User): Promise<Club> {
    const { club } = await this.auth.getPanelUserShop(user, ['club']);
    return club;
  }

  @Get('join/:clubId')
  @Roles(Role.App)
  async joinClub(@Param('clubId') clubId: string, @LoginUser() user: AuthPayload) {
    this.clubsService.join(clubId, user.id);
  }
}
