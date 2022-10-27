import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegionsController } from './regions.controller';
import { ScheduleModule } from '@nestjs/schedule';
import { RegionSchema } from './schemas/region.schema';

@Module({
  imports: [ScheduleModule.forRoot(), TypeOrmModule.forFeature([RegionSchema])],
  providers: [],
  controllers: [RegionsController],
})
export class RegionsModule {}
