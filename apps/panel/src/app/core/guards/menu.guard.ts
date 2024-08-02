import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot, UrlTree } from '@angular/router';
import { MenuService } from '../services/menu.service';

@Injectable({
  providedIn: 'root',
})
export class MenuGuard implements CanActivate {
  constructor(private menuService: MenuService) {}
  async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    await this.menuService.getResolver();
    return true;
  }
}
