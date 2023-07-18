import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SchemasModule } from '../core/schemas.module';
import { AddressesController } from './addresses.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [SchemasModule, AuthModule, HttpModule],
  controllers: [AddressesController],
})
export class AddressesModule {}
