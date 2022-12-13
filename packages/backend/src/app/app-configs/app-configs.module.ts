import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfigSchema, ThemeSchema } from './schemas';

@Module({
  imports: [TypeOrmModule.forFeature([AppConfigSchema, ThemeSchema])],
})
export class AppConfigsModule {}
