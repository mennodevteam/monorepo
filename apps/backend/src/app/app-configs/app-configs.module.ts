import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SchemasModule } from '../core/schemas.module';
import { AppConfigsController } from './app-configs.controller';

@Module({
  imports: [SchemasModule, AuthModule],
  controllers: [AppConfigsController],
})
export class AppConfigsModule {}
