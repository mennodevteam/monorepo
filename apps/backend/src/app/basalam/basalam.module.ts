import { Module } from '@nestjs/common';
import { CoreModule } from '../core/core.module';
import { BasalamController } from './basalam.controller';
import { HttpModule } from '@nestjs/axios';
import { OauthService } from './oauth.service';
import { BasalamFilesService } from './basalam-files.service';
import { FilesModule } from '../files/files.module';

@Module({
  imports: [CoreModule, HttpModule, FilesModule],
  controllers: [BasalamController],
  providers: [OauthService, BasalamFilesService],
})
export class BasalamModule {}
