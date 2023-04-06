import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SchemasModule } from '../core/schemas.module';
import { AddressesController } from './addresses.controller';

@Module({
  imports: [SchemasModule, AuthModule],
  controllers: [AddressesController],
})
export class AddressesModule {}
