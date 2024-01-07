import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CoreModule } from '../core/core.module';
import { PrintersController } from './printers.controller';
import { PrintersService } from './printers.service';

@Module({
  imports: [CoreModule, AuthModule],
  controllers: [PrintersController],
  providers: [PrintersService],
  exports: [PrintersService],
})
export class PrintersModule {}
