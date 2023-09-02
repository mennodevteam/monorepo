import { Module } from '@nestjs/common';
import { RegionsController } from './regions.controller';
import { ScheduleModule } from '@nestjs/schedule';
import { SchemasModule } from '../core/schemas.module';

@Module({
  imports: [SchemasModule, ScheduleModule.forRoot()],
  providers: [],
  controllers: [RegionsController],
})
export class RegionsModule {}
