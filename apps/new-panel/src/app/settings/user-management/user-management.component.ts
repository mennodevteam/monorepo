import { Component, inject, signal } from '@angular/core';
import { ShopService } from '../../shop/shop.service';
import { TranslateService } from '@ngx-translate/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormControl, Validators } from '@angular/forms';
import { ShopUser, UserAction } from '@menno/types';
import { AuthService } from '../../auth/auth.service';
import { DialogService } from '../../core/services/dialog.service';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { UserManagementTableComponent } from './user-management-table/user-management-table.component';
import { injectMutation, injectQuery } from '@tanstack/angular-query-experimental';
import { DataLoadingComponent } from '../../shared/components/data-loading/data-loading.component';
import { SHARED } from '../../shared';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    SHARED,
    MatToolbarModule,
    MatCardModule,
    MatButtonModule,
    UserManagementTableComponent,
    DataLoadingComponent,
  ],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.scss',
})
export class UserManagementComponent {
  private readonly shopService = inject(ShopService);
  private readonly dialog = inject(DialogService);
  private readonly translate = inject(TranslateService);
  private readonly auth = inject(AuthService);
  private readonly snack = inject(MatSnackBar);

  query = injectQuery(() => ({
    queryKey: ['shopUsers'],
    queryFn: () => this.shopService.getShopUsers(),
  }));

  saveMutation = injectMutation(() => ({
    mutationFn: (shopUser: ShopUser) => this.shopService.saveShopUser(shopUser),
    onSuccess: () => {
      this.query.refetch();
      this.snack.open(this.translate.instant('app.savedSuccessfully'), '', { panelClass: 'success' });
    },
    onError: () => {
      this.snack.open(this.translate.instant('app.errorOccurred'), '', { panelClass: 'error' });
    },
    onmutate: () => {
      this.snack.open(this.translate.instant('app.saving'), '', { duration: 4000 });
    },
  }));

  removeMutation = injectMutation(() => ({
    mutationFn: (shopUser: ShopUser) => this.shopService.removeShopUser(shopUser.id),
    onSuccess: () => {
      this.query.refetch();
    },
  }));

  async openAddShopUsersDialog(item?: ShopUser) {
    const dto = await this.dialog.prompt(
      this.translate.instant('userManagement.dialog.newTitle'),
      {
        actions: {
          label: this.translate.instant('userManagement.dialog.actions'),
          control: new FormControl(item ? item.actions : [], [Validators.required]),
          type: 'select',
          options: [
            { value: UserAction.Menu, text: this.translate.instant('userAction.menu') },
            { value: UserAction.Order, text: this.translate.instant('userAction.order') },
            { value: UserAction.Inventory, text: this.translate.instant('userAction.inventory') },
            { value: UserAction.Club, text: this.translate.instant('userAction.club') },
            { value: UserAction.Reports, text: this.translate.instant('userAction.reports') },
            { value: UserAction.Coupons, text: this.translate.instant('userAction.coupons') },
            { value: UserAction.Marketing, text: this.translate.instant('userAction.marketing') },
            { value: UserAction.Setting, text: this.translate.instant('userAction.setting') },
          ],
          multiple: true,
        },
        username: {
          label: this.translate.instant('userManagement.dialog.username'),
          control: new FormControl(item ? item.user.username : undefined, [Validators.required]),
          hint: this.translate.instant('userManagement.dialog.usernameHint', {
            value: `${this.auth.user?.username}_`,
          }),
          ltr: true,
          eng: true,
          disabled: item != undefined,
        },
        password: {
          label: this.translate.instant('userManagement.dialog.password'),
          control: new FormControl(item ? item.user.password : undefined, [Validators.required]),
          ltr: true,
          eng: true,
          disabled: item != undefined,
        },
        firstName: {
          label: this.translate.instant('userManagement.dialog.firstName'),
          control: new FormControl(item ? item.user.firstName : undefined),
          disabled: item != undefined,
        },
        lastName: {
          label: this.translate.instant('userManagement.dialog.lastName'),
          control: new FormControl(item ? item.user.lastName : undefined),
          disabled: item != undefined,
        },
      },
      {
        config: { width: '400px' },
      },
    );
    if (dto) {
      const shopUser = new ShopUser();
      if (item) {
        shopUser.user = item.user;
        shopUser.id = item.id;
      } else {
        shopUser.user = dto as any;
        if (shopUser.user.username)
          shopUser.user.username = `${this.auth.user?.username}_${shopUser.user.username}`;
      }
      shopUser.actions = (dto as any).actions;
      (dto as any).actions = undefined;

      this.saveMutation.mutate(shopUser);
    }
  }

  async removeShopUsers(shopUser: ShopUser) {
    const isAccepted = await this.dialog.alert(
      this.translate.instant('app.removeItem'),
      this.translate.instant('app.removeItemDescription', { value: shopUser.user.firstName }),
    );

    if (isAccepted) {
      this.removeMutation.mutate(shopUser);
    }
  }
}
