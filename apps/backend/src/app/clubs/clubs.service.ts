import {
  Club,
  DiscountCoupon,
  FilterDiscountCouponsDto,
  FilterMemberDto,
  Member,
  NewSmsDto,
  Order,
  Shop,
  Status,
  User,
  FilterMemberV2Dto,
  FilterMemberV2ResponseDto,
  MenuStat,
  StatAction,
  Menu,
} from '@menno/types';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  FindOptionsOrder,
  FindOptionsWhere,
  In,
  IsNull,
  LessThanOrEqual,
  Like,
  MoreThanOrEqual,
  Not,
  Repository,
} from 'typeorm';
import * as moment from 'jalali-moment';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SmsService } from '../sms/sms.service';
import { HttpService } from '@nestjs/axios';
import { RedisService } from '../core/redis.service';
import { PersianNumberService } from '@menno/utils';

@Injectable()
export class ClubsService {
  constructor(
    private smsService: SmsService,
    private http: HttpService,
    @InjectRepository(Order) private ordersRepo: Repository<Order>,
    @InjectRepository(Shop) private shopsRepo: Repository<Shop>,
    @InjectRepository(Club) private clubsRepo: Repository<Club>,
    @InjectRepository(Member) private membersRepo: Repository<Member>,
    @InjectRepository(User) private usersRepo: Repository<User>,
    @InjectRepository(DiscountCoupon) private discountCouponsRepo: Repository<DiscountCoupon>,
    private redis: RedisService,
    @InjectRepository(MenuStat) private menuStatsRepo: Repository<MenuStat>,
    @InjectRepository(Menu) private menusRepo: Repository<Menu>,
  ) {}

  async saveMember(member: Member): Promise<Member> {
    if (member.user) {
      if (member.user.id) {
        delete member.user.mobilePhone;
      } else if (member.user.mobilePhone) {
        const existUser = await this.usersRepo.findOneBy({ mobilePhone: member.user.mobilePhone });
        if (existUser) member.user.id = existUser.id;
      }
    }
    const exist = member.user?.id
      ? await this.membersRepo.findOne({
          where: {
            user: { mobilePhone: member.user.mobilePhone },
            club: { id: member.club.id },
          },
          withDeleted: true,
        })
      : await this.membersRepo.findOne({
          where: {
            id: member.id,
            club: { id: member.club.id },
          },
          withDeleted: true,
        });
    if (exist && exist.deletedAt) {
      await this.membersRepo.restore(exist.id);
    }
    return this.membersRepo.save(member);
  }

  async join(clubId: string, userId: string, referrer?: string, campaign?: string) {
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
    newMember.referrer = referrer;
    newMember.campaign = campaign;
    return this.membersRepo.save(newMember);
  }

  async filterMembers(filter: FilterMemberDto): Promise<[Member[], number]> {
    const conditions: FindOptionsWhere<Member> = {
      club: { id: filter.clubId },
      user: { mobilePhone: Not(IsNull()) },
    };

    const findOptions: FindOptionsWhere<Member>[] = [];

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

    if (filter.mobilePhone) {
      conditions.user = {
        mobilePhone: filter.mobilePhone,
      };
    }

    if (filter.tagIds?.length) {
      conditions.tags = {
        id: In(filter.tagIds),
      };
    }

    if (filter.query) {
      findOptions.push(
        { ...conditions, user: { firstName: Like(`%${PersianNumberService.toEnglish(filter.query)}%`) } },
        { ...conditions, user: { lastName: Like(`%${PersianNumberService.toEnglish(filter.query)}%`) } },
        { ...conditions, user: { mobilePhone: Like(`%${PersianNumberService.toEnglish(filter.query)}%`) } },
        { ...conditions, publicKey: Like(filter.query) },
      );
    } else {
      findOptions.push(conditions);
    }

    const sort: FindOptionsOrder<Member> = {};

    const sortType = filter.sortType == 'ASC' ? 1 : -1;
    switch (filter.sortBy) {
      case 'credit':
        sort.wallet = {
          charge: sortType,
        };
        break;
      case 'gem':
        sort.gem = sortType;
        break;
      case 'mobilePhone':
        sort.user = {
          mobilePhone: sortType,
        };
        break;
      case 'star':
        sort.star = sortType;
        break;
      default: // and 'joinedAt'
        sort.joinedAt = sortType;
        break;
    }

    return this.membersRepo.findAndCount({
      where: findOptions,
      relations: ['tags', 'wallet', 'user'],
      order: sort,
      take: filter.take,
      skip: filter.skip,
    });
  }

  async filterMembersV2(
    dto: FilterMemberV2Dto,
    shop: Shop,
  ): Promise<{ data: FilterMemberV2ResponseDto[]; totalCount: number }> {
    const menuId = shop?.menu?.id;
    const clubId = shop?.club?.id;
    // Get all members for the club
    const members = await this.membersRepo.find({
      where: { club: { id: clubId } },
      relations: ['user'],
    });
    let filteredMembers = members;
    if (!members.length) return { data: [], totalCount: 0 };
    const userIds = members.map((m) => m.user.id);

    // Get all orders for these users in this club
    const orders = await this.ordersRepo.find({
      where: {
        customer: { id: In(userIds) },
        shop: { id: shop.id },
      },
      relations: ['customer', 'shop'],
    });

    const ordersByUser: Record<string, Order[]> = {};
    for (const order of orders) {
      const userId = order.customer?.id;
      if (!userId) continue;
      if (!ordersByUser[userId]) ordersByUser[userId] = [];
      ordersByUser[userId].push(order);
    }

    // Apply order date filters
    if (dto.firstOrderFromDate || dto.firstOrderToDate || dto.lastOrderFromDate || dto.lastOrderToDate) {
      // Group orders by user

      // Filter users by first/last order date
      for (const userId of Object.keys(ordersByUser)) {
        ordersByUser[userId] = ordersByUser[userId].sort(
          (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
        );
        const userOrders = ordersByUser[userId];
        const firstOrder = userOrders[0];
        const lastOrder = userOrders[userOrders.length - 1];
        if (
          (dto.firstOrderFromDate &&
            (!firstOrder ||
              new Date(firstOrder.createdAt).valueOf() < new Date(dto.firstOrderFromDate).valueOf())) ||
          (dto.firstOrderToDate &&
            (!firstOrder ||
              new Date(firstOrder.createdAt).valueOf() > new Date(dto.firstOrderToDate).valueOf())) ||
          (dto.lastOrderFromDate &&
            (!lastOrder ||
              new Date(lastOrder.createdAt).valueOf() < new Date(dto.lastOrderFromDate).valueOf())) ||
          (dto.lastOrderToDate &&
            (!lastOrder || new Date(lastOrder.createdAt).valueOf() > new Date(dto.lastOrderToDate).valueOf()))
        ) {
          filteredMembers = filteredMembers.filter((m) => m.user.id !== userId);
        }
      }
    }
    // Filter by joinedAt
    if (dto.joinedAtFromDate || dto.joinedAtToDate) {
      filteredMembers = filteredMembers.filter((m) => {
        if (dto.joinedAtFromDate && new Date(m.joinedAt).valueOf() < new Date(dto.joinedAtFromDate).valueOf())
          return false;
        if (dto.joinedAtToDate && new Date(m.joinedAt).valueOf() > new Date(dto.joinedAtToDate).valueOf())
          return false;
        return true;
      });
    }

    if (dto.fromStar != undefined || dto.toStar != undefined) {
      filteredMembers = filteredMembers.filter((m) => {
        if (dto.fromStar != undefined && m.star < dto.fromStar) return false;
        if (dto.toStar != undefined && m.star > dto.toStar) return false;
        return true;
      });
    }

    if (filteredMembers.length === 0) return { data: [], totalCount: 0 };

    // Get last visit date for each user (MenuStat)
    let lastVisitMap: Record<string, Date | null> = {};
    if (menuId) {
      const menuStats = await this.menuStatsRepo
        .createQueryBuilder('stat')
        .select(['stat.userId as userId', 'MAX(stat.createdAt) as lastVisitDate'])
        .where('stat.menuId = :menuId', { menuId })
        .andWhere('stat.action = :action', { action: StatAction.LoadMenu })
        .andWhere('stat.userId IN (:...userIds)', { userIds: filteredMembers.map((m) => m.user.id) })
        .groupBy('stat.userId')
        .getRawMany();

      lastVisitMap = Object.fromEntries(
        menuStats.map((s) => [s.userid, s.lastvisitdate ? new Date(s.lastvisitdate) : null]),
      );
    }

    // Filter by lastVisitDate
    if (dto.lastVisitFromDate || dto.lastVisitToDate) {
      filteredMembers = filteredMembers.filter((m) => {
        const lastVisit = lastVisitMap[m.user.id];
        if (
          dto.lastVisitFromDate &&
          (!lastVisit || lastVisit.valueOf() < new Date(dto.lastVisitFromDate).valueOf())
        )
          return false;
        if (
          dto.lastVisitToDate &&
          (!lastVisit || lastVisit.valueOf() > new Date(dto.lastVisitToDate).valueOf())
        )
          return false;
        return true;
      });
    }

    // Build response
    let response = filteredMembers.map((member) => {
      const userOrders = ordersByUser[member.user.id] || [];
      const sortedOrders = userOrders.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      return {
        member,
        joinedAt: member.joinedAt,
        firstOrderTime: sortedOrders[0]?.createdAt || null,
        lastOrderTime: sortedOrders.length ? sortedOrders[sortedOrders.length - 1].createdAt : null,
        totalOrderCount: userOrders.length,
        totalOrderSum: userOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0),
        lastVisitDate: lastVisitMap[member.user.id] || null,
      };
    });

    // Sorting
    if (dto.sortBy) {
      response = response.sort((a, b) => {
        let aValue, bValue;
        switch (dto.sortBy) {
          case 'firstOrder':
            aValue = a.firstOrderTime || 0;
            bValue = b.firstOrderTime || 0;
            break;
          case 'lastOrder':
            aValue = a.lastOrderTime || 0;
            bValue = b.lastOrderTime || 0;
            break;
          case 'joinedAt':
            aValue = a.joinedAt || 0;
            bValue = b.joinedAt || 0;
            break;
          case 'lastVisit':
            aValue = a.lastVisitDate || 0;
            bValue = b.lastVisitDate || 0;
            break;
          case 'totalOrderCount':
            aValue = a.totalOrderCount;
            bValue = b.totalOrderCount;
            break;
          case 'totalOrderSum':
            aValue = a.totalOrderSum;
            bValue = b.totalOrderSum;
            break;
          case 'star':
            aValue = a.member.star;
            bValue = b.member.star;
            break;
          default:
            aValue = 0;
            bValue = 0;
        }
        if (aValue < bValue) return dto.sortType === 'ASC' ? -1 : 1;
        if (aValue > bValue) return dto.sortType === 'ASC' ? 1 : -1;
        return 0;
      });
    }

    const totalCount = response.length;

    // Pagination
    if (dto.skip !== undefined && dto.take !== undefined) {
      response = response.slice(dto.skip, dto.skip + dto.take);
    } else if (dto.take !== undefined) {
      response = response.slice(0, dto.take);
    }

    return { data: response, totalCount };
  }

  async filterDiscountCoupons(dto: FilterDiscountCouponsDto): Promise<DiscountCoupon[]> {
    const options: FindOptionsWhere<DiscountCoupon> = {};
    const member = dto.userId
      ? await this.membersRepo.findOne({
          where: { user: { id: dto.userId }, club: { id: dto.clubId } },
          relations: ['tags'],
        })
      : undefined;
    if (dto.clubId) {
      options.club = { id: dto.clubId };
    }
    if (dto.isEnabled) {
      options.status = Status.Active;
      options.startedAt = LessThanOrEqual(new Date());
      options.expiredAt = MoreThanOrEqual(new Date());
    }

    let coupons = await this.discountCouponsRepo.find({
      where: options,
      relations: ['user', 'tag'],
    });

    if (dto.userId) {
      if (!member) {
        coupons = coupons.filter((x) => !x.user && !x.code && x.star == null);
      } else {
        coupons = coupons.filter(
          (x) =>
            (!x.user || x.user?.id === dto.userId) &&
            x.star <= member.star &&
            (!x.code || x.user?.id === dto.userId) &&
            (!x.tag || member.tags?.find((tag) => tag.id === x.tag.id)),
        );
      }

      const orders = await this.ordersRepo.find({
        where: { discountCoupon: In(coupons.map((x) => x.id)) },
        relations: ['customer', 'discountCoupon'],
      });

      coupons = coupons.filter((c) => {
        if (c.maxUse) {
          const totalUse = orders.length;
          if (totalUse >= c.maxUse) return false;
        }
        if (c.maxUsePerUser) {
          const userUse = orders.filter(
            (x) => x.customer.id === dto.userId && x.discountCoupon?.id === c.id,
          ).length;
          if (userUse >= c.maxUsePerUser) return false;
        }
        return true;
      });
    }

    if (dto.star) {
      coupons = coupons.filter((x) => x.star != undefined && x.star >= dto.star);
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
              coupon.expiredAt.getDate() + c.config.anniversary.discountCoupon.durationInDay,
            );
            coupon.expiredAt.setHours(23, 59, 59, 99);
            coupon.user = m.user;
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
}
