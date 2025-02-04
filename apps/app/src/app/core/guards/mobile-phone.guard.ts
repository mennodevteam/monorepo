import { Injectable } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot } from '@angular/router';
import { filter, take } from 'rxjs';
import { LoginBottomSheetComponent } from '../../shared/dialogs/login-bottom-sheet/login-bottom-sheet.component';
import { AuthService } from '../services/auth.service';
import { ShopService } from '../services/shop.service';
import { MenuService } from '../services/menu.service';

@Injectable({
  providedIn: 'root',
})
export class MobilePhoneGuard implements CanActivate {
  constructor(
    private auth: AuthService,
    private bottomSheet: MatBottomSheet,
    private shopService: ShopService,
    private menuService: MenuService
  ) {}
  async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
    if (!this.needLogin()) return true;
    if (!this.auth.user) {
      await this.auth.userObservable
        .pipe(
          filter((x) => x != null),
          take(1)
        )
        .toPromise();
    }
    if (this.auth.user) {
      if (this.auth.user.mobilePhone) return true;
      const complete = await this.bottomSheet.open(LoginBottomSheetComponent).afterDismissed().toPromise();
      return complete ? true : false;
    }
    return false;
  }

  private needLogin() {
    const t = this.menuService.type;
    const config = this.shopService.shop?.appConfig
    if (!this.shopService.hasOrderingPlugin()) return false;
    if (config) {
      if (config?.disableOrdering) return false;
      if (t != undefined && !config.disablePayment && config.requiredPayment.indexOf(t) > -1) return true;
      if (t != undefined && config.requiredRegister.indexOf(t) > -1) return true;
    }
    return false;
  }
}
