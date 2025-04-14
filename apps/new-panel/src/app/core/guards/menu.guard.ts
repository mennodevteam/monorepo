import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, RouterStateSnapshot } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop'; // Import this utility function
import { filter, firstValueFrom } from 'rxjs';
import { MenuService } from '../../menu/menu.service';

export const menuDataActivator: CanActivateFn = async (
  next: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
) => {
  const menuService = inject(MenuService);
  await firstValueFrom(toObservable(menuService.data).pipe(filter((x) => !!x)));
  return true;
};
