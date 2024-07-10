import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn, RouterStateSnapshot } from '@angular/router';
import { User } from '@menno/types';
import { AuthService } from '../services';

export const userResolver: ResolveFn<User> = async (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
) => {
  const auth = inject(AuthService);
  if (!auth.user) await auth.getResolver();
  return auth.user;
};
