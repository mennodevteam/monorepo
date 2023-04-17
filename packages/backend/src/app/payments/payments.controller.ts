import {
  Member,
  Order,
  OrderDto,
  OrderPaymentType,
  PaymentGateway,
  PaymentToken,
  Shop,
  SmsAccount,
  User,
} from '@menno/types';
import { Body, Controller, Get, HttpException, HttpStatus, Param, Post, Req, Response } from '@nestjs/common';
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
import { Role } from '../core/types/role.enum';
import { environment } from '../../environments/environment';
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
    @InjectRepository(PaymentGateway)
    private paymentGatewaysRepo: Repository<PaymentGateway>,
    @InjectRepository(Member)
    private membersRepository: Repository<Member>,
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>
  ) {}

  @Roles(Role.App)
  @Post('addOrder')
  async addOrder(@LoginUser() user: AuthPayload, @Body() dto: OrderDto, @Req() req: Request) {
    const shop: Shop = await this.shopsRepository.findOne({
      where: { id: dto.shopId },
      relations: ['paymentGateway'],
    });
    if (!shop.paymentGateway) throw new HttpException('no payment gateway for shop', HttpStatus.NOT_FOUND);
    dto.isManual = false;
    dto.creatorId = user.id;
    dto.customerId = user.id;
    dto.paymentType = OrderPaymentType.Online;
    const order = await this.ordersService.dtoToOrder(dto);
    const userData = await this.auth.getUserData(user);
    return this.getRedirectLink(
      shop.paymentGateway.id,
      order.totalPrice,
      {
        newOrder: dto,
      },
      'add order',
      userData,
      dto.shopId,
      req.headers.origin
    );
  }

  @Roles(Role.Panel)
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
      'add order',
      userData,
      shop.id,
      req.headers.origin
    );
  }

  @Roles(Role.App)
  @Get('payOrder/:orderId')
  async payOrder(@LoginUser() user: AuthPayload, @Param('orderId') orderId: string, @Req() req: Request) {
    const order = await this.ordersRepository.findOne({
      where: { id: orderId },
      relations: ['shop.paymentGateway'],
    });
    if (!order.shop.paymentGateway)
      throw new HttpException('no payment gateway for shop', HttpStatus.NOT_FOUND);
    const userData = await this.auth.getUserData(user);
    return this.getRedirectLink(
      order.shop.paymentGateway.id,
      order.totalPrice,
      {
        payOrder: { id: orderId },
      },
      'pay order',
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
  @Post('afterBankPayment')
  async return(@Body() dto: any, @Response() res) {
    const payment = await this.paymentsService.afterBankPayment(dto);
    if (payment?.isCompleted) {
      if (payment.details.newOrder) {
        payment.details.newOrder.payment = { id: payment.id };
        const order = await this.ordersService.dtoToOrder(payment.details.newOrder);
        const newOrder = await this.ordersRepository.save(order);
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
        const amount = payment.amount / 1.09;
        await this.smsAccountsRepository.increment(
          { id: payment.details.chargeSmsAccount.smsAccountId },
          'charge',
          amount
        );
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
