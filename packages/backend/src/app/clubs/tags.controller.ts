import { MemberTag } from '@menno/types';
import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Post } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { Roles } from '../auth/roles.decorator';
import { LoginUser } from '../auth/user.decorator';
import { AuthPayload } from '../core/types/auth-payload';
import { Role } from '../core/types/role.enum';

@Controller('tags')
@Roles(Role.Panel)
export class TagsController {
  constructor(
    private auth: AuthService,
    @InjectRepository(MemberTag)
    private tagsRepo: Repository<MemberTag>
  ) {}

  @Get()
  async find(@LoginUser() user: AuthPayload): Promise<MemberTag[]> {
    const { club } = await this.auth.getPanelUserShop(user, ['club']);
    return this.tagsRepo.find({
      where: {
        club,
      },
    });
  }

  @Post()
  async save(@LoginUser() user: AuthPayload, @Body() tag: MemberTag): Promise<MemberTag> {
    const { club } = await this.auth.getPanelUserShop(user, ['club']);
    if (tag.id) {
      const existTag = await this.tagsRepo.findOne({
        where: { id: tag.id },
        relations: ['club'],
      });
      if (existTag?.club?.id !== club.id) throw new HttpException('this is not your club tag', HttpStatus.FORBIDDEN);
    }
    tag.club = club;
    return this.tagsRepo.save(tag);
  }

  @Delete(':tagId')
  async remove(@LoginUser() user: AuthPayload, @Param('tagId') tagId: string): Promise<void> {
    const { club } = await this.auth.getPanelUserShop(user, ['club']);

    const existTag = await this.tagsRepo.findOne({
      where: { id: Number(tagId) },
      relations: ['club'],
    });

    if (existTag?.club?.id !== club.id) throw new HttpException('this is not your club tag', HttpStatus.FORBIDDEN);
    await this.tagsRepo.remove(existTag);
  }
}
