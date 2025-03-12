import { Address, Chat, ChatType, Region, Shop, UserRole } from '@menno/types';
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
  @Get('seen/:id')
  @Roles(UserRole.Panel, UserRole.App)
  async seen(@Param('id') id: string, @LoginUser() user: AuthPayload): Promise<void> {
    this.repo.update(id, { seen: true });
  }
}
