import { Module } from '@nestjs/common';
import { CoreModule } from '../core/core.module';
import { ThirdPartiesController } from './third-parties.controller';
import { AuthModule } from '../auth/auth.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [CoreModule, AuthModule, HttpModule],
  controllers: [ThirdPartiesController],
})
export class ThirdPartiesModule {}
