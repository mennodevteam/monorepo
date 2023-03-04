import { Module } from '@nestjs/common';
import { CommonModule } from '@angular/common';
import { SchemasModule } from '../core/schemas.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [CommonModule, SchemasModule, HttpModule],
})
export class PaymentsModule {}
