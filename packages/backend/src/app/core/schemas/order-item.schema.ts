import { OrderItem } from "@menno/types";
import { EntitySchema } from "typeorm";

export const OrderItemSchema = new EntitySchema<OrderItem>({
    name: 'OrderItem',
    target: OrderItem,
    columns: {
        id: {
            type: 'uuid',
            primary: true,
            generated: 'uuid',
        },
        title: {
            type: String,
            nullable: true,
        },
        details: {
            type: 'simple-json',
            default: {},
        },
        isAbstract: {
            type: Boolean,
            default: false,
        },
        note: {
            type: String,
            nullable: true,
        },
        price: {
            type: 'real',
        },
        quantity: {
            type: Number,
        },
    },
    relations: {
        order: {
            type: 'many-to-one',
            target: 'Order',
            inverseSide: 'items',
        },
        product: {
            type: 'many-to-one',
            target: 'Product',
        }
    }
});