import { EntitySchema } from "typeorm";
import { File } from "../file";

export const FileSchema = new EntitySchema<File>({
    name: 'File',
    target: File,
    columns: {
        id: {
            type: 'uuid',
            primary: true,
            generated: 'uuid',
        },
        businessId: {
            type: String,
            nullable: true,
        },
        category: {
            type: String,
            nullable: true,
        },
        title: {
            type: String,
            nullable: true,
        },
        path: {
            type: String,
        },
        creatorId: {
            type: String,
            nullable: true,
        },
        createdAt: {
            type: 'timestamptz',
            createDate: true,
        },
        updatedAt: {
            type: 'timestamptz',
            nullable: true,
            updateDate: true,
        },
    },
});