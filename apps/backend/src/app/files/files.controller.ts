import { Body, Controller, Get, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Public } from '../auth/public.decorator';
import { FilesService } from './files.service';

@Controller('files')
export class FilesController {
  constructor(private filesService: FilesService) {}

  @Public()
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(@UploadedFile() file: Express.Multer.File, @Body() body) {
    return this.filesService.upload(file, body?.name, body?.path);
  }

  @Public()
  @Post('upload/v2')
  uploadV2(@Body() body) {
    return this.filesService.getImgproxyLinks(body.url, body?.name, body?.path);
  }
}
