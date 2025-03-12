import { Address, Chat, ChatType, Region, Shop, UserRole } from '@menno/types';
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Public } from '../auth/public.decorator';
import { Roles } from '../auth/roles.decorators';
import { LoginUser } from '../auth/user.decorator';
import { AuthPayload } from '../core/types/auth-payload';
import { AuthService } from '../auth/auth.service';

@Controller('chat')
export class ChatController {
  constructor(
    @InjectRepository(Chat)
    private repo: Repository<Chat>,
    private auth: AuthService,
  ) {}

  @Public()
  @Get('order/:id')
  find(@Param('id') id: string): Promise<Chat[]> {
    return this.repo.find({
      where: {
        order: { id },
      },
      relations: ['user', 'shop'],
      order: {
        createdAt: 'DESC',
      },
    });
  }

  @Post()
  @Roles(UserRole.Panel, UserRole.App)
  async save(@Body() chat: Chat, @LoginUser() user: AuthPayload): Promise<Chat> {
    if (user.role === UserRole.Panel) {
      const shop = await this.auth.getPanelUserShop(user);
      return this.repo.save({ ...chat, type: ChatType.Receive, shop: { id: shop.id } });
    } else {
      return this.repo.save({ ...chat, type: ChatType.Send, user: { id: user.id } });
    }
  }

  @Public()
  @Post('seen')
  async seen(@Body() ids: string[], @LoginUser() user: AuthPayload): Promise<void> {
    this.repo.update({ id: In(ids) }, { seen: true });
  }
}
