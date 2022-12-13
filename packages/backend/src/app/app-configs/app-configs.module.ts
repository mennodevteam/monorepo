import { Module } from '@nestjs/common';
import { SchemasModule } from '../core/schemas.module';

@Module({
  imports: [SchemasModule],
})
export class AppConfigsModule {}
