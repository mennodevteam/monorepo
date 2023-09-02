import { WindowsLocalNotification } from "@menno/types";
import { EntitySchema } from "typeorm";

export const WindowsLocalNotificationSchema = new EntitySchema<WindowsLocalNotification>({
    name: 'WindowsLocalNotification',
    target: WindowsLocalNotification,
    columns: {
        id: {
            type: Number,
            primary: true,
            generated: true
        },
        title: {
            type: String
        },
        description: {
            type: String
        },
        createdAt: {
            type: Date,
            createDate: true
        },
        failedCount: {
            type: Number,
            default: 0
        },
        isNotified: {
            type: Boolean,
            default: false
        },
        photoName: {
            type: String,
            nullable: true
        }
    },
    relations: {
        shop: {
            type: 'many-to-one',
            target: 'Shop',
        }
    }
})