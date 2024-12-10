import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, RouterStateSnapshot } from '@angular/router';
import { ShopService } from '../../shop/shop.service';
import { toObservable } from '@angular/core/rxjs-interop'; // Import this utility function
import { filter, firstValueFrom } from 'rxjs';

export const shopDataActivator: CanActivateFn = async (
  next: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
) => {
  const shopService = inject(ShopService);
  await firstValueFrom(toObservable(shopService.data).pipe(filter((x) => !!x)));
  return true;
};
