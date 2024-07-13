import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn, RouterStateSnapshot } from '@angular/router';
import { Menu } from '@menno/types';
import { MenuService } from '../services';

export const menuResolver: ResolveFn<Menu> = async (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
) => {
  const menuService = inject(MenuService);
  await menuService.getResolver();
  return menuService.menu();
};
