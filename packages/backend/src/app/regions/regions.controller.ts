import { Region } from '@menno/types';
import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Controller('regions')
export class RegionsController {
  constructor(
    @InjectRepository(Region)
    private regionsRepo: Repository<Region>
  ) {}

  @Get()
  find(): Promise<Region[]> {
    return this.regionsRepo.find({
      order: {
        title: 'ASC',
      },
    });
  }
}
