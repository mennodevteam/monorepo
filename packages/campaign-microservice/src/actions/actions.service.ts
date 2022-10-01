import { Injectable } from '@nestjs/common';
import { MessagePattern, RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindConditions, getManager, MoreThan, Repository } from 'typeorm';
import { Action } from './entities/action';
import { FilterAction } from './entities/filter-action';

@Injectable()
export class ActionsService {
    constructor(
        @InjectRepository(Action)
        private actionRepository: Repository<Action>,
    ) { }

    async filter(filter: FilterAction): Promise<Action[]> {
        const conditions: FindConditions<Action> = {}

        if (filter.campaignId) {
            conditions.campaignId = filter.campaignId;
        }

        if (filter.businessId) {
            conditions.businessId = filter.businessId;
        }

        if (filter.category) {
            conditions.category = filter.category;
        }

        if (filter.label) {
            conditions.label = filter.label;
        }
        if (filter.fromDate) {
            conditions.createdAt = MoreThan(filter.fromDate);
        }
        if (filter.toDate) {
            conditions.createdAt = MoreThan(filter.toDate);
        }
        if (filter.toDate && filter.toDate) {
            conditions.createdAt = Between(filter.fromDate, filter.toDate);
        }

        return this.actionRepository.find({
            where: conditions,
            order: {
                createdAt: 'DESC',
            },
            skip: filter.skip,
            take: filter.take,
        });
    }

    async count(filter: FilterAction): Promise<number> {
        const conditions: FindConditions<Action> = {}

        if (filter.campaignId) {
            conditions.campaignId = filter.campaignId;
        }

        if (filter.businessId) {
            conditions.businessId = filter.businessId;
        }

        if (filter.category) {
            conditions.category = filter.category;
        }

        if (filter.label) {
            conditions.label = filter.label;
        }
        if (filter.fromDate) {
            conditions.createdAt = MoreThan(filter.fromDate);
        }
        if (filter.toDate) {
            conditions.createdAt = MoreThan(filter.toDate);
        }
        if (filter.toDate && filter.toDate) {
            conditions.createdAt = Between(filter.fromDate, filter.toDate);
        }

        return await this.actionRepository.count({
            where: conditions
        });
    }


    async uniqueCount(filterAction: FilterAction): Promise<any> {
        const queryFilter = this.actionRepository.createQueryBuilder('action')
            .andWhere('action.campaignId = :campaignId', { campaignId: filterAction.campaignId });
        if (filterAction.label) {
            queryFilter.andWhere('action.label = :label', { label: filterAction.label });
        }
        if (filterAction.fromDate) {
            queryFilter.andWhere('action.createdAt >= :fromDate', { fromDate: filterAction.fromDate });
        }
        if (filterAction.toDate) {
            queryFilter.andWhere('action.createdAt <= :toDate', { toDate: filterAction.toDate });
        }
        return queryFilter
            .select('COUNT(DISTINCT (action.userId))')
            .getRawMany()
    }




    async save(dto: Action): Promise<any> {
        let differenceTime: number;

        if (dto.prevDistanceInSeconds) {
            const prevActionDate = new Date();
            prevActionDate.setSeconds(prevActionDate.getSeconds() - dto.prevDistanceInSeconds);
            const prevAction = await this.actionRepository.findOne({
                where: {
                    campaignId: dto.campaignId,
                    businessId: dto.businessId,
                    category: dto.category,
                    label: dto.label,
                    userId: dto.userId,
                    createdAt: MoreThan(prevActionDate)
                }
            });
            if (prevAction) {
                throw new RpcException({ code: 425, message: 'early call. try again later' });
            }
        }

        return this.actionRepository.save(dto);
    }
}