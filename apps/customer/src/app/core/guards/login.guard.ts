import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const loginActivator: CanActivateFn = async (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.getResolver();
  if (auth.isGuestUser) {
    router.navigate(['/login'], { queryParams: { returnPath: state.url } });
    return false;
  }
  return true;
};
