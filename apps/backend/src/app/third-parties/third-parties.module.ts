import { Module } from '@nestjs/common';
import { CoreModule } from '../core/core.module';
import { ThirdPartiesController } from './third-parties.controller';
import { AuthModule } from '../auth/auth.module';
import { HttpModule } from '@nestjs/axios';
import { BaleBotsService } from './bale-bots.service';
import { BaleWebhookController } from './bale-webhook.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Shop, User } from '@menno/types';

@Module({
  imports: [CoreModule, AuthModule, HttpModule, TypeOrmModule.forFeature([Shop, User])],
  controllers: [ThirdPartiesController, BaleWebhookController],
  providers: [BaleBotsService],
})
export class ThirdPartiesModule {}
