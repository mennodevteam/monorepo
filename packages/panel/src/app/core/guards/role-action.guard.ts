import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { AlertDialogComponent } from '../../shared/dialogs/alert-dialog/alert-dialog.component';
import { ShopUserRole } from '@menno/types';
import { AuthService } from '../services/auth.service';
import { UserActionsService } from '../services/user-actions.service';

@Injectable({
  providedIn: 'root'
})
export class RoleActionGuard implements CanActivate {
  constructor(
    private userActionsService: UserActionsService,
    private auth: AuthService,
    private dialog: MatDialog,
    private router: Router,
    private translate: TranslateService,
  ) { }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    
    if (route.data && route.data.actions && this.userActionsService.instantRole != ShopUserRole.Admin) {
      for (const a of route.data.actions) {
        if (this.userActionsService.instantActions.indexOf(a) === -1) {
          this.translate.get('app').subscribe((text) => {
            this.dialog.open(AlertDialogComponent, {
              data: {
                title: this.translate.instant('noActionPermisionDialog.title'),
                description: this.translate.instant('noActionPermisionDialog.description'),
                okText: this.translate.instant('noActionPermisionDialog.goHome'),
                // hideCancel: true,
              },
            }).afterClosed().subscribe((res) => {
              if (res) {
                this.router.navigateByUrl('/home');
              }
            });
          })
          return false;
        }
      }
    }
    return true;
  }
  
}
