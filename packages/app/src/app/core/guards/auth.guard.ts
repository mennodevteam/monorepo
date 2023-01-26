import { Injectable } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot } from '@angular/router';
import { filter } from 'rxjs';
import { LoginBottomSheetComponent } from '../../shared/dialogs/login-bottom-sheet/login-bottom-sheet.component';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService, private bottomSheet: MatBottomSheet) {}
  async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
    if (!this.auth.user) await this.auth.userObservable.pipe(filter((x) => x != null)).toPromise();
    if (this.auth.user) {
      if (this.auth.user.mobilePhone) return true;
      const complete = await this.bottomSheet.open(LoginBottomSheetComponent).afterDismissed().toPromise();
      return complete ? true : false;
    }
    return false;
  }
}
