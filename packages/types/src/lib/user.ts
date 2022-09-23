import { GenderType } from './gender-type.enum';

export class User {
  id: string;
  username: string;
  password: string;
  mobilePhone: string;
  email: string;
  avatar: string;
  firstName: string;
  lastName: string;
  gender?: GenderType;
  birthDate: Date;
  marriageDate: Date;
  instagram: string;
  localPhone: string;
  address: string;
  job: string;
  createdAt: Date;
  shopId: string;
  clubId: string;
  token: string;

  toString(user: User) {
    try {
      const arr = [];
      if (user.firstName) arr.push(user.firstName);
      if (user.lastName) arr.push(user.lastName);
      return arr.join(' ');
    } catch (error) {
      return '';
    }
  }
}
