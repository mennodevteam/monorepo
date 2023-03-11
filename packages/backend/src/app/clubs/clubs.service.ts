import {
  Club,
  DiscountCoupon,
  DiscountUsage,
  FilterDiscountCouponsDto,
  FilterMemberDto,
  Member,
  NewSmsDto,
  Shop,
  User,
} from '@menno/types';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindOptionsWhere, In, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import * as moment from 'jalali-moment';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SmsService } from '../sms/sms.service';
import { OldTypes } from '@menno/old-types';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class ClubsService {
  constructor(
    private smsService: SmsService,
    private http: HttpService,
    @InjectRepository(Shop) private shopsRepo: Repository<Shop>,
    @InjectRepository(Club) private clubsRepo: Repository<Club>,
    @InjectRepository(Member) private membersRepo: Repository<Member>,
    @InjectRepository(DiscountCoupon) private discountCouponsRepo: Repository<DiscountCoupon>,
    @InjectRepository(DiscountUsage) private discountCouponUsagesRepo: Repository<DiscountUsage>
  ) {}

  async saveMember(member: Member): Promise<Member> {
    if (member.user && member.user.id) {
      delete member.user.mobilePhone;
    }
    return this.membersRepo.save(member);
  }

  async join(clubId: string, userId: string) {
    const existMember = await this.membersRepo.findOne({
      where: {
        user: { id: userId },
        club: { id: clubId },
      },
      withDeleted: true,
    });

    if (existMember) {
      if (existMember.deletedAt) {
        await this.membersRepo.restore(existMember.id);
        existMember.deletedAt = null;
      }
      return existMember;
    }

    const newMember = new Member();
    newMember.club = <Club>{ id: clubId };
    newMember.user = <User>{ id: userId };
    return this.membersRepo.save(newMember);
  }

  async filterMembers(filter: FilterMemberDto): Promise<[Member[], number]> {
    const conditions: FindOptionsWhere<Member> = {
      club: { id: filter.clubId },
    };

    if (filter.userId) {
      conditions.user = { id: filter.userId };
    }

    if (filter.wallet) {
      conditions.wallet = { id: filter.wallet };
    }

    if (filter.fromDate && filter.toDate) {
      conditions.joinedAt = Between(filter.fromDate, filter.toDate);
    } else if (filter.fromDate) {
      conditions.joinedAt = MoreThanOrEqual(filter.fromDate);
    } else if (filter.toDate) {
      conditions.joinedAt = LessThanOrEqual(filter.toDate);
    }

    if (filter.fromStar && filter.toStar) {
      conditions.star = Between(filter.fromStar, filter.toStar);
    } else if (filter.fromStar) {
      conditions.star = MoreThanOrEqual(filter.fromStar);
    } else if (filter.toStar) {
      conditions.star = LessThanOrEqual(filter.toStar);
    }

    if (filter.publicKey) {
      conditions.publicKey = filter.publicKey;
    }

    if (filter.tagIds) {
      conditions.tags = In(filter.tagIds);
    }

    if (filter.mobilePhone) {
      conditions.user = {
        mobilePhone: filter.mobilePhone,
      };
    }

    let members = await this.membersRepo.find({
      where: conditions,
      relations: ['tags', 'wallet', 'user'],
    });

    if (filter.query) {
      members = members.filter((x) => {
        if (x.publicKey && x.publicKey === filter.query) return true;
        if (x.user) {
          const name: string[] = [];
          if (x.user.firstName) name.push(x.user.firstName);
          if (x.user.lastName) name.push(x.user.lastName);
          if (name.join(' ').search(filter.query) > -1) return true;

          if (x.user.mobilePhone && x.user.mobilePhone.search(filter.query) > -1) return true;
          if (x.user.email && x.user.email.search(filter.query) > -1) return true;
          if (x.user.username && x.user.username.search(filter.query) > -1) return true;
        }
        return false;
      });
    }

    switch (filter.sortBy) {
      case 'credit':
        if (filter.sortType == 'ASC') {
          members.sort((a, b) => (a.wallet ? a.wallet.charge : 0) - (b.wallet ? b.wallet.charge : 0));
        } else {
          members.sort((b, a) => (a.wallet ? a.wallet.charge : 0) - (b.wallet ? b.wallet.charge : 0));
        }
        break;
      case 'gem':
        if (filter.sortType == 'ASC') {
          members.sort((a, b) => (a.gem || 0) - (b.gem || 0));
        } else {
          members.sort((b, a) => (a.gem || 0) - (b.gem || 0));
        }
        break;
      case 'mobilePhone':
        if (filter.sortType == 'ASC') {
          members.sort((a, b) => Number(a.user.mobilePhone) - Number(b.user.mobilePhone));
        } else {
          members.sort((b, a) => Number(a.user.mobilePhone) - Number(b.user.mobilePhone));
        }
        break;
      case 'star':
        if (filter.sortType == 'ASC') {
          members.sort((a, b) => a.star - b.star);
        } else {
          members.sort((b, a) => a.star - b.star);
        }
        break;
      default: // and 'joinedAt'
        if (filter.sortType == 'ASC') {
          members.sort((a, b) => new Date(a.joinedAt).valueOf() - new Date(b.joinedAt).valueOf());
        } else {
          members.sort((b, a) => new Date(a.joinedAt).valueOf() - new Date(b.joinedAt).valueOf());
        }
        break;
    }
    const res = members.slice(filter.skip, filter.take ? (filter.skip || 0) + filter.take : undefined);
    return [res, members.length];
  }

  async filterDiscountCoupons(discountsCouponFilter: FilterDiscountCouponsDto): Promise<DiscountCoupon[]> {
    let couponUsage: DiscountUsage[];
    if (discountsCouponFilter.memberId) {
      couponUsage = await this.discountCouponUsagesRepo.find({
        where: { member: { id: discountsCouponFilter.memberId } },
        relations: ['member', 'discountCoupon'],
      });
    }
    const options: FindOptionsWhere<DiscountCoupon> = {};
    if (discountsCouponFilter.clubId) {
      options.club = { id: discountsCouponFilter.clubId };
    }
    if (discountsCouponFilter.isEnabled) {
      options.isEnabled = true;
      options.startedAt = LessThanOrEqual(new Date());
      options.expiredAt = MoreThanOrEqual(new Date());
    }

    let coupons = await this.discountCouponsRepo.find({
      where: options,
      relations: ['member', 'member.user'],
    });
    if (discountsCouponFilter.memberId) {
      coupons = coupons.filter(
        (x) =>
          (!x.member || x.member.id === discountsCouponFilter.memberId) &&
          couponUsage.find((y) => y.discountCoupon && y.discountCoupon.id === x.id) == undefined
      );
    }
    if (discountsCouponFilter.star) {
      coupons = coupons.filter((x) => x.star != undefined && x.star >= discountsCouponFilter.star);
    }

    return coupons;
  }

  async filterMembersAnniversary(clubId: string, month: number, date: number): Promise<Member[]> {
    const members = await this.membersRepo.find({
      where: { club: { id: clubId } },
      relations: ['user'],
    });
    const resMembers: Member[] = [];
    for (const member of members) {
      const user = member.user;
      if (user.birthDate) {
        const persianBirthDate = moment(user.birthDate).locale('fa').format('/M/D');
        if (persianBirthDate == `/${month}/${date}`) resMembers.push(member);
      }
      if (user.marriageDate) {
        const persianMarriedDate = moment(user.marriageDate).locale('fa').format('/M/D');
        if (persianMarriedDate == `/${month}/${date}`) resMembers.push(member);
      }
    }
    return resMembers;
  }

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async checkClubForAnniversarySms(initialDate?: Date): Promise<void> {
    if (!initialDate) {
      initialDate = new Date();
    }
    const clubs = await this.clubsRepo.find({
      relations: ['smsAccount'],
    });
    for (const c of clubs) {
      if (c.config && c.config.anniversary && c.config.anniversary.isEnabled) {
        const sentAt = new Date(initialDate);
        sentAt.setHours(c.config.anniversary.time || 9, 0, 0, 0);

        const birthDateSmsDto = new NewSmsDto();
        birthDateSmsDto.accountId = c.smsAccount.id;
        birthDateSmsDto.templateId = c.config.anniversary.birthDateTemplateId;
        birthDateSmsDto.templateParams = { '@@@': [] };
        birthDateSmsDto.receptors = [];
        birthDateSmsDto.sentAt = sentAt;

        const marriageDateSmsDto = new NewSmsDto();
        marriageDateSmsDto.accountId = c.smsAccount.id;
        marriageDateSmsDto.templateId = c.config.anniversary.marriageDateTemplateId;
        marriageDateSmsDto.templateParams = { '@@@': [] };
        marriageDateSmsDto.receptors = [];
        marriageDateSmsDto.sentAt = sentAt;

        const date = new Date(initialDate);
        if (c.config.anniversary.daysAgo) {
          date.setDate(date.getDate() + c.config.anniversary.daysAgo);
        }

        const pDate = moment(date).locale('fa');
        const anniversaryMembers = await this.filterMembersAnniversary(c.id, pDate.month() + 1, pDate.date());

        for (const m of anniversaryMembers) {
          if (
            m.user.birthDate &&
            pDate.format('/M/D') === moment(m.user.birthDate).locale('fa').format('/M/D') &&
            c.config.anniversary.birthDateTemplateId
          ) {
            birthDateSmsDto.receptors.push(m.user.mobilePhone);
            birthDateSmsDto.templateParams['@@@'].push(User.fullName(m.user));
          }
          if (
            m.user.marriageDate &&
            pDate.format('/M/D') === moment(m.user.marriageDate).locale('fa').format('/M/D') &&
            c.config.anniversary.marriageDateTemplateId
          ) {
            marriageDateSmsDto.receptors.push(m.user.mobilePhone);
            marriageDateSmsDto.templateParams['@@@'].push(User.fullName(m.user));
          }

          if (c.config.anniversary.discountCoupon) {
            const coupon = c.config.anniversary.discountCoupon.coupon;
            coupon.title = 'هدیه سالگرد';
            coupon.startedAt = new Date();
            coupon.expiredAt = new Date();
            coupon.expiredAt.setDate(
              coupon.expiredAt.getDate() + c.config.anniversary.discountCoupon.durationInDay
            );
            coupon.expiredAt.setHours(23, 59, 59, 99);
            coupon.member = m;
            coupon.club = c;
            this.discountCouponsRepo.save(coupon);
          }
        }

        if (birthDateSmsDto.receptors.length) {
          this.smsService.send(birthDateSmsDto);
        }

        if (marriageDateSmsDto.receptors.length) {
          this.smsService.send(marriageDateSmsDto);
        }
      }
    }
  }

  async syncClub(code: string) {
    const shop = await this.shopsRepo.findOneBy({ code });
    if (!shop) return;
    const res = await this.http
      .get<{ club: OldTypes.Club; members: [OldTypes.Member[], number] }>(
        `https://new-admin-api.menno.ir/shops/club-data/xmje/${code}`
      )
      .toPromise();

    const { members, club } = res.data;
    const newClub = await this.clubsRepo.save({
      id: club.id,
      createdAt: club.createdAt,
      title: shop.title,
    });

    await this.shopsRepo.update(shop.id, {
      club: { id: club.id },
    });

    members[0].forEach((member) => {
      member.club = { id: club.id } as OldTypes.Club;
    });

    const newMembers = await this.membersRepo.save(
      members[0].map((m) => {
        return <Member>{
          club: { id: club.id },
          description: m.description,
          extraInfo: m.extraInfo,
          gem: m.gem,
          joinedAt: m.joinedAt,
          id: m.id,
          publicKey: m.publicKey,
          star: m.star,
          user: m.user,
          wallet: m.wallet,
        };
      })
    );

    return { club, members: newMembers };
  }
}
