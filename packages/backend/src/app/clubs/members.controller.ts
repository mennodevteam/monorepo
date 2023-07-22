import { FilterMemberDto, Member, UserRole } from '@menno/types';
import { Delete } from '@nestjs/common';
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { Roles } from '../auth/roles.decorators';
import { LoginUser } from '../auth/user.decorator';
import { AuthPayload } from '../core/types/auth-payload';
import { ClubsService } from './clubs.service';

@Controller('members')
export class MembersController {
  constructor(
    private auth: AuthService,
    private clubService: ClubsService,
    @InjectRepository(Member) private membersRepo: Repository<Member>
  ) {}

  @Get('anniversary/:month/:date')
  @Roles(UserRole.Panel)
  async filterAnniversary(@Param() param: any, @LoginUser() user: AuthPayload): Promise<Member[]> {
    const { club } = await this.auth.getPanelUserShop(user, ['club']);
    return this.clubService.filterMembersAnniversary(club.id, Number(param.month), Number(param.date));
  }

  @Get('checkAnniversary/:date')
  @Roles(UserRole.Panel)
  checkAnniversary(@Param('date') dateParam: string): Promise<void> {
    const date = new Date(dateParam);
    return this.clubService.checkClubForAnniversarySms(date);
  }

  @Get(':mobile')
  @Roles(UserRole.Panel)
  async getByMobilePhone(@LoginUser() user: AuthPayload, @Param('mobile') mobile: string): Promise<Member> {
    const { club } = await this.auth.getPanelUserShop(user, ['club']);
    const filter = new FilterMemberDto();
    filter.clubId = club.id;
    filter.mobilePhone = mobile;
    try {
      const members = await this.clubService.filterMembers(filter);
      if (members[0][0]) {
        return members[0][0];
      }
    } catch (error) {}
  }

  @Post('filter')
  @Roles(UserRole.Panel)
  async filter(@LoginUser() user: AuthPayload, @Body() filter: FilterMemberDto): Promise<[Member[], number]> {
    const { club } = await this.auth.getPanelUserShop(user, ['club']);
    if (club) {
      filter.clubId = club.id;
      return this.clubService.filterMembers(filter);
    }
  }

  @Post()
  @Roles(UserRole.Panel)
  async save(@LoginUser() user: AuthPayload, @Body() member: Member): Promise<Member> {
    const { club } = await this.auth.getPanelUserShop(user, ['club']);
    member.club = club;
    if (member.tags) {
      for (const t of member.tags) {
        if (!t.id) t.club = club;
      }
    }
    return this.clubService.saveMember(member);
  }

  @Post('array')
  @Roles(UserRole.Panel)
  async saveArray(@LoginUser() user: AuthPayload, @Body() members: Member[]): Promise<Member[]> {
    const { club } = await this.auth.getPanelUserShop(user, ['club']);
    for (const member of members) {
      member.club = club;
    }
    return this.membersRepo.save(members);
  }

  @Delete('/:id')
  @Roles(UserRole.Panel)
  async deleteMember(@Param('id') id: string): Promise<void> {
    await this.membersRepo.softDelete(id);
  }

  @Get('club/:clubId')
  @Roles(UserRole.App)
  async getMemberClub(@LoginUser() user: AuthPayload, @Param('clubId') clubId: string) {
    return this.membersRepo.findOne({
      where: {
        club: { id: clubId },
        user: { id: user.id },
      },
    });
  }
}
