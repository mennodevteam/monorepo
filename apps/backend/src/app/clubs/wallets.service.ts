import { Wallet, WalletLog } from '@menno/types';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class WalletsService {
  constructor(
    @InjectRepository(Wallet) private walletsRepo: Repository<Wallet>,
    @InjectRepository(WalletLog) private walletLogsRepo: Repository<WalletLog>
  ) {}

  async updateWalletAmount(dto: WalletLog) {
    const wallet = await this.walletsRepo.findOneBy({ id: dto.wallet.id });
    wallet.charge += dto.amount;
    await this.walletLogsRepo.save(dto);
    this.walletsRepo.update(wallet.id, { charge: wallet.charge });
    return wallet;
  }
}
