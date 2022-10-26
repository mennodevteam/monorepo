import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class ShopsService {
    constructor(
        @InjectRepository(Shop)
        private shopsRepository: Repository<Shop>,
        @InjectRepository(ShopUser)
        private shopUsersRepository: Repository<ShopUser>,
        @InjectRepository(Menu)
        private menusRepository: Repository<Menu>,
        @InjectRepository(Region)
        private regionsRepository: Repository<Region>,
        @InjectRepository(ShopGroup)
        private shopGroupRepository: Repository<ShopGroup>,
        @Inject(PaymentMicroservice.name) private paymentClient: ClientProxy,
        @Inject(SmsMicroservice.name) private smsClient: ClientProxy,
        @Inject(ClubMicroservice.name) private clubClient: ClientProxy,
        @Inject(UserMicroservice.name) private userClient: ClientProxy,
        private shopUserService: ShopUsersService,
        private shopPluginsService: ShopPluginsService,
    ) { }

    async findByUsernameOrCode(text: string): Promise<Shop> {
        return this.shopsRepository.findOne({
            where: [
                { username: text },
                { code: text },
            ],
            relations: ['region', 'shopGroup'],
        });
    }

    repositoryFind(options: FindManyOptions<Shop>): Promise<Shop[]> {
        return this.shopsRepository.find(options);
    }

    async findShopGroupByCode(code: string): Promise<ShopGroup> {
        const shopGroup = await this.shopGroupRepository.findOne({ code }, {
            relations: ['shops'],
        });
        if (shopGroup) return shopGroup;
        else throw new RpcException({ code: 404, message: "code not found" });
    }

    async getUserShop(userId: string): Promise<Shop> {
        const user = await this.shopUsersRepository.findOne(userId, {
            relations: ['shop'],
        });
        if (user) return user.shop;
    }

    async sendShopLink(shopId: string, mobilePhone: string): Promise<void> {
        const shop = await this.shopsRepository.findOne(shopId);
        if (shop) {
            const tokens: string[] = [];
            tokens[0] = shop.username;
            tokens[4] = shop.title;
            this.smsClient.send('sms/lookup', {
                accountId: shop.smsAccountId,
                mobilePhone: mobilePhone,
                kavenagarTemplate: process.env.SHOP_LINK_KAVENEGAR_TEMPLATE,
                tokens,
            }).toPromise();
        }
    }

    async findOne(shopId: string): Promise<Shop> {
        return this.shopsRepository.findOne(shopId, { relations: ['region'] });
    }

    async save(shop: Shop): Promise<Shop> {
        if (shop.username !== undefined && !this.isUsernameValid(shop.username)) {
            throw new RpcException({ code: 406, message: "the username is invalid" });
        }
        return await this.shopsRepository.save(shop);
    }

    async privateInsert(dto: CreateShopDto) {
        console.log('private insert shop', dto);
        if (!this.isUsernameValid(dto.loginUsername)) throw new RpcException({ code: 406, message: "the loginUsername is invalid" });
        let existUser = await this.userClient.send('users/findOneByUsername', dto.loginUsername).toPromise();
        if (existUser) throw new RpcException({ code: 409, message: 'Duplicated Shop loginUsername' });

        if (dto.mobilePhone) {
            existUser = await this.userClient.send('users/findOneByPhone', dto.mobilePhone).toPromise();
            if (existUser) throw new RpcException({ code: 409, message: 'Duplicated Shop mobile phone' });
        }

        if (dto.username) {
            if (!this.isUsernameValid(dto.username)) throw new RpcException({ code: 406, message: "the username is invalid" });
            const existingShop = await this.shopsRepository.findOne({ where: { username: dto.username } });
            if (existingShop) throw new RpcException({ code: 409, message: 'Duplicated Shop link' });
        }

        if (dto.prevServerCode) {
            const existingShop = await this.shopsRepository.findOne({ where: { prevServerCode: dto.prevServerCode } });
            if (existingShop) throw new RpcException({ code: 409, message: 'Duplicated Shop prev sever code' });
        }
        if (dto.code) {
            const existingShop = await this.shopsRepository.findOne({ where: { code: dto.code } });
            if (existingShop) throw new RpcException({ code: 409, message: 'Duplicated Shop prev sever code' });
        } else {
            try {
                const allShops = await this.shopsRepository.find({
                    where: {
                        code: Not(IsNull()),
                    }
                });
                allShops.sort((a, b) => Number(b.code) - Number(a.code));
                const lastShopCode = allShops[0];
                console.log('lastShopCode');
                if (lastShopCode) dto.code = (Number(lastShopCode.code) + 1).toString();
            } catch (error) { }
        }

        let menu = new Menu();
        let smsAccount = new SmsAccount();
        let club = new Club();
        let shop = new Shop();
        let shopUser = new ShopUser();
        let region: Region;
        if (dto.regionId) region = <Region>{ id: dto.regionId };
        else if (dto.regionTitle) {
            region = await this.regionsRepository.save(<Region>{ title: dto.regionTitle });
        }
        menu.title = dto.title;
        menu.currency = "تومان";
        menu = await this.menusRepository.save(menu);
        smsAccount.charge = 50000;
        smsAccount = await this.smsClient.send<SmsAccount>('smsAccount/save', smsAccount).toPromise();
        club.title = dto.title;
        club = await this.clubClient.send<Club>('clubs/save', club).toPromise();

        shop.username = dto.username;
        shop.title = dto.title;
        shop.code = dto.code;
        shop.prevServerCode = dto.prevServerCode ? dto.prevServerCode : undefined;
        shop.menuId = menu.id;
        shop.smsAccountId = smsAccount.id;
        shop.region = region;
        shop.clubId = club.id;
        if (process.env.DEFAULT_BANK_PORTAL_ID) shop.bankPortalId = process.env.DEFAULT_BANK_PORTAL_ID;
        const savedShopInfo = await this.shopsRepository.save(shop);

        shopUser.user = <User>{ mobilePhone: dto.mobilePhone, firstName: dto.firstName, lastName: dto.lastName, username: dto.loginUsername, password: dto.loginPassword };
        shopUser.shop = <Shop>{ id: savedShopInfo.id };
        shopUser.role = ShopUserRole.Admin;
        await this.shopUserService.save(shopUser);
        return savedShopInfo;
    }

    async insert(dto: CreateShopDto): Promise<any> {
        // check public key
        // const currentKey = `00${new Date().getFullYear()}00${new Date().getMonth()}00${new Date().getDate()+1}`;
        const pluginDates: Date[] = [];
        if (!dto.pluginKeys && !dto.pluginKeys.length) throw new RpcException({ code: 403, message: "plugin keys are required" });
        for (const key of dto.pluginKeys) {
            if (key) {
                let splites = key.split('00#00');
                if (splites.length !== 3) throw new RpcException({ code: 403, message: "plugin keys are invalid" });
                const year = Number(splites[0]);
                const month = Number(splites[1]);
                const day = Number(splites[2]);
                if (isNaN(year) || isNaN(month) || isNaN(day)) throw new RpcException({ code: 403, message: "plugin keys are invalid" });
                const date = new Date(year, month, day);
                if (date.valueOf() <= Date.now()) throw new RpcException({ code: 403, message: "plugin keys are invalid" });
                pluginDates.push(date);
            } else {
                pluginDates.push(undefined);
            }
        }


        if (dto.username != undefined && !this.isUsernameValid(dto.username)) {
            throw new RpcException({ code: 406, message: "the username is invalid" });
        }
        const existingShop = await this.shopsRepository.findOne({ where: { username: dto.username } });
        if (existingShop) throw new RpcException({ code: 409, message: 'Duplicated Shop username' });

        if (dto.loginUsername != undefined && !this.isUsernameValid(dto.loginUsername)) {
            throw new RpcException({ code: 406, message: "the loginUsername is invalid" });
        }
        const existUser = await this.userClient.send('users/findOneByUsername', dto.loginUsername).toPromise();
        if (existUser) throw new RpcException({ code: 409, message: 'Duplicated Shop loginUsername' });

        let menu = new Menu();
        let smsAccount = new SmsAccount();
        let club = new Club();
        let shop = new Shop();
        let shopUser = new ShopUser();
        let region: Region;
        if (dto.regionId) region = <Region>{ id: dto.regionId };
        else if (dto.regionTitle) {
            region = await this.regionsRepository.save(<Region>{ title: dto.regionTitle });
        }


        menu.title = dto.title;
        menu.currency = "تومان";
        menu = await this.menusRepository.save(menu);
        smsAccount.charge = 50000;
        smsAccount = await this.smsClient.send<SmsAccount>('smsAccount/save', smsAccount).toPromise();
        club.title = dto.title;
        club = await this.clubClient.send<Club>('clubs/save', club).toPromise();

        shop.username = dto.username;
        shop.title = dto.title;
        shop.code = dto.code;
        shop.prevServerCode = dto.prevServerCode ? dto.prevServerCode : undefined;
        shop.menuId = menu.id;
        shop.smsAccountId = smsAccount.id;
        shop.region = region;
        shop.clubId = club.id;
        if (process.env.DEFAULT_BANK_PORTAL_ID) shop.bankPortalId = process.env.DEFAULT_BANK_PORTAL_ID;
        const savedShopInfo = await this.shopsRepository.save(shop);

        shopUser.user = <User>{ mobilePhone: dto.mobilePhone, firstName: dto.firstName, lastName: dto.lastName, username: dto.loginUsername, password: dto.loginPassword };
        shopUser.shop = <Shop>{ id: savedShopInfo.id };
        shopUser.role = ShopUserRole.Admin;
        await this.shopUserService.save(shopUser);

        for (let i = 0; i < pluginDates.length; i++) {
            const date = pluginDates[i];
            if (date) {
                await this.shopPluginsService.save(<ShopPlugin>{
                    shop: { id: savedShopInfo.id },
                    expiredAt: date,
                    plugin: i,
                    status: Status.Active,
                });
            }
        }

        return savedShopInfo;
    }

    isUsernameValid(username: string): boolean {
        if (typeof username != null || username != undefined) {
            const regex = /^[a-zA-Z0-9_]{3,}$/.test(username);
            return regex;
        }
    }

    async filter(filterShop: FilterShop): Promise<any> {
        const option: FindConditions<Shop> = {};
        const otherOptions: FindManyOptions<FilterShop> = {};

        if (filterShop.regionId) option.region = { id: filterShop.regionId };
        if (filterShop.clubId) option.clubId = filterShop.clubId;
        if (filterShop.title) option.title = Like(`%${filterShop.title}%`);
        if (filterShop.take) otherOptions.take = filterShop.take;
        if (filterShop.skip) otherOptions.skip = filterShop.skip;
        return this.shopsRepository.findAndCount({
            where: option,
            take: otherOptions.take,
            skip: otherOptions.skip
        })

    }

    // @Cron('* 15,45 * * * *')
    async checkConnectionPanel() {
        const shops = await this.shopsRepository.find({ relations: ['region'] });
        for (const s of shops) {
            if (s.details.openingHours) {
                console.log('the shop has opening hours filed')
                let timeZone = s.region.timeZone || '4:30';
                let hour = timeZone.split(':')[0];
                let minutes = timeZone.split(':')[1];
                let now = new Date();
                if (timeZone[0]) now.setHours(now.getHours() + Number(hour));
                if (timeZone[1]) now.setMinutes(now.getMinutes() + Number(minutes));
                if (Shop.isOpen(s.details.openingHours, now)) {
                    let now = new Date();
                    let lastConnection = s.connectionAt ? new Date(s.connectionAt) : null;
                    let differentTime;
                    if (lastConnection) differentTime = now.valueOf() - lastConnection.valueOf()
                    console.log(`${s.id} is open - the difference time is ${differentTime},now ${now}`)
                    if (lastConnection === null || Math.round(differentTime / 60000) > 10) {
                        console.log('this shop has condition for get sms -step 1', s)

                        if (!s.lastDisconnectAlertAt || (!s.connectionAt && !s.lastDisconnectAlertAt) || new Date(s.lastDisconnectAlertAt).valueOf() < new Date(s.connectionAt).valueOf())
                            console.log('this shop has Some condition for get Sms - step 2', s)

                        {
                            try {
                                const shopUser: ShopUser[] = await this.shopUserService.get(s.id);
                                let mobilePhoneAdmin = shopUser.find(x => x.role === ShopUserRole.Admin).user.mobilePhone;
                                let tokens: string[] = [];
                                tokens[0] = '-'
                                tokens[10] = s.title;
                                this.smsClient.send('sms/lookup', {
                                    accountId: s.smsAccountId,
                                    mobilePhone: mobilePhoneAdmin,
                                    kavenagarTemplate: process.env.NOT_CONNECTED_PANEL,
                                    tokens,
                                }).toPromise();
                                let shop = new Shop()
                                shop.id = s.id;
                                shop.lastDisconnectAlertAt = new Date();
                                this.shopsRepository.save(shop);
                            } catch (error) {
                                console.log(error)
                            }

                        }
                    }
                }
            }



        }

    }

    async filterByMenuIds(menuIds: string[]): Promise<Shop[]> {
        return this.shopsRepository.find({
            where: {
                menuId: In(menuIds)
            }
        })
    }
}
