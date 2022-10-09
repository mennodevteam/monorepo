import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileSchema } from './entities/schemas/file.schema';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            FileSchema,
        ])
    ],
    providers: [FilesService],
    controllers: [FilesController]
})
export class FilesModule {}
