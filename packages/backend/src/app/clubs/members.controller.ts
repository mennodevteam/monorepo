import { FilterMemberDto, Member } from '@menno/types';
import { Delete } from '@nestjs/common';
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { Roles } from '../auth/roles.decorator';
import { LoginUser } from '../auth/user.decorator';
import { AuthPayload } from '../core/types/auth-payload';
import { Role } from '../core/types/role.enum';
import { ClubsService } from './clubs.service';

@Controller('members')
export class MembersController {
  constructor(
    private auth: AuthService,
    private clubService: ClubsService,
    @InjectRepository(Member) private membersRepo: Repository<Member>
  ) {}

  @Get('anniversary/:month/:date')
  @Roles(Role.Panel)
  async filterAnniversary(@Param() param: any, @LoginUser() user: AuthPayload): Promise<Member[]> {
    const { club } = await this.auth.getPanelUserShop(user, ['club']);
    return this.clubService.filterMembersAnniversary(
      club.id,
      Number(param.month),
      Number(param.date)
    );
  }

  @Get('checkAnniversary/:date')
  @Roles(Role.Panel)
  checkAnniversary(@Param('date') dateParam: string): Promise<void> {
    const date = new Date(dateParam);
    return this.clubService.checkClubForAnniversarySms(date);
  }

  @Get(':mobile')
  @Roles(Role.Panel)
  async getByMobilePhone(
    @LoginUser() user: AuthPayload,
    @Param('mobile') mobile: string
  ): Promise<Member> {
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
  @Roles(Role.Panel)
  async filter(
    @LoginUser() user: AuthPayload,
    @Body() filter: FilterMemberDto
  ): Promise<[Member[], number]> {
    const { club } = await this.auth.getPanelUserShop(user, ['club']);
    filter.clubId = club.id;
    return this.clubService.filterMembers(filter);
  }

  @Post()
  @Roles(Role.Panel)
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
  @Roles(Role.Panel)
  async saveArray(@LoginUser() user: AuthPayload, @Body() members: Member[]): Promise<Member[]> {
    const { club } = await this.auth.getPanelUserShop(user, ['club']);
    for (const member of members) {
      member.club = club;
    }
    return this.membersRepo.save(members);
  }

  @Delete('/:id')
  @Roles(Role.Panel)
  async deleteMember(@Param('id') id: string): Promise<void> {
    await this.membersRepo.softDelete(id);
  }
}
