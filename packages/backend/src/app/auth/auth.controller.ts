import { Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { AppLocalAuthGuard } from './app-local-auth.guard';
import { AuthService } from './auth.service';
import { PanelLocalAuthGuard } from './panel-local-auth.guard';
import { Public } from './public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Public()
  @UseGuards(PanelLocalAuthGuard)
  @Post('login/panel')
  async loginPanel(@Request() req) {
    return this.auth.loginPanel(req.user);
  }

  @Public()
  @UseGuards(AppLocalAuthGuard)
  @Post('login/app')
  async loginApp(@Request() req) {
    return this.auth.loginApp(req.user);
  }

  @Get('login/app/:userId/:mobile/:token')
  async loginAppWithToken(@Param() params) {
    return this.auth.loginAppWithToken(params.userId, params.mobile, params.token);
  }
}
