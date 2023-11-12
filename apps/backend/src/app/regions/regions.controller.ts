import { Region } from '@menno/types';
import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Public } from '../auth/public.decorator';

@Controller('regions')
export class RegionsController {
  constructor(
    @InjectRepository(Region)
    private regionsRepo: Repository<Region>
  ) {}

  @Public()
  @Get()
  find(): Promise<Region[]> {
    console.log(121212)
    return this.regionsRepo.find({
      order: {
        title: 'ASC',
      },
    });
  }
}
