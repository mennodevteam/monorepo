import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegionsService } from './regions.service';
import { RegionsController } from './regions.controller';
import { ScheduleModule } from '@nestjs/schedule';
import { RegionSchema } from './schemas/region.schema';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([RegionSchema]),
  ],
  providers: [RegionsService],
  controllers: [RegionsController],
})
export class RegionsModule {}
