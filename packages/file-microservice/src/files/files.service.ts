import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { File } from './entities/file';
import { v4 as uuidv4 } from 'uuid';

const fs = require('fs');

@Injectable()
export class FilesService {
    constructor(
        @InjectRepository(File)
        private filesRepository: Repository<File>
    ) { }

    async upload(fileData: any, title: string, businessId: string, category: string, creatorId: string): Promise<File> {
        const now = new Date();
        const YEAR = now.getFullYear().toString();
        const MONTH = new Date().getMonth().toString();
        const DATE = new Date().getDate().toString();
        const uuid = uuidv4();

        if (!fs.existsSync(`${process.env.BASE_FILES_DIRECTORY}`)) {
            fs.mkdirSync(`${process.env.BASE_FILES_DIRECTORY}`);
        }
        let subfolder = `/${YEAR}`;
        if (!fs.existsSync(`${process.env.BASE_FILES_DIRECTORY}/${subfolder}`)) {
            fs.mkdirSync(`${process.env.BASE_FILES_DIRECTORY}/${subfolder}`);
        }
        subfolder += `/${MONTH}`;
        if (!fs.existsSync(`${process.env.BASE_FILES_DIRECTORY}/${subfolder}`)) {
            fs.mkdirSync(`${process.env.BASE_FILES_DIRECTORY}/${subfolder}`);
        }
        subfolder += `/${DATE}`;
        if (!fs.existsSync(`${process.env.BASE_FILES_DIRECTORY}/${subfolder}`)) {
            fs.mkdirSync(`${process.env.BASE_FILES_DIRECTORY}/${subfolder}`);
        }
        
        let buffer = Buffer.from(fileData.buffer, 'base64');
        const fileName = `${uuid}_${fileData.originalName}`;
        const file = new File();
        file.id = uuid;
        file.title = title;
        file.businessId = businessId;
        file.creatorId = creatorId;
        file.category = category;
        file.path = `${subfolder}/${fileName}`;
        fs.writeFileSync(`${process.env.BASE_FILES_DIRECTORY}/${file.path}`, buffer);
        return this.filesRepository.save(file);
    }

    findOne(id: string): Promise<File> {
        return this.filesRepository.findOne(id);
    }

    async update(id: string, fileData: any): Promise<File> {
        const file = await this.filesRepository.findOne(id);
        let buffer = new Buffer(fileData.buffer, 'base64');
        fs.writeFileSync(`${process.env.BASE_FILES_DIRECTORY}/${file.path}`, buffer);
        file.updatedAt = new Date();
        return this.filesRepository.save(file);
    }
}
