import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';

export enum RedisKey {
  PrintAction = 'print-action',
}

@Injectable()
export class RedisService {
  private readonly redisClient: Redis;

  constructor() {
    this.redisClient = new Redis(process.env.REDIS_URI);
  }

  get client() {
    return this.redisClient;
  }

  key(key: RedisKey, id: string) {
    return `${key}-${id}`;
  }
}
