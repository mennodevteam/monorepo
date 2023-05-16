import { Module } from '@nestjs/common';
import { ShopsController } from './shops.controller';
import { ShopsService } from './shops.service';
import { SmsModule } from '../sms/sms.module';
import { UsersModule } from '../users/users.module';
import { SchemasModule } from '../core/schemas.module';
import { AuthModule } from '../auth/auth.module';
import { HttpModule } from '@nestjs/axios';
import { FilesModule } from '../files/files.module';
import { ShopUsersController } from './shop-users.controller';

@Module({
  imports: [SchemasModule, SmsModule, UsersModule, AuthModule, HttpModule, FilesModule],
  controllers: [ShopsController, ShopUsersController],
  providers: [ShopsService],
  exports: [ShopsService],
})
export class ShopsModule {}
