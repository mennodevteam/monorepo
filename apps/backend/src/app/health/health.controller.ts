import { Region } from '@menno/types';
import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Public } from '../auth/public.decorator';
import { HealthCheck, HealthCheckService, HttpHealthIndicator, TypeOrmHealthIndicator } from '@nestjs/terminus';

@Public()
@Controller('health')
export class HealthController {
  constructor(
    @InjectRepository(Region)
    private regionsRepo: Repository<Region>,
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([() => this.db.pingCheck('database')]);
  }
}
