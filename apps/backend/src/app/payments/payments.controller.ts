import {
  Member,
  Order,
  OrderDto,
  OrderPaymentType,
  PaymentGateway,
  PaymentToken,
  Plugin,
  Shop,
  ShopPlugins,
  SmsAccount,
  User,
  UserRole,
} from '@menno/types';
import {
  Body,
  ConflictException,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  Response,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { Public } from '../auth/public.decorator';
import { LoginUser } from '../auth/user.decorator';
import { AuthPayload } from '../core/types/auth-payload';
import { OrdersService } from '../orders/orders.service';
import { PaymentsService } from './payments.service';
import { Roles } from '../auth/roles.decorators';
import { environment } from '../../environments/environment';
import { RedisService } from '../core/redis.service';
@Controller('payments')
export class PaymentsController {
  constructor(
    private paymentsService: PaymentsService,
    private ordersService: OrdersService,
    private auth: AuthService,
    @InjectRepository(Shop)
    private shopsRepository: Repository<Shop>,
    @InjectRepository(SmsAccount)
    private smsAccountsRepository: Repository<SmsAccount>,
    @InjectRepository(ShopPlugins)
    private shopPluginsRepo: Repository<ShopPlugins>,
    @InjectRepository(PaymentGateway)
    private paymentGatewaysRepo: Repository<PaymentGateway>,
    @InjectRepository(Member)
    private membersRepository: Repository<Member>,
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    private redis: RedisService
  ) {}

  @Roles(UserRole.App)
  @Post('addOrder')
  async addOrder(@LoginUser() user: AuthPayload, @Body() dto: OrderDto, @Req() req: Request) {
    const shop: Shop = await this.shopsRepository.findOne({
      where: { id: dto.shopId },
      relations: ['paymentGateway', 'club'],
    });
    if (!shop.paymentGateway) throw new HttpException('no payment gateway for shop', HttpStatus.NOT_FOUND);
    dto.isManual = false;
    dto.creatorId = user.id;
    dto.customerId = user.id;
    dto.paymentType = OrderPaymentType.Online;
    const order = await this.ordersService.dtoToOrder(dto);
    const userData = await this.auth.getUserData(user);
    const totalPrice = order.walletPaymentAmount
      ? order.totalPrice - order.walletPaymentAmount
      : order.totalPrice;
    return this.getRedirectLink(
      shop.paymentGateway.id,
      totalPrice,
      {
        newOrder: dto,
      },
      'add order',
      userData,
      dto.shopId,
      req.headers.origin
    );
  }

  @Roles(UserRole.Panel)
  @Post('extendPlugin')
  async extendPlugin(
    @LoginUser() user: AuthPayload,
    @Req() req: Request,
    @Body()
    body: {
      isMonthly?: boolean;
      plugins: Plugin[];
    }
  ) {
    const shop: Shop = await this.auth.getPanelUserShop(user, ['plugins']);
    const defaultGateway = await this.defaultGateway;
    const userData = await this.auth.getUserData(user);

    const currentExpire = new Date(shop.plugins.expiredAt);

    const expiredAt = currentExpire.valueOf() > Date.now() ? new Date(currentExpire) : new Date();
    if (expiredAt.valueOf() - Date.now() > 9 * 24 * 3600000) throw new ConflictException('too soon');
    const newExpiredAt = new Date(expiredAt);
    if (body.isMonthly) {
      newExpiredAt.setMonth(newExpiredAt.getMonth() + 1);
    } else {
      newExpiredAt.setFullYear(newExpiredAt.getFullYear() + 1);
    }

    let price: number;
    if (body.plugins.length === 3) {
      price = body.isMonthly ? 999000 : 10000000;
    } else if (body.plugins.length === 2) {
      price = body.isMonthly ? 799000 : 8000000;
    } else {
      price = body.isMonthly ? 299000 : 3000000;
    }

    return this.getRedirectLink(
      defaultGateway.id,
      Number(price),
      {
        extendPlugin: {
          plugins: body.plugins,
          expiredAt: newExpiredAt,
          pluginId: shop.plugins.id,
          shopId: shop.id,
        },
      },
      `خرید ماژول مجموعه ${shop.title}`,
      userData,
      shop.id,
      req.headers.origin
    );
  }

  @Roles(UserRole.Panel)
  @Get('chargeSmsAccount/:amount')
  async chargeSmsAccount(
    @LoginUser() user: AuthPayload,
    @Req() req: Request,
    @Param('amount') amount: string
  ) {
    const shop: Shop = await this.auth.getPanelUserShop(user, ['smsAccount']);
    const defaultGateway = await this.defaultGateway;
    if (!shop?.smsAccount) throw new HttpException('no sms account for shop', HttpStatus.NOT_FOUND);
    const userData = await this.auth.getUserData(user);
    return this.getRedirectLink(
      defaultGateway.id,
      Number(amount) * 1.09,
      {
        chargeSmsAccount: {
          smsAccountId: shop.smsAccount.id,
        },
      },
      `شارژ پیامک مجموعه ${shop.title}`,
      userData,
      shop.id,
      req.headers.origin
    );
  }

  @Roles(UserRole.Panel)
  @Get('test/:amount')
  async test(@LoginUser() user: AuthPayload, @Req() req: Request, @Param('amount') amount: string) {
    const shop: Shop = await this.auth.getPanelUserShop(user, ['paymentGateway']);
    if (!shop.paymentGateway) throw new HttpException('no payment gateway for shop', HttpStatus.NOT_FOUND);
    return this.getRedirectLink(
      shop.paymentGateway.id,
      Number(amount),
      {
        test: true,
      },
      'test',
      { id: user.id, mobilePhone: user.mobilePhone } as User,
      shop.id,
      req.headers.origin
    );
  }

  @Roles(UserRole.App)
  @Get('payOrder/:orderId')
  async payOrder(@LoginUser() user: AuthPayload, @Param('orderId') orderId: string, @Req() req: Request) {
    const order = await this.ordersRepository.findOne({
      where: { id: orderId },
      relations: ['shop.paymentGateway'],
    });
    if (!order.shop.paymentGateway)
      throw new HttpException('no payment gateway for shop', HttpStatus.NOT_FOUND);
    const userData = await this.auth.getUserData(user);
    const totalPrice = order.walletPaymentAmount
      ? order.totalPrice - order.walletPaymentAmount
      : order.totalPrice;
    return this.getRedirectLink(
      order.shop.paymentGateway.id,
      totalPrice,
      {
        payOrder: { id: orderId },
      },
      `پرداخت سفارش فیش ${order.qNumber}`,
      userData,
      order.shop.id,
      req.headers.origin
    );
  }

  getRedirectLink(
    gatewayId: string,
    amount: number,
    details: any,
    description: string,
    user: User,
    shopId: string,
    appReturnUrl: string
  ) {
    if (!gatewayId) {
      throw new HttpException('no bank portal', HttpStatus.NOT_FOUND);
    }
    amount = Math.floor(amount * 10);
    const RETURN_URL = process.env.API_BASE_URL + '/payments/afterBankPayment';
    return this.paymentsService.getLink(<PaymentToken>{
      gateway: { id: gatewayId },
      orderId: new Date().valueOf().toString(),
      invoiceId: new Date().valueOf().toString(),
      returnUrl: RETURN_URL,
      userId: user.id,
      userPhone: user.mobilePhone,
      extraInfo: {
        Descr: description,
        PayTitle: description,
        PayerEmail: user.email,
        PayerIP: '',
        PayerMobile: user.mobilePhone,
        PayerNm: User.fullName(user),
      },
      appReturnUrl,
      shopId,
      amount,
      details,
    });
  }

  @Public()
  @Get('afterBankPayment')
  async returnUrlGet(@Query() query, @Response() res) {
    return this.returnUrl(query, res);
  }

  @Public()
  @Post('afterBankPayment')
  async returnUrl(@Body() dto: any, @Response() res) {
    const payment = await this.paymentsService.afterBankPayment(dto);
    if (payment?.isCompleted) {
      if (payment.details.newOrder) {
        payment.details.newOrder.payment = { id: payment.id };
        const newOrder = await this.ordersService.addOrder(payment.details.newOrder);
        const redirectUrl = `${payment.appReturnUrl}/${environment.appOrderCompletePath}/${newOrder.id}`;
        return res.redirect(redirectUrl);
      } else if (payment.details.payOrder) {
        const order = await this.ordersRepository.findOneBy({ id: payment.details.payOrder.id });
        await this.ordersRepository.update(order.id, {
          payment: { id: payment.id },
          paymentType: OrderPaymentType.Online,
        });
        const redirectUrl = `${payment.appReturnUrl}/${environment.appOrderDetailsPath}/${order.id}`;
        return res.redirect(redirectUrl);
      } else if (payment.details.chargeWallet) {
        // const shop = await this.sh;
        // let wallet: Wallet = await this.clubMicroservice.send('wallets/findWallet', member.id).toPromise();
        // if (wallet) {
        //   let walletLog = new WalletLogs();
        //   walletLog.user = payment.details.chargeWallet.userId;
        //   walletLog.amount = payment.details.chargeWallet.amount;
        //   walletLog.wallet = wallet;
        //   walletLog.type = WalletLogType.OnlineCharge;
        //   await this.clubMicroservice.send('walletLogs/save', walletLog).toPromise();
        // } else {
        //   throw new HttpException('This Member don t have any wallet', HttpStatus.BAD_REQUEST);
        // }
        // const redirectUrl = `${process.env.APP_URL}/${shop.username}`;
        // return res.redirect(redirectUrl);
      } else if (payment.details.chargeSmsAccount) {
        const amount = payment.amount / 10 / 1.09;
        await this.smsAccountsRepository.increment(
          { id: payment.details.chargeSmsAccount.smsAccountId },
          'charge',
          amount
        );
        const redirectUrl = `${payment.appReturnUrl}`;
        return res.redirect(redirectUrl);
      } else if (payment.details.test) {
        const redirectUrl = `${payment.appReturnUrl}`;
        return res.redirect(redirectUrl);
      } else if (payment.details.extendPlugin) {
        await this.shopPluginsRepo.update(payment.details.extendPlugin.pluginId, {
          plugins: payment.details.extendPlugin.plugins,
          expiredAt: new Date(payment.details.extendPlugin.expiredAt),
          renewAt: new Date(),
        });
        this.redis.updateShop(payment.details.extendPlugin.shopId);
        const redirectUrl = `${payment.appReturnUrl}`;
        return res.redirect(redirectUrl);
      }
    } else {
      return res.redirect(payment.appReturnUrl);
    }
  }

  get defaultGateway() {
    return this.paymentGatewaysRepo.findOneBy({ title: 'default' });
  }

  // @Get('/chargeWallet/:shopId/:memberId/:amount')
  // async chargeWalletAccount(
  //   @Param('shopId') shopId: string,
  //   @Param('memberId') memberId: string,
  //   @Param('amount') amount: string,
  //   @LoginUser() user: AuthPayload
  // ) {
  //   const shop: Shop = await this.shopsRepository.findOne({
  //     where: { id: shopId },
  //     relations: ['paymentGateway'],
  //   });
  //   const userData = await this.auth.getUserData(user);
  //   return this.getRedirectLink(
  //     shop.paymentGateway.id,
  //     Number(amount),
  //     {
  //       chargeWallet: {
  //         amount: Number(amount),
  //         memberId,
  //         shop: shopId,
  //       },
  //       shopPageUrl: `${process.env.APP_URL}/${shop.username}`,
  //     },
  //     'charge wallet',
  //     userData,
  //     shopId
  //   );
  // }
}
