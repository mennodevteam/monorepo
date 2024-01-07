import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CoreModule } from '../core/core.module';
import { AppConfigsController } from './app-configs.controller';

@Module({
  imports: [CoreModule, AuthModule],
  controllers: [AppConfigsController],
})
export class AppConfigsModule {}
