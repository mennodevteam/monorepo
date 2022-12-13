import { Module } from '@nestjs/common';
import { SchemasModule } from '../core/schemas.module';
import { UsersService } from './users.service';

@Module({
  imports: [SchemasModule],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
