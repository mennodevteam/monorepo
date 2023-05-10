import { User } from '@menno/types';
import { Controller, Get, HttpException, HttpStatus, Param, Post, Request, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthPayload } from '../core/types/auth-payload';
import { AppLocalAuthGuard } from './app-local-auth.guard';
import { AuthService } from './auth.service';
import { PanelLocalAuthGuard } from './panel-local-auth.guard';
import { Public } from './public.decorator';
import { LoginUser } from './user.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private auth: AuthService,
    @InjectRepository(User)
    private usersRepo: Repository<User>
  ) {}

  @Public()
  @UseGuards(PanelLocalAuthGuard)
  @Post('login/panel')
  async loginPanel(@Request() req) {
    return this.auth.loginPanel(req.user);
  }

  @Public()
  @UseGuards(PanelLocalAuthGuard)
  @Post('login/admin')
  async loginAdmin(@Request() req) {
    return this.auth.loginAdmin(req.user);
  }

  @Public()
  @UseGuards(AppLocalAuthGuard)
  @Post('login/app')
  async loginApp(@Request() req) {
    return this.auth.loginApp(req.user);
  }

  @Get('sendToken/:mobile')
  async sendToken(@Param() params) {
    return this.auth.sendToken(params.mobile);
  }

  @Get('info')
  async info(@LoginUser() user: AuthPayload) {
    if (user && user.id) {
      const dbUser = await this.usersRepo.findOneBy({id: user.id});
      if (dbUser) return dbUser;
    }
    throw new HttpException('no user found', HttpStatus.NOT_FOUND);
  }

  @Get('login/app/:userId/:mobile/:token')
  async loginAppWithToken(@Param() params) {
    return this.auth.loginAppWithToken(params.userId, params.mobile, params.token);
  }
}
