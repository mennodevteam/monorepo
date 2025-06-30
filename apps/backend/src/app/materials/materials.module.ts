import { Module } from '@nestjs/common';
import { MaterialsController } from './materials.controller';
import { BomsController } from './boms.controller';
import { CoreModule } from '../core/core.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [CoreModule, AuthModule],
  controllers: [MaterialsController, BomsController],
})
export class MaterialsModule {}
