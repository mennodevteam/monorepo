import { first } from 'rxjs/operators';
import { ShopService } from './../../../core/services/shop.service';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormControl, Validators } from '@angular/forms';
import { ShopUser, UserAction } from '@menno/types';
import { AuthService } from '../../../core/services/auth.service';
import { AdvancedPromptDialogComponent } from '../../../shared/dialogs/advanced-prompt-dialog/advanced-prompt-dialog.component';
import { AlertDialogComponent } from '../../../shared/dialogs/alert-dialog/alert-dialog.component';
import { AlertDialogService } from '../../../core/services/alert-dialog.service';

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss'],
})
export class UserManagementComponent implements OnInit {
  shopUsers: ShopUser[];

  constructor(
    private shopService: ShopService,
    private dialog: MatDialog,
    private translate: TranslateService,
    private auth: AuthService,
    private snack: MatSnackBar,
    private alertDialogService: AlertDialogService
  ) {}

  async load() {
    this.shopUsers = (await this.shopService.getShopUsers()) || [];
  }

  ngOnInit(): void {
    this.load();
  }

  async openAddShopUsersDialog(item?: ShopUser) {
    const dto: any = await this.dialog
      .open(AdvancedPromptDialogComponent, {
        width: '400px',
        data: {
          title: this.translate.instant('addShopUserDialog.newTitle'),
          fields: {
            actions: {
              label: this.translate.instant('addShopUserDialog.actions'),
              control: new FormControl(item ? item.actions : [], [Validators.required]),
              type: 'multiple',
              options: [
                { value: UserAction.Menu, text: this.translate.instant('addShopUserDialog.menu') },
                { value: UserAction.Order, text: this.translate.instant('addShopUserDialog.order') },
                { value: UserAction.Club, text: this.translate.instant('addShopUserDialog.club') },
                {
                  value: UserAction.ChargeMemberWallet,
                  text: this.translate.instant('addShopUserDialog.chargeMemberWallet'),
                },
                { value: UserAction.Sms, text: this.translate.instant('addShopUserDialog.sms') },
                { value: UserAction.Coupons, text: this.translate.instant('addShopUserDialog.coupons') },
                { value: UserAction.Marketing, text: this.translate.instant('addShopUserDialog.marketing') },
                { value: UserAction.Report, text: this.translate.instant('addShopUserDialog.report') },
                { value: UserAction.Payment, text: this.translate.instant('addShopUserDialog.payment') },
                { value: UserAction.Setting, text: this.translate.instant('addShopUserDialog.setting') },
              ],
            },
            firstName: {
              label: this.translate.instant('addShopUserDialog.firstName'),
              control: new FormControl(item ? item.user.firstName : undefined, [Validators.required]),
              disabled: item != undefined,
            },
            lastName: {
              label: this.translate.instant('addShopUserDialog.lastName'),
              control: new FormControl(item ? item.user.lastName : undefined, [Validators.required]),
              disabled: item != undefined,
            },
            username: {
              label: this.translate.instant('addShopUserDialog.username'),
              control: new FormControl(item ? item.user.username : undefined, [Validators.required]),
              hint: this.translate.instant('addShopUserDialog.usernameHint', {
                value: `${this.auth.instantUser?.username}_`,
              }),
              disabled: item != undefined,
            },
            password: {
              label: this.translate.instant('addShopUserDialog.password'),
              control: new FormControl(item ? item.user.password : undefined, [Validators.required]),
              disabled: item != undefined,
            },
            mobilePhone: {
              label: this.translate.instant('addShopUserDialog.mobile'),
              control: new FormControl(item ? item.user.mobilePhone : undefined),
              disabled: item != undefined,
            },
          },
        },
      })
      .afterClosed()
      .toPromise();
    if (dto) {
      const shopUser = new ShopUser();
      if (item) {
        shopUser.user = item.user;
        shopUser.id = item.id;
      } else {
        shopUser.user = dto;
        if (shopUser.user.username)
          shopUser.user.username = `${this.auth.instantUser?.username}_${shopUser.user.username}`;
      }
      shopUser.actions = dto.actions;
      dto.actions = undefined;

      try {
        await this.shopService.saveShopUser(shopUser);
        this.load();
        this.snack.open(this.translate.instant('app.savedSuccessfully'), '', { panelClass: 'success' });
      } catch (error: any) {
        if (error.status === 409) {
          if (error.message) {
            const m: string = error.message.toLocaleLowerCase();
            if (m.search('username') > -1) {
              this.snack.open(this.translate.instant('addShopUserDialog.conflictUsernameError'), '', {
                panelClass: 'warning',
              });
            } else if (m.search('phone') > -1) {
              this.snack.open(this.translate.instant('addShopUserDialog.conflictPhoneError'), '', {
                panelClass: 'warning',
              });
            }
          }
        }
      }
    }
  }

  async removeShopUsers(shopUser: ShopUser) {
    const isAccepted = await this.alertDialogService.removeItem(shopUser.user.firstName);

    if (isAccepted) {
      await this.shopService.removeShopUser(shopUser.id);
      this.load();
    }
  }
}
