import { Module } from '@nestjs/common';
import { SchemasModule } from '../core/schemas.module';
import { ThirdPartiesController } from './third-parties.controller';
import { AuthModule } from '../auth/auth.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [SchemasModule, AuthModule, HttpModule],
  controllers: [ThirdPartiesController],
})
export class ThirdPartiesModule {}
