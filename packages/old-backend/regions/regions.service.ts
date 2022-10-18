import { Region } from '@menno/types';
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Test } from '@nestjs/testing';
import { InjectRepository } from '@nestjs/typeorm';
import { Cipher } from 'crypto';
import { request } from 'express';
import { Repository } from 'typeorm';

@Injectable()
export class RegionsService {
  constructor(
    @InjectRepository(Region)
    private regionsRepository: Repository<Region>
  ) {}

  async delete(id: string): Promise<void> {
    await this.regionsRepository.delete(id);
  }

  async find(): Promise<Region[]> {
    return this.regionsRepository.find();
  }

  async findOne(id: string): Promise<Region> {
    return this.regionsRepository.findOneBy({ id });
  }

  async save(region: Region): Promise<any> {
    return this.regionsRepository.save(<any>region);
  }
}
