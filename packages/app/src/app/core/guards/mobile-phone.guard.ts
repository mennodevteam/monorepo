import { Injectable } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot } from '@angular/router';
import { filter, take } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class MobilePhoneGuard implements CanActivate {
  constructor(private auth: AuthService, private bottomSheet: MatBottomSheet) {}
  async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
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
      const complete = await this.auth.openLoginPrompt();
      return complete ? true : false;
    }
    return false;
  }
}
