import { Module } from '@nestjs/common';
import { ShopsController } from './shops.controller';
import { ShopsService } from './shops.service';
import { SmsModule } from '../sms/sms.module';
import { UsersModule } from '../users/users.module';
import { CoreModule } from '../core/core.module';
import { AuthModule } from '../auth/auth.module';
import { HttpModule } from '@nestjs/axios';
import { FilesModule } from '../files/files.module';
import { ShopUsersController } from './shop-users.controller';
import { ClubsModule } from '../clubs/clubs.module';
import { ShopGroupsController } from './shop-groups.controller';
import { MenusModule } from '../menus/menus.module';

@Module({
  imports: [
    CoreModule,
    SmsModule,
    UsersModule,
    ClubsModule,
    AuthModule,
    HttpModule,
    FilesModule,
    MenusModule,
  ],
  controllers: [ShopsController, ShopUsersController, ShopGroupsController],
  providers: [ShopsService],
  exports: [ShopsService],
})
export class ShopsModule {}
