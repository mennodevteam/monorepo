import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn, RouterStateSnapshot } from '@angular/router';
import { Shop } from '@menno/types';
import { ShopService } from '../services';

export const shopResolver: ResolveFn<Shop> = async (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
) => {
  const shopService = inject(ShopService);
  if (!shopService.shop) await shopService.getResolver();
  return shopService.shop;
};
