import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { Module } from '@nestjs/common';

@Module({
  imports: [],
  providers: [FilesService],
  controllers: [FilesController],
})
export class FilesModule {}
