import { ChangePasswordDto, User, UserRole } from '@menno/types';
import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
  Req,
  Request,
  UseGuards,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthPayload } from '../core/types/auth-payload';
import { AppLocalAuthGuard } from './app-local-auth.guard';
import { AuthService } from './auth.service';
import { PanelLocalAuthGuard } from './panel-local-auth.guard';
import { Public } from './public.decorator';
import { LoginUser } from './user.decorator';
import { AdminLocalAuthGuard } from './admin-local-auth.guard';
import { Roles } from './roles.decorators';
import { PersianNumberService } from '@menno/utils';

@Controller('auth')
export class AuthController {
  constructor(
    private auth: AuthService,
    @InjectRepository(User)
    private usersRepo: Repository<User>,
  ) {}

  @Public()
  @UseGuards(PanelLocalAuthGuard)
  @Post('login/panel')
  async loginPanel(@Request() req) {
    return this.auth.loginPanel(req.user);
  }

  @Public()
  @UseGuards(PanelLocalAuthGuard)
  @Post('login/panel/v2')
  async loginPanelV2(@Request() req) {
    return this.auth.loginPanelV2(req.user);
  }

  @Roles(UserRole.Panel)
  @Post('changePassword')
  async changePanelPassword(@Body() dto: ChangePasswordDto, @LoginUser() user: AuthPayload) {
    dto.id = user.id;
    return this.auth.changePanelPassword(dto);
  }

  @Public()
  @UseGuards(AdminLocalAuthGuard)
  @Post('login/admin')
  async loginAdmin(@Request() req) {
    return this.auth.loginAdmin(req.user);
  }

  @Public()
  @UseGuards(AdminLocalAuthGuard)
  @Post('login/admin/v2')
  async loginAdminV2(@Request() req) {
    return this.auth.loginAdminV2(req.user);
  }

  @Public()
  @UseGuards(AppLocalAuthGuard)
  @Post('login/app')
  async loginApp(@Request() req) {
    return this.auth.loginApp(req.user);
  }

  @Public()
  @UseGuards(AppLocalAuthGuard)
  @Post('login/app/v2')
  async loginAppV2(@Request() req) {
    return this.auth.loginAppV2(req.user);
  }

  @Roles(UserRole.App)
  @Put('edit')
  async editUser(@Body() dto: User, @LoginUser() user: AuthPayload) {
    dto.id = user.id;
    return this.usersRepo.save(dto);
  }

  @Public()
  @Get('sendToken/:mobile')
  async sendToken(@Param() params, @Req() req: Request) {
    const referer: string = req.headers['referer'];
    const url = referer.split('://')[1].split('/')[0];
    return this.auth.sendToken(PersianNumberService.toEnglish(params.mobile), 70000, url);
  }

  @Get('info')
  async info(@LoginUser() user: AuthPayload) {
    if (user && user.id) {
      const dbUser = await this.usersRepo.findOneBy({ id: user.id });
      if (dbUser) return dbUser;
    }
    throw new HttpException('no user found', HttpStatus.NOT_FOUND);
  }

  @Public()
  @Get('login/app/v2/:userId/:mobile/:token')
  async loginAppWithTokenV2(@Param() params) {
    return this.auth.loginAppWithTokenV2(
      params.userId,
      PersianNumberService.toEnglish(params.mobile),
      PersianNumberService.toEnglish(params.token),
    );
  }

  @Public()
  @Get('login/app/:userId/:mobile/:token')
  async loginAppWithToken(@Param() params) {
    return this.auth.loginAppWithToken(
      params.userId,
      PersianNumberService.toEnglish(params.mobile),
      PersianNumberService.toEnglish(params.token),
    );
  }
}
