import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AddressesController } from './addresses.controller';
import { AddressesService } from './addresses.service';
import { AddressSchema } from './schemas/address.schema';

@Module({
  imports: [TypeOrmModule.forFeature([AddressSchema])],
  controllers: [AddressesController],
  providers: [AddressesService],
})
export class AddressesModule {}
