import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services';

export const loginActivator: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isGuestUser) {
    router.navigate(['/login'], { queryParams: { returnPath: state.url } });
    return false;
  }
  return true;
};
