import { FilterSmsDto, NewSmsDto, Sms, SmsAccount, SmsStatus, SmsTemplate } from '@menno/types';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  Between,
  MoreThanOrEqual,
  LessThanOrEqual,
  Like,
  MoreThan,
  FindOptionsWhere,
} from 'typeorm';

import * as Kavenegar from 'kavenegar';

let kavenegarApi;

@Injectable()
export class SmsService {
  constructor(
    @InjectRepository(Sms)
    private smsRepo: Repository<Sms>,
    @InjectRepository(SmsAccount)
    private smsAccountsRepo: Repository<SmsAccount>,
    @InjectRepository(SmsTemplate)
    private smsTemplatesRepo: Repository<SmsTemplate>
  ) {
    kavenegarApi = Kavenegar.KavenegarApi({
      apikey: process.env.KAVENEGAR_API_KEY,
    });
  }

  async send(dto: NewSmsDto): Promise<Sms[]> {
    if (dto.accountId) {
      const account = await this.smsAccountsRepo.findOneBy({
        id: dto.accountId,
      });
      if (account.charge < dto.receptors.length * 20) {
        throw new HttpException('not enough charge.', HttpStatus.PAYMENT_REQUIRED);
      }
    }

    return new Promise((resolve, reject) => {
      const kavenegarDtos: any[] = [];
      while (dto.receptors.length) {
        const receptors = dto.receptors.splice(0, 200);
        const messages = dto.messages.splice(0, 200);

        const kavenegarDto = {
          message: JSON.stringify(messages),
          sender: JSON.stringify(messages.map((x) => process.env.KAVENEGAR_SENDER_NUMBER)),
          receptor: JSON.stringify(receptors),
          date: dto.sentAt ? new Date(dto.sentAt).valueOf() / 1000 : undefined,
        };
        kavenegarDtos.push(kavenegarDto);
      }
      for (const kavenegarDto of kavenegarDtos) {
        kavenegarApi.SendArray(kavenegarDto, async (response, status) => {
          if (status == 200) {
            const entries = response;
            const sentSms: Sms[] = [];
            for (const entry of entries) {
              sentSms.push(<Sms>{
                account: <SmsAccount>{ id: dto.accountId },
                cost: this.getCost(entry.cost),
                message: entry.message,
                receptor: entry.receptor,
                sentAt: dto.sentAt,
                status: this.getStatus(entry.status),
                statusDescription: entry.statustext,
                kavenegarId: entry.messageid,
              });
            }
            const savedSms = await this.smsRepo.save(sentSms);
            resolve(savedSms);
          } else {
            reject(response);
          }
        });
      }
    });
  }

  async sendTemplate(dto: NewSmsDto) {
    const account = await this.smsAccountsRepo.findOneBy({ id: dto.accountId });
    if (account.charge < dto.receptors.length * 20) {
      throw new HttpException('not enough charge.', HttpStatus.PAYMENT_REQUIRED);
    }
    const template = await this.smsTemplatesRepo.findOneBy({
      id: dto.templateId,
    });
    if (!template) {
      throw new HttpException('template id not found.', HttpStatus.NOT_FOUND);
    }

    const messages: string[] = [];
    for (let i = 0; i < dto.receptors.length; i++) {
      let message = template.message;
      if (dto.templateParams) {
        for (const param in dto.templateParams) {
          if (Object.prototype.hasOwnProperty.call(dto.templateParams, param)) {
            message = message.replace(param, dto.templateParams[param][i]);
          }
        }
      }
      messages.push(message);
    }
    dto.messages = messages;
    return this.send(dto);
  }

  async lookup(
    accountId: string,
    mobilePhone: string,
    kavenagarTemplate: string,
    tokens: string[]
  ): Promise<Sms> {
    const account = await this.smsAccountsRepo.findOneBy({ id: accountId });
    if (account.charge < 20) {
      throw new HttpException('not enough charge.', HttpStatus.PAYMENT_REQUIRED);
    }
    return new Promise((resolve, reject) => {
      kavenegarApi.VerifyLookup(
        {
          receptor: mobilePhone,
          token: tokens[0],
          token2: tokens[1],
          token3: tokens[2],
          token10: tokens[3],
          token20: tokens[4],
          template: kavenagarTemplate,
        },
        async (response, status) => {
          if (status == 200) {
            const entry = response[0];
            const sms = <Sms>{
              account: <SmsAccount>{ id: accountId },
              cost: this.getCost(entry.cost),
              message: entry.message,
              receptor: entry.receptor,
              status: this.getStatus(entry.status),
              statusDescription: entry.statustext,
              kavenegarId: entry.messageid,
            };
            const savedSms = await this.smsRepo.save(sms);
            resolve(savedSms);
          } else {
            reject(response);
          }
        }
      );
    });
  }

  async filter(filter: FilterSmsDto): Promise<[Sms[], number]> {
    const condition: FindOptionsWhere<Sms> = {};
    if (filter.accountId) {
      condition.account = { id: filter.accountId };
    }
    if (filter.fromDate && filter.toDate) {
      condition.createdAt = Between(filter.fromDate, filter.toDate);
    } else if (filter.fromDate) {
      condition.createdAt = MoreThanOrEqual(filter.fromDate);
    } else if (filter.toDate) {
      condition.createdAt = LessThanOrEqual(filter.toDate);
    }
    if (filter.receptor) {
      condition.receptor = filter.receptor;
    }
    if (filter.query) {
      condition.message = Like(`%${filter.query}%`);
    }

    const sms = await this.smsRepo.findAndCount({
      where: condition,
      order: { createdAt: 'DESC' },
      take: filter.take,
      skip: filter.skip,
    });

    return sms;
  }

  @Cron(CronExpression.EVERY_30_SECONDS)
  async handleCron() {
    const now = new Date();
    const last5h = new Date(now.setHours(now.getHours() - 5));
    const allSms = await this.smsRepo.find({
      where: [{ createdAt: MoreThan(last5h) }, { sentAt: MoreThan(last5h) }],
    });

    while (allSms.length) {
      const groupedSms = allSms.splice(0, 500);
      const ids: number[] = groupedSms.map((x) => Number(x.kavenegarId));
      const body = {
        messageid: ids.toString(),
      };
      kavenegarApi.Status(body, (response, status) => {
        if (status === 200) {
          const savedSms: Sms[] = [];
          for (const entry of response) {
            const sms = groupedSms.find((x) => x.kavenegarId.toString() === entry.messageid.toString());
            if (sms.statusDescription !== entry.statustext) {
              sms.status = this.getStatus(entry.status);
              sms.statusDescription = entry.statustext;
              savedSms.push(sms);
            }
          }
          this.smsRepo.save(savedSms);
        }
      });
    }
  }

  private getStatus(status: number): SmsStatus {
    switch (status) {
      case 1:
      case 4:
      case 5:
        return SmsStatus.InQueue;
      case 2:
        return SmsStatus.Scheduled;
      case 10:
        return SmsStatus.Sent;
      default:
        return SmsStatus.Failed;
    }
  }

  private getCost(realCost: number) {
    return realCost * 0.109;
  }
}
