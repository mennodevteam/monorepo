import { inject, Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn, RouterStateSnapshot } from '@angular/router';
import { MenuService } from '../services/menu.service';
import { Menu } from '@menno/types';

export const menuResolver: ResolveFn<Menu> = async (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
) => {
  const menuService = inject(MenuService);
  await menuService.getResolver();
  return menuService.menu();
};
