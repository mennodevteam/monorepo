import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SchemasModule } from '../core/schemas.module';
import { PrintersController } from './printers.controller';
import { PrintersService } from './printers.service';
import { RedisService } from '../core/redis.service';

@Module({
  imports: [SchemasModule, AuthModule],
  controllers: [PrintersController],
  providers: [PrintersService, RedisService],
  exports: [PrintersService]
})
export class PrintersModule {}
