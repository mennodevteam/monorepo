import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { DialogService } from '../services/dialog.service';
import { TranslateService } from '@ngx-translate/core';

export const userActionsGuard: CanActivateFn = async (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
): Promise<boolean> => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const dialog = inject(DialogService);
  const translate = inject(TranslateService);

  // Wait for shop user data to be loaded
  await auth.getShopUserResolver();

  // Check if route has userActions data
  if (route.data && route.data['userActions']) {
    for (const action of route.data['userActions']) {
      if (!auth.hasAccess(action)) {
        // Show access denied dialog
        await dialog.alert(
          translate.instant('userActionsDialog.title'),
          translate.instant('userActionsDialog.description'),
          {
            config: {
              data: {
                hideCancel: true,
              },
            },
          },
        );

        return false;
      }
    }
  }

  return true;
};
