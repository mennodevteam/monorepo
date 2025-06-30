import { Module } from '@nestjs/common';
import { MaterialsController } from './materials.controller';
import { BomsController } from './boms.controller';
import { CoreModule } from '../core/core.module';

@Module({
  imports: [CoreModule],
  controllers: [MaterialsController, BomsController],
})
export class MaterialsModule {}
