import { Module } from '@nestjs/common';
import { CoreModule } from '../core/core.module';
import { ThirdPartiesController } from './third-parties.controller';
import { AuthModule } from '../auth/auth.module';
import { HttpModule } from '@nestjs/axios';
import { BaleBotsService } from './bale-bots.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Shop } from '@menno/types';

@Module({
  imports: [CoreModule, AuthModule, HttpModule, TypeOrmModule.forFeature([Shop])],
  controllers: [ThirdPartiesController],
  providers: [BaleBotsService],
})
export class ThirdPartiesModule {}
