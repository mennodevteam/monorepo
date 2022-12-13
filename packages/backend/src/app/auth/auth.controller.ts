import { Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { Role } from '../core/types/role.enum';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './local-auth.guard';
import { Public } from './public.decorator';
import { Roles } from './roles.decorators';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login/panel')
  async loginPanel(@Request() req) {
    return this.auth.loginPanel(req.user);
  }

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login/app')
  async loginApp(@Request() req) {
    return this.auth.loginApp(req.user);
  }
}
