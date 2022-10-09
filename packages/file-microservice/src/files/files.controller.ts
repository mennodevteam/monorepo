import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { File } from './entities/file';
import { FilesService } from './files.service';

@Controller('files')
export class FilesController {
    constructor(
        private filesService: FilesService
    ) { }

    @MessagePattern('files/upload')
    upload(@Payload() dto: {
        file: any,
        title: string,
        businessId: string,
        category: string,
        creatorId: string,
    }): Promise<File> {
        return this.filesService.upload(dto.file, dto.title, dto.businessId, dto.category, dto.creatorId);
    }

    @MessagePattern('files/findOne')
    findOne(@Payload() id: string): Promise<File> {
        return this.filesService.findOne(id);
    }

    @MessagePattern('files/update')
    update(@Payload() dto: { fileId: string, fileData: any }): Promise<File> {
        return this.filesService.update(dto.fileId, dto.fileData);
    }
}
