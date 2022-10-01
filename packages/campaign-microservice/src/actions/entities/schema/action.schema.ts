import { EntitySchema } from "typeorm";
import { Action } from "../action";

export const ActionSchema = new EntitySchema<Action>({
    name: 'Action',
    target: Action,
    columns: {
        id: {
            type: 'uuid',
            primary: true,
            generated: 'uuid',
        },
        label: {
            type: String,
        },
        createdAt: {
            type: 'timestamptz',
            createDate: true
        },
        userId: {
            type: String,
            nullable: true
        },
        tags: {
            type: String,
            array: true,
            default: [],
        },
        campaignId: {
            type: 'uuid',
        },
        businessId: {
            type: 'uuid',
            nullable: true,
        },
        category: {
            type: String,
            nullable: true,
        }
    },
})