import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { UserMicroservice } from 'src/core/microservices';
import { User } from 'src/core/models/user';
import { FindConditions, Repository } from 'typeorm';
import { ShopUser } from './entities/shop-user';

@Injectable()
export class ShopUsersService {
  constructor(
    @InjectRepository(ShopUser)
    private shopUserRepository: Repository<ShopUser>,
    @Inject(UserMicroservice.name)
    private userClient: ClientProxy
  ) {}

  async save(shopUser: ShopUser): Promise<any> {
    let user: User;
    if (shopUser.user) {
      if (shopUser.user.mobilePhone) {
        user = await this.userClient
          .send<User>('users/findOneByPhone', shopUser.user.mobilePhone)
          .toPromise();
        if (user)
          throw new RpcException({
            code: 409,
            message: 'this Phone is Duplicated',
          });
      }

      if (shopUser.user.username) {
        user = await this.userClient
          .send<User>('users/findOneByUsername', shopUser.user.username)
          .toPromise();
        if (user)
          throw new RpcException({
            code: 409,
            message: 'this Username is Duplicated',
          });
      }

      if (
        shopUser.user.username != undefined &&
        !this.isUsernameValid(shopUser.user.username)
      )
        throw new RpcException({
          code: 401,
          message: 'this userName is not Valid',
        });
      if (!user)
        user = await this.userClient
          .send('users/save', shopUser.user)
          .toPromise();
      if (user.id) {
        if (await this.shopUserRepository.findOne({ userId: user.id }))
          throw new RpcException({
            code: 409,
            message: 'this user is registered before',
          });
        shopUser.userId = user.id;
      }
    }
    return this.shopUserRepository.save(shopUser);
  }

  async delete(dto: { shopId: string; userId: string }): Promise<void> {
    const options: FindConditions<ShopUser> = {};
    options.shop = { id: dto.shopId };
    options.userId = dto.userId;
    await this.shopUserRepository.delete(options);
  }

  async get(shopId: string): Promise<any> {
    let options: FindConditions<ShopUser> = {};
    if (shopId) options.shop = { id: shopId };
    let shopUsers: ShopUser[] = await this.shopUserRepository.find({
      where: options,
    });
    let users: User[] = await this.userClient
      .send(
        'users/findByIds',
        shopUsers.map((x) => x.userId)
      )
      .toPromise();

    for (const item of shopUsers) {
      let user = users.find((x) => x.id == item.userId);
      if (user) {
        item.user = user;
      }
    }
    return shopUsers;
  }

  private async isUsernameValid(username: string): Promise<boolean> {
    if (typeof username != null || username != undefined) {
      const regex = /^[\w-_.]{0,5}$/.test(username);
      /*this Regex accept below items
            1- a-z or A-Z
            2- numbers
            3- . - _ 
            4- limit to 5 character
        */
      return regex;
    }
  }
}
