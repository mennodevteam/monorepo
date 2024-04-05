import { Shop, User, Wallet, WalletLog, WalletLogType } from '@menno/types';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SmsService } from '../sms/sms.service';
import { PersianNumberService } from '@menno/utils';

@Injectable()
export class WalletsService {
  constructor(
    @InjectRepository(Shop) private shopsRepo: Repository<Shop>,
    @InjectRepository(Wallet) private walletsRepo: Repository<Wallet>,
    @InjectRepository(WalletLog) private walletLogsRepo: Repository<WalletLog>,
    private sms: SmsService
  ) {}

  async updateWalletAmount(dto: WalletLog, shopId: string) {
    const wallet = await this.walletsRepo.findOne({
      where: { id: dto.wallet.id },
      relations: ['member.user', 'member.club'],
    });
    const shop = await this.shopsRepo.findOne({ where: { id: shopId }, relations: ['smsAccount'] });
    wallet.charge += dto.amount;
    await this.walletLogsRepo.save(dto);
    if (wallet.member.user) {
      const textContent = this.getMessageText(dto, shop, wallet);
      this.sms.send({
        messages: [textContent],
        receptors: [wallet.member.user.mobilePhone],
        accountId: shop.smsAccount.id,
      });
    }

    this.walletsRepo.update(wallet.id, { charge: wallet.charge });
    return wallet;
  }

  private getMessageText(dto: WalletLog, shop: Shop, wallet: Wallet) {
    let text = `${shop.title}\n\n${wallet.member.user.firstName} عزیز\n`;
    switch (dto.type) {
      case WalletLogType.ManualCharge:
        text += `کیف پول شما به مبلغ ${PersianNumberService.withCommas(
          dto.amount
        )} تومان شارژ شد و می‌توانید در سفارشات بعدی از آن استفاده کنید.\nموچودی کیف پول: ${PersianNumberService.withCommas(wallet.charge)} تومان`;
        break;
      case WalletLogType.PayOrder:
        text += `بابت ثبت سفارش مبلغ ${PersianNumberService.withCommas(
          Math.abs(dto.amount)
        )} تومان از کیف پول شما کسر شد.\nموجودی کیف پول: ${PersianNumberService.withCommas(wallet.charge)}`;
        break;
    }

    text += `\n\nبرای مشاهده منو و ثبت سفارش از لینک زیر استفاده کنید\n${Shop.appLink(
      shop,
      process.env.APP_ORIGIN
    )}`;
    return text;
  }

  async getMemberWallet(memberId: string) {
    const wallet = await this.walletsRepo.findOneBy({ member: { id: memberId } });
    return wallet || (await this.walletsRepo.save({ member: { id: memberId }, charge: 0 } as Wallet));
  }
}
