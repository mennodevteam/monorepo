import { Address, User } from '@menno/types';
import { Body, Controller, Get, HttpException, HttpStatus, Post } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoginUser } from '../auth/user.decorator';
import { AuthPayload } from '../core/types/auth-payload';
import { Roles } from '../auth/roles.decorators';
import { Role } from '../core/types/role.enum';

@Roles(Role.App)
@Controller('addresses')
export class AddressesController {
  constructor(
    @InjectRepository(Address)
    private repo: Repository<Address>
  ) {}

  @Get()
  get(@LoginUser() user: AuthPayload) {
    return this.repo.find({
      where: {
        user: { id: user.id },
      },
    });
  }

  @Post()
  async save(@Body() dto: Address, @LoginUser() user: AuthPayload) {
    if (dto.id) {
      const add = await this.repo.findOneBy({ id: dto.id, user: { id: user.id } });
      if (!add) throw new HttpException('no permission', HttpStatus.FORBIDDEN);
    }
    dto.user = { id: user.id } as User;
    return this.repo.save(dto);
  }
}
