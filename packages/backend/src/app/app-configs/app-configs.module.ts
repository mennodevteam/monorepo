import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfigSchema } from './schemas';

@Module({
  imports: [TypeOrmModule.forFeature([AppConfigSchema])],
})
export class AppConfigsModule {}
