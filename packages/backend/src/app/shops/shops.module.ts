import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShopsController } from './shops.controller';
import { ShopsService } from './shops.service';
import { SmsModule } from '../sms/sms.module';
import { UsersModule } from '../users/users.module';
import { SchemasModule } from '../core/schemas.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [SchemasModule, SmsModule, UsersModule, AuthModule],
  controllers: [ShopsController],
  providers: [ShopsService],
  exports: [ShopsService],
})
export class ShopsModule {}
