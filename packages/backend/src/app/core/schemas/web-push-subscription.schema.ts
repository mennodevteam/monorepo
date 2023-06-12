import { WebPushSubscription } from "@menno/types";
import { EntitySchema } from "typeorm";

export const WebPushSubscriptionSchema = new EntitySchema<WebPushSubscription>({
    name: 'WebPushSubscription',
    target: WebPushSubscription,
    columns: {
        id: {
            type: 'uuid',
            primary: true,
            generated: 'uuid',
        },
        endpoint: {
            type: String,
        },
        keys: {
            type: 'simple-json',
        },
        createdAt: {
            type: 'timestamptz',
            createDate: true,
        }
    },
    relations: {
        shop: {
            type: 'many-to-one',
            target: 'Shop',
            nullable: true,
        },
        user: {
            type: 'many-to-one',
            target: 'User',
            nullable: true,
        }
    }
});