import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CoreModule } from '../core/core.module';
import { AddressesController } from './addresses.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [CoreModule, AuthModule, HttpModule],
  controllers: [AddressesController],
})
export class AddressesModule {}
