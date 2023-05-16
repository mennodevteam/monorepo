import { Mission } from '@menno/types';
import { Body, Controller, Delete, Get, Inject, Param, Post } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { LoginUser } from '../auth/user.decorator';
import { AuthPayload } from '../core/types/auth-payload';

@Controller('missions')
export class MissionsController {
  constructor(
    private auth: AuthService,
    @InjectRepository(Mission) private missionsRepo: Repository<Mission>
  ) {}

  @Get()
  async find(@LoginUser() user: AuthPayload): Promise<Mission[]> {
    const { club } = await this.auth.getPanelUserShop(user, ['panel']);
    return this.missionsRepo.find({
      where: {
        club: { id: club?.id },
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  @Post()
  async save(@LoginUser() user: AuthPayload, @Body() mission: Mission): Promise<Mission> {
    const { club } = await this.auth.getPanelUserShop(user, ['club']);
    mission.club = club;
    return this.missionsRepo.save(mission);
  }

  @Delete(':id')
  async remove(@Param('id') missionId: string): Promise<void> {
    await this.missionsRepo.softDelete(Number(missionId));
  }
}
