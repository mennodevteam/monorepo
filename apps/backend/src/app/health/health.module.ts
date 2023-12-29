import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { SchemasModule } from '../core/schemas.module';
import { HttpModule } from '@nestjs/axios';
import { TerminusModule } from '@nestjs/terminus';

@Module({
  imports: [SchemasModule, TerminusModule, HttpModule],
  providers: [],
  controllers: [HealthController],
})
export class HealthModule {}
