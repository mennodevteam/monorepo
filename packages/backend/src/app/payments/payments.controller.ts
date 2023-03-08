import { Member, Order, OrderDto, OrderPaymentType, Payment, PaymentToken, Shop, User } from '@menno/types';
import { Body, Controller, Get, HttpException, HttpStatus, Param, Post, Response } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { resolve } from 'path';
import { Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { Public } from '../auth/public.decorator';
import { LoginUser } from '../auth/user.decorator';
import { AuthPayload } from '../core/types/auth-payload';
import { OrdersService } from '../orders/orders.service';
import { PaymentsService } from './payments.service';
@Controller('payments')
export class PaymentsController {
  constructor(
    private paymentsService: PaymentsService,
    private ordersService: OrdersService,
    private auth: AuthService,
    @InjectRepository(Shop)
    private shopsRepository: Repository<Shop>,
    @InjectRepository(Member)
    private membersRepository: Repository<Member>,
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>
  ) {}

  @Post('addOrder')
  async addOrder(@LoginUser() user: AuthPayload, @Body() dto: OrderDto) {
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
        shopPageUrl: `${process.env.APP_URL}/${shop.username}`,
      },
      'add order',
      userData,
      dto.shopId
    );
  }

  @Get('payOrder/:orderId')
  async payOrder(@LoginUser() user: AuthPayload, @Param('orderId') orderId: string) {
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
        shopPageUrl: `${process.env.APP_URL}/'orders'/${order.id}`,
      },
      'pay order',
      userData,
      order.shop.id
    );
  }

  getRedirectLink(
    gatewayId: string,
    amount: number,
    details: any,
    description: string,
    user: User,
    shopId: string
  ) {
    if (!gatewayId) {
      throw new HttpException('no bank portal', HttpStatus.NOT_FOUND);
    }
    amount = amount * 10;
    const RETURN_URL = process.env.API_BASE_URL + '/payments/afterBankPayment';
    return this.paymentsService.getLink(<PaymentToken>{
      gateway: { id: gatewayId },
      orderId: new Date().valueOf().toString(),
      invoiceId: new Date().valueOf().toString(),
      appReturnUrl: process.env.APP_URL,
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
      shopId,
      amount,
      details,
    });
  }

  @Public()
  @Post('afterBankPayment')
  async return(@Body() dto: any, @Response() res) {
    const payment = await this.paymentsService.afterBankPayment(dto);
    if (payment.isCompleted) {
      if (payment.details.newOrder) {
        payment.details.newOrder.payment = payment;
        const order = await this.ordersService.dtoToOrder(payment.details.newOrder);
        const newOrder = await this.ordersRepository.save(order);
        const redirectUrl = `${process.env.APP_URL}/${process.env.APP_ORDER_PAGE_PATH}/${newOrder.id}`;
        return res.redirect(redirectUrl);
      } else if (payment.details.payOrder) {
        const order = await this.ordersRepository.findOneBy({ id: payment.details.payOrder.id });
        await this.ordersRepository.update(order.id, {
          payment: payment,
          paymentType: OrderPaymentType.Online,
        });
        const redirectUrl = `${process.env.APP_URL}/${process.env.APP_ORDER_PAGE_PATH}/${order.id}`;
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
      }
    } else {
      return res.redirect(payment.details.shopPageUrl);
    }
  }

  @Get('/chargeWallet/:shopId/:memberId/:amount')
  async chargeWalletAccount(
    @Param('shopId') shopId: string,
    @Param('memberId') memberId: string,
    @Param('amount') amount: string,
    @LoginUser() user: AuthPayload
  ) {
    const shop: Shop = await this.shopsRepository.findOne({
      where: { id: shopId },
      relations: ['paymentGateway'],
    });
    const userData = await this.auth.getUserData(user);
    return this.getRedirectLink(
      shop.paymentGateway.id,
      Number(amount),
      {
        chargeWallet: {
          amount: Number(amount),
          memberId,
          shop: shopId,
        },
        shopPageUrl: `${process.env.APP_URL}/${shop.username}`,
      },
      'charge wallet',
      userData,
      shopId
    );
  }
}
