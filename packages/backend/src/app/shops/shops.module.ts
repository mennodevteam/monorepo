import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClubMicroservice, PaymentMicroservice, SmsMicroservice, UserMicroservice } from 'src/core/microservices';
import { MenuSchema } from 'src/menus/entities/schemas/menu.schema';
import { RegionSchema } from 'src/regions/entities/schemas/region.schema';
import { ShopUsersModule } from 'src/shop-users/shop-users.module';
import { ShopUserSchema } from '../shop-users/entities/schema/shop-user.schema';
import { ShopSchema } from './entities/schemas/shop.schema';
import { ShopsController } from './shops.controller';
import { ShopsService } from './shops.service';
import { AppConfigController } from './app-config/app-config.controller';
import { AppConfigSchema } from './entities/schemas/app-config.schema';
import { AppConfigService } from './app-config.service';
import { ThemeSchema } from './entities/schemas/theme.schema';
import { PluginsModule } from '../plugins/plugins.module';
import { ShopGroupSchema } from './entities/schemas/shop-group.schema';

@Module({
    imports: [
        ClientsModule.register([SmsMicroservice, PaymentMicroservice, ClubMicroservice, UserMicroservice]),
        TypeOrmModule.forFeature([
            ShopSchema,
            ShopUserSchema,
            RegionSchema,
            MenuSchema,
            AppConfigSchema,
            ThemeSchema,
            ShopGroupSchema,
        ]),
        ShopUsersModule,
        PluginsModule,
    ],
    controllers: [ShopsController, AppConfigController],
    providers: [ShopsService, AppConfigService],
    exports: [ShopsService]
})
export class ShopsModule { }
