import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ThirdParty, ThirdPartyApp } from '@menno/types';
import { ShopService } from '../../../../core/services/shop.service';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { AlertDialogComponent } from 'packages/panel/src/app/shared/dialogs/alert-dialog/alert-dialog.component';
import { Router } from '@angular/router';

@Component({
  selector: 'hami',
  templateUrl: './alopeyk.component.html',
  styleUrls: ['./alopeyk.component.scss'],
})
export class AlopeykComponent {
  thirdPartyForm: FormGroup;

  constructor(
    private shopService: ShopService,
    private dialog: MatDialog,
    private translate: TranslateService,
    private router: Router
  ) {
    this.initForm();
    if (!this.shopService.shop?.latitude || !this.shopService.shop?.longitude) {
      this.dialog
        .open(AlertDialogComponent, {
          data: {
            title: this.translate.instant('deliveryArea.shopNotSetDialog.title'),
            description: this.translate.instant('deliveryArea.shopNotSetDialog.description'),
            okText: this.translate.instant('deliveryArea.shopNotSetDialog.okText'),
            cancelText: this.translate.instant('deliveryArea.shopNotSetDialog.cancelText'),
          },
          disableClose: true,
        })
        .afterClosed()
        .subscribe((val) => {
          if (val) this.router.navigateByUrl('/settings/shop');
        });
    }
  }

  get thirdParty() {
    return this.shopService.shop?.thirdParties?.find((x) => x.app === ThirdPartyApp.Alopeyk);
  }

  initForm() {
    this.thirdPartyForm = new FormGroup({
      token: new FormControl(this.thirdParty?.token, Validators.required),
    });
    this.thirdPartyForm.disable();
  }

  async save() {
    if (this.thirdPartyForm.invalid) return;
    const fv = this.thirdPartyForm.getRawValue();
    const dto = new ThirdParty();
    if (this.thirdParty) dto.id = this.thirdParty.id;
    dto.app = ThirdPartyApp.Alopeyk;
    dto.token = fv.token;
    await this.shopService.saveThirdParty(dto);
    this.initForm();
  }
}
