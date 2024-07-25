import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn, RouterStateSnapshot } from '@angular/router';
import { Menu } from '@menno/types';
import { MenuService, ShopService } from '../services';

export const menuResolver: ResolveFn<Menu> = async (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
) => {
  const shopService = inject(ShopService);
  const menuService = inject(MenuService);
  await shopService.getResolver();
  await menuService.getResolver();
  return menuService.menu();
};
