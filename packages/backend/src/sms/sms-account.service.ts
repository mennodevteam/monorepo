import { SmsAccount } from '@menno/types';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class SmsAccountService {
  constructor(
    @InjectRepository(SmsAccount)
    private accountsRepository: Repository<SmsAccount>
  ) {}

  findOne(id: string): Promise<SmsAccount> {
    return this.accountsRepository.findOneBy({ id });
  }

  save(account: SmsAccount): Promise<SmsAccount> {
    return this.accountsRepository.save(account);
  }

  decrementCharge(accountId: string, value: number) {
    this.accountsRepository.decrement({ id: accountId }, 'charge', value);
  }

  incrementCharge(accountId: string, value: number) {
    this.accountsRepository.increment({ id: accountId }, 'charge', value);
  }
}
