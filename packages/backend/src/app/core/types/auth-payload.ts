import { UserRole } from '@menno/types';

export class AuthPayload {
  id: string;
  username?: string;
  mobilePhone?: string;
  shopId?: string;
  role: UserRole;
}
