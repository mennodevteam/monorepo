import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CoreModule } from '../core/core.module';
import { DashboardController } from './dashboard.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [CoreModule, AuthModule, HttpModule],
  controllers: [DashboardController],
})
export class DashboardModule {}
