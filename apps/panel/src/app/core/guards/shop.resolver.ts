import { inject, Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn, RouterStateSnapshot } from '@angular/router';
import { ShopService } from '../services/shop.service';
import { Shop } from '@menno/types';

export const shopResolver: ResolveFn<Shop> = async (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
) => {
  const shopService = inject(ShopService);
  await shopService.getResolver();
  return shopService.shop!;
};
