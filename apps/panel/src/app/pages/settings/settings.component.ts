import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ShopService } from '../../core/services/shop.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { PromptDialogComponent } from '../../shared/dialogs/prompt-dialog/prompt-dialog.component';
import { Shop } from '@menno/types';
import {
  AdvancedPromptDialogComponent,
  PromptKeyFields,
} from '../../shared/dialogs/advanced-prompt-dialog/advanced-prompt-dialog.component';
import { FormControl, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ApiError } from '../../core/api-error';
import { HttpStatusCode } from '@angular/common/http';

@Component({
  selector: 'settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent implements OnInit {
  constructor(
    private dialog: MatDialog,
    public shopService: ShopService,
    private snack: MatSnackBar,
    private translate: TranslateService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {}

  async setPos() {
    const posesText: string = await this.dialog
      .open(PromptDialogComponent, {
        data: {
          title: this.translate.instant('posesSettingDialog.title'),
          label: this.translate.instant('posesSettingDialog.label'),
          description: this.translate.instant('posesSettingDialog.description'),
          rows: 8,
          value: this.shopService.shop?.details.poses ? this.shopService.shop.details.poses.join('\n') : '',
          type: 'textarea',
        },
      })
      .afterClosed()
      .toPromise();

    if (posesText) {
      const poses = posesText
        .split('\n')
        .map((x) => x.trim())
        .filter((x) => x);
      const shop = new Shop();
      shop.details = { ...this.shopService.shop?.details, poses };
      this.snack.open(this.translate.instant('app.saving'));
      await this.shopService.saveShop(shop);
      this.snack.open(this.translate.instant('app.savedSuccessfully'), '', { panelClass: 'success' });
    }
  }

  openChangePassword(dto?: any) {
    const fields: PromptKeyFields = {
      prevPassword: {
        control: new FormControl(dto ? dto.prevPassword : '', Validators.required),
        label: this.translate.instant('changePassword.prevPasswordLabel'),
        type: 'password',
      },
      newPassword: {
        control: new FormControl(dto ? dto.newPassword : '', Validators.required),
        label: this.translate.instant('changePassword.newPassword'),
        type: 'password',
      },
      newPasswordRepeat: {
        control: new FormControl(dto ? dto.newPasswordRepeat : '', Validators.required),
        label: this.translate.instant('changePassword.newPasswordRepeat'),
        type: 'password',
      },
    };

    this.dialog
      .open(AdvancedPromptDialogComponent, {
        data: {
          title: this.translate.instant('changePassword.dialogTitle'),
          fields,
        },
      })
      .afterClosed()
      .subscribe(async (dto) => {
        if (!dto) return;
        try {
          await this.auth.changePassword(dto);
          this.snack.open(this.translate.instant('changePassword.success'), '', { panelClass: 'success' });
        } catch (error) {
          if (error instanceof ApiError) {
            switch (error.status) {
              case HttpStatusCode.Conflict:
                this.snack.open(this.translate.instant('changePassword.notSamePassWarning'), '', {
                  panelClass: 'warning',
                });
                break;
              case HttpStatusCode.NotFound:
                this.snack.open(this.translate.instant('changePassword.wrongPrevPassWarning'), '', {
                  panelClass: 'warning',
                });
                break;
            }
          }
          this.openChangePassword(dto);
        }
      });
  }
}
