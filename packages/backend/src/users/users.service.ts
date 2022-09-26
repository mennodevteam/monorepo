import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { PersianNumberService } from '@menno/utils';
import { ChangePasswordDto, User } from '@menno/types';
import * as Kavenegar from 'kavenegar'

let kavenegarApi;

@Injectable()
export class UsersService {
  private _mobileConfirmToken: { [key: string]: string } = {};
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>
  ) {
    kavenegarApi = Kavenegar.KavenegarApi({
      apikey: process.env.KAVENEGAR_API_KEY,
    });
  }

  findByIds(ids: string[]): Promise<User[]> {
    return this.usersRepository.findByIds(ids);
  }

  filterByBusinessId(businessId: string): Promise<User[]> {
    return this.usersRepository.find({
      where: { businessId },
    });
  }

  findOne(id: string): Promise<User> {
    return this.usersRepository.findOneBy({ id });
  }

  async loginWithPhone(
    mobilePhone: string,
    kavenegarTemplate?: string
  ): Promise<void> {
    mobilePhone = PersianNumberService.toEnglish(mobilePhone);
    return new Promise((resolve, reject) => {
      const token = Math.floor(Math.random() * 8000 + 1000).toString();
      console.log('login with phone', mobilePhone);
      kavenegarApi.VerifyLookup(
        {
          receptor: mobilePhone,
          token: token,
          template:
            kavenegarTemplate || process.env.KAVENEGAR_CONFIRM_PHONE_TEMPLATE,
        },
        (response, status) => {
          console.log('login with phone res', response, status);
          if (status == 200) {
            this._mobileConfirmToken[mobilePhone] = token;
            setTimeout(() => {
              delete this._mobileConfirmToken[mobilePhone];
            }, 120000);
            resolve();
          } else {
            reject(response);
          }
        }
      );
    });
  }

  async confirmToken(
    mobilePhone: string,
    token: string,
    userId?: string
  ): Promise<User> {
    mobilePhone = PersianNumberService.toEnglish(mobilePhone);
    token = PersianNumberService.toEnglish(token);
    const t = this._mobileConfirmToken[mobilePhone];
    if (t) {
      if (t === token) {
        let user: User;
        user = await this.usersRepository.findOneBy({ mobilePhone });
        if (!user) {
          user = await this.usersRepository.save({
            id: userId,
            mobilePhone,
          });
        }
        return user;
      } else {
        throw new HttpException('token is invalid', HttpStatus.FORBIDDEN);
      }
    } else {
      throw new HttpException('phone number not exist', HttpStatus.NOT_FOUND);
    }
  }

  async findOneByPhone(mobilePhone: string): Promise<User> {
    return this.usersRepository.findOneBy({
      mobilePhone: PersianNumberService.toEnglish(mobilePhone),
    });
  }

  async findOneByEmail(email: string): Promise<User> {
    return this.usersRepository.findOneBy({ email });
  }

  async findOneByUsername(username: string): Promise<User> {
    return this.usersRepository.findOneBy({ username });
  }

  async changePassword(dto: ChangePasswordDto): Promise<void> {
    if (!dto.newPassword || dto.newPassword.length < 4) {
      throw new HttpException('passwords is too short', HttpStatus.NOT_ACCEPTABLE);
    }
    if (dto.newPassword != dto.newPasswordRepeat) {
      throw new HttpException('passwords are not same.', HttpStatus.CONFLICT);
    }
    const user = await this.usersRepository.findOneBy({id: dto.id});
    if (user.password != dto.prevPassword) {
      throw new HttpException('prev password is not correct', HttpStatus.FORBIDDEN);
    }

    user.password = dto.newPassword;
    await this.usersRepository.save({
      id: dto.id,
      password: dto.newPassword,
    });
  }

  async search(text: string): Promise<User> {
    return this.usersRepository.findOne({
      where: [
        { username: text },
        { mobilePhone: PersianNumberService.toEnglish(text) },
        { email: text },
      ],
    });
  }

  save(user: User): Promise<User> {
    console.log(user);
    if (user.mobilePhone)
      user.mobilePhone = PersianNumberService.toEnglish(user.mobilePhone);
    console.log(user);
    return this.usersRepository.save(user);
  }

  findDiagonUsers(dto: {
    take?: number;
    skip?: number;
  }): Promise<[User[], number]> {
    return this.usersRepository.findAndCount({
      where: {
        extraInfo: Like('%diagon%'),
      },
      take: dto.take,
      skip: dto.skip,
    });
  }
}
