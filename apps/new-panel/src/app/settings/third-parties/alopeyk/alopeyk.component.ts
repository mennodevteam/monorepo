import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ReactiveFormsModule } from '@angular/forms';
import { MatListModule } from '@angular/material/list';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ThirdParty, ThirdPartyApp } from '@menno/types';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { SHARED } from '../../../shared';
import { ShopService } from '../../../shop/shop.service';
import { DialogService } from '../../../core/services/dialog.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'hami',
  imports: [
    CommonModule,
    SHARED,
    MatToolbarModule,
    MatCardModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatListModule,
  ],
  templateUrl: './alopeyk.component.html',
  styleUrls: ['./alopeyk.component.scss'],
})
export class AlopeykComponent {
  private shopService = inject(ShopService);
  private dialog = inject(DialogService);
  private translate = inject(TranslateService);
  private router = inject(Router);
  private http = inject(HttpClient);

  thirdPartyForm: FormGroup;

  constructor() {
    this.initForm();
    if (!this.shopService.data()?.latitude || !this.shopService.data()?.longitude) {
      this.dialog
        .alert(
          this.translate.instant('deliveryArea.shopNotSetDialog.title'),
          this.translate.instant('deliveryArea.shopNotSetDialog.description'),
          {
            config: {
              disableClose: true,
            },
          },
        )
        .then((val) => {
          if (val) this.router.navigateByUrl('/settings/shop');
        });
    }
  }

  get thirdParty() {
    return this.shopService.data()?.thirdParties?.find((x) => x.app === ThirdPartyApp.Alopeyk);
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
    await this.http.post(`thirdParties`, dto).toPromise();
    this.initForm();
  }
}
