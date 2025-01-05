import { Module } from '@nestjs/common';
import { CoreModule } from '../core/core.module';
import { BasalamController } from './basalam.controller';
import { HttpModule } from '@nestjs/axios';
import { OauthService } from './oauth.service';
import { BasalamFilesService } from './basalam-files.service';
import { FilesModule } from '../files/files.module';
import { BasalamProductService } from './basalam-product.service';

@Module({
  imports: [CoreModule, HttpModule, FilesModule],
  controllers: [BasalamController],
  providers: [OauthService, BasalamFilesService, BasalamProductService],
})
export class BasalamModule {}
