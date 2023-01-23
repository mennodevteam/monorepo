import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { PanelLocalStrategy } from './panel-local.strategy';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthController } from './auth.controller';
import { RolesGuard } from './roles.guard';
import { SchemasModule } from '../core/schemas.module';
import { AppLocalStrategy } from './app-local.strategy';

@Module({
  imports: [SchemasModule, PassportModule, JwtModule.register({})],
  providers: [
    AuthService,
    PanelLocalStrategy,
    AppLocalStrategy,
    JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
  exports: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
