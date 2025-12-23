import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { CoreModule } from '../core/core.module';
import { HomeSectionsController } from './home-sections.controller';
import { HomeSectionsService } from './home-sections.service';
import { HomeSectionSchema } from '../core/schemas/home-section.schema';

@Module({
  imports: [CoreModule, AuthModule, TypeOrmModule.forFeature([HomeSectionSchema])],
  controllers: [HomeSectionsController],
  providers: [HomeSectionsService],
})
export class HomeSectionsModule {}

