import { Module } from '@nestjs/common';
import { RegionsController } from './regions.controller';
import { ScheduleModule } from '@nestjs/schedule';
import { CoreModule } from '../core/core.module';

@Module({
  imports: [CoreModule, ScheduleModule.forRoot()],
  providers: [],
  controllers: [RegionsController],
})
export class RegionsModule {}
