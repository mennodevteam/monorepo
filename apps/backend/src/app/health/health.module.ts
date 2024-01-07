import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { CoreModule } from '../core/core.module';
import { HttpModule } from '@nestjs/axios';
import { TerminusModule } from '@nestjs/terminus';

@Module({
  imports: [CoreModule, TerminusModule, HttpModule],
  providers: [],
  controllers: [HealthController],
})
export class HealthModule {}
