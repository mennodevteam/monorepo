import { Controller, Get, HttpStatus } from '@nestjs/common';

import { AppService } from './app.service';
import { Public } from './auth/public.decorator';
import { InjectRepository } from '@nestjs/typeorm';
import { Shop } from '@menno/types';
import { Repository } from 'typeorm';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService, @InjectRepository(Shop)
  private shopsRepository: Repository<Shop>) {}

  @Public()
  @Get()
  getData() {
    return this.appService.getData();
  }

  @Public()
  @Get('health-check')
  async healthCheck() {
    const shops = await this.shopsRepository.count();
    return HttpStatus.OK;
  }
}
