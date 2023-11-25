import { Payment, PaymentGateway, PaymentGatewayType, PaymentToken } from '@menno/types';
import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

const SIZPAY_GET_TOKEN_URL = 'https://rt.sizpay.ir/api/PaymentSimple/GetTokenSimple';
const SIZPAY_BANK_URL = 'https://rt.sizpay.ir/Route/Payment';
const SIZPAY_CONFIRM_PAYMENT_URL = 'https://rt.sizpay.ir/api/PaymentSimple/ConfirmSimple';
const SIZPAY_REVERT_PAYMENT_URL = 'https://rt.sizpay.ir/api/PaymentSimple/ReverseSimple';

const ZIBAL_REQUEST_URL = 'https://gateway.zibal.ir/v1/request';
const ZIBAL_START_URL = 'https://gateway.zibal.ir/start';
const ZIBAL_VERIFY_URL = 'https://gateway.zibal.ir/v1/verify';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(PaymentToken)
    private tokensRepository: Repository<PaymentToken>,
    @InjectRepository(Payment)
    private paymentsRepository: Repository<Payment>,
    @InjectRepository(PaymentGateway)
    private gatewaysRepository: Repository<PaymentGateway>,
    private http: HttpService
  ) {}

  async getLink(dto: PaymentToken): Promise<string> {
    const gateway = await this.gatewaysRepository.findOne({
      where: { id: dto.gateway.id },
      select: {
        id: true,
        keys: true,
        type: true,
      },
    });

    if (gateway.type === PaymentGatewayType.Sizpay) {
      // const invoice = await this.invoicesRepository.findOne(dto.invoiceId);
      const getTokenBody = {
        Username: gateway.keys.username,
        Password: gateway.keys.password,
        MerchantID: gateway.keys.merchantId,
        TerminalID: gateway.keys.terminalId,
        Amount: dto.amount,
        OrderId: dto.orderId,
        AppExtraInf: dto.extraInfo,
        InvoiceNo: dto.invoiceId,
        ReturnURL: dto.returnUrl,
      };

      const tokenResponse: any = (await this.http.post(SIZPAY_GET_TOKEN_URL, getTokenBody).toPromise()).data;
      if (tokenResponse.ResCod == '0' || tokenResponse.ResCod == '00') {
        const token = new PaymentToken();
        token.amount = dto.amount;
        token.userId = dto.userId;
        token.userPhone = dto.userPhone;
        token.id = tokenResponse.Token;
        token.appReturnUrl = dto.appReturnUrl;
        token.extraInfo = dto.extraInfo;
        token.details = dto.details;
        token.shopId = dto.shopId;
        token.orderId = dto.orderId;
        token.gateway = gateway;
        // token.invoice = <Invoice>{
        //     id: dto.invoiceId
        // };

        await this.tokensRepository.save(token);
        return `${SIZPAY_BANK_URL}?MerchantID=${gateway.keys.merchantId}&TerminalID=${gateway.keys.terminalId}&Token=${token.id}`;
      }
      if (tokenResponse.ResCod == -56806) {
        throw new HttpException('conflict on orderId', HttpStatus.CONFLICT);
      }
      throw new HttpException(tokenResponse.Message, HttpStatus.BAD_REQUEST);
    } else if (gateway.type === PaymentGatewayType.Zibal) {
      const getTokenBody = {
        merchant: gateway.keys.merchantId,
        amount: dto.amount,
        orderId: dto.orderId,
        description: dto.extraInfo.Descr,
        mobile: dto.userPhone,
        callbackUrl: dto.returnUrl,
      };

      const tokenResponse: any = (await this.http.post(ZIBAL_REQUEST_URL, getTokenBody).toPromise()).data;
      if (tokenResponse.result == 100) {
        const token = new PaymentToken();
        token.amount = dto.amount;
        token.userId = dto.userId;
        token.userPhone = dto.userPhone;
        token.id = tokenResponse.trackId;
        token.appReturnUrl = dto.appReturnUrl;
        token.extraInfo = dto.extraInfo;
        token.details = dto.details;
        token.shopId = dto.shopId;
        token.orderId = dto.orderId;
        token.gateway = gateway;
        // token.invoice = <Invoice>{
        //     id: dto.invoiceId
        // };

        await this.tokensRepository.save(token);
        return `${ZIBAL_START_URL}/${token.id}`;
      }
    }
  }

  async afterBankPayment(data: any): Promise<Payment> {
    const payment = new Payment();
    const token = await this.tokensRepository.findOne({
      where: {
        id: data.Token || data.trackId,
      },
      relations: ['gateway'],
    });

    if (token.gateway.type === PaymentGatewayType.Sizpay) {
      payment.amount = parseInt(data.Amount);
      payment.details = token.details;
      payment.userId = token.userId;
      payment.userPhone = token.userPhone;
      payment.message = data.Message;
      payment.shopId = token.shopId;
      payment.appReturnUrl = token.appReturnUrl;
      payment.gateway = token.gateway;
      payment.invoiceId = data.InvoiceNo;
      payment.referenceId = data.RefNo;
      payment.token = data.Token;

      if (data.ResCod == '0' || data.ResCod == '00') {
        if (await this.confirm(token.gateway.id, token.id)) {
          payment.isCompleted = true;
          payment.confirmedAt = new Date();
        }
      } else {
        payment.isCompleted = false;
      }
      const savedPayment = await this.paymentsRepository.save(payment);
      savedPayment.gateway = undefined;
      savedPayment.token = undefined;
      return savedPayment;
    } else if (token.gateway.type === PaymentGatewayType.Zibal) {
      payment.amount = token.amount;
      payment.details = token.details;
      payment.userId = token.userId;
      payment.userPhone = token.userPhone;
      payment.shopId = token.shopId;
      payment.appReturnUrl = token.appReturnUrl;
      payment.gateway = token.gateway;
      payment.referenceId = data.trackId;
      payment.token = token.id;
      payment.invoiceId = token.orderId;
      payment.isCompleted = false;
      if (data.success == '1') {
        const confirm = await this.confirm(token.gateway.id, token.id);
        if (confirm) {
          payment.isCompleted = true;
          payment.referenceId = confirm;
          payment.confirmedAt = new Date();
        }
      } else {
        payment.isCompleted = false;
      }
      const savedPayment = await this.paymentsRepository.save(payment);
      savedPayment.gateway = undefined;
      savedPayment.token = undefined;
      return savedPayment;
    }
  }

  async confirm(gatewayId: string, tokenId: string): Promise<any> {
    const gateway = await this.gatewaysRepository.findOne({ where: { id: gatewayId }, select: ['keys', 'type'] });
    const token = await this.tokensRepository.findOne({ where: { id: tokenId } });
    if (gateway.type === PaymentGatewayType.Sizpay) {
      const body = {
        UserName: gateway.keys.username,
        Password: gateway.keys.password,
        MerchantID: gateway.keys.merchantId,
        TerminalID: gateway.keys.terminalId,
        Token: token.id,
        SignData: '',
      };
      const confirmResponse: any = (await this.http.post(SIZPAY_CONFIRM_PAYMENT_URL, body).toPromise()).data;
      if (confirmResponse.ResCOd == '0' || confirmResponse.ResCod == '00') {
        return true;
      } else {
        throw new HttpException(confirmResponse.Message, HttpStatus.BAD_REQUEST);
      }
    } else if (gateway.type === PaymentGatewayType.Zibal) {
      const body = {
        merchant: gateway.keys.merchantId,
        trackId: token.id,
      };
      const confirmResponse: any = (await this.http.post(ZIBAL_VERIFY_URL, body).toPromise()).data;
      if (confirmResponse.result == 100) {
        return confirmResponse.refNumber;
      } else {
        throw new HttpException(confirmResponse.Message, HttpStatus.BAD_REQUEST);
      }
    }
  }

  async revert(paymentId: string): Promise<any> {
    const payment = await this.paymentsRepository.findOne({
      where: {
        id: paymentId,
        isCompleted: true,
        confirmedAt: null,
      },
      relations: ['gateway'],
    });
    const gateway = await this.gatewaysRepository.findOne({
      where: { id: payment.gateway.id },
      select: ['keys'],
    });
    const RevertBody = {
      UserName: gateway.keys.username,
      Password: gateway.keys.password,
      MerchantID: gateway.keys.merchantId,
      TerminalID: gateway.keys.terminalId,
      Token: payment.token,
    };
    const revertResponse: any = (await this.http.post(SIZPAY_REVERT_PAYMENT_URL, RevertBody).toPromise())
      .data;
    if (revertResponse.ResCOd == '0' || revertResponse.ResCod == '00') {
      payment.reversedAt = new Date();
      this.paymentsRepository.save(payment);
      return payment;
    } else {
      throw new HttpException(revertResponse.Message, HttpStatus.BAD_REQUEST);
    }
  }

  // async filter(filter: FilterPayment): Promise<Payment[]> {
  //   const conditions: FindConditions<Payment> = {};
  //   if (filter.gateway) {
  //     conditions.gateway = filter.gateway;
  //   }

  //   if (filter.businessId) {
  //     conditions.businessId = filter.businessId;
  //   }

  //   if (filter.fromDate && filter.toDate) {
  //     conditions.createdAt = Between(filter.fromDate, filter.toDate);
  //   } else if (filter.fromDate) {
  //     conditions.createdAt = MoreThanOrEqual(filter.fromDate);
  //   } else if (filter.toDate) {
  //     conditions.createdAt = LessThanOrEqual(filter.toDate);
  //   }

  //   return this.paymentsRepository.find({
  //     where: conditions,
  //     order: { confirmedAt: 'DESC' },
  //   });
  // }
}
