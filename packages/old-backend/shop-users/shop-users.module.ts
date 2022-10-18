import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserMicroservice } from 'src/core/microservices';
import { ShopUserSchema } from 'src/shop-users/entities/schema/shop-user.schema';
import { ShopUsersController } from './shop-users.controller';
import { ShopUsersService } from './shop-users.service';

@Module({
  imports: [
    ClientsModule.register([UserMicroservice]),
    TypeOrmModule.forFeature([ShopUserSchema]),
  ],
  providers: [ShopUsersService],
  controllers: [ShopUsersController],
  exports: [ShopUsersService],
})
export class ShopUsersModule {}
