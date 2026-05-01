import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BaleBotKeys, Image, ThirdParty, ThirdPartyApp } from '@menno/types';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { lastValueFrom } from 'rxjs';

import { SHARED } from '../../../shared';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { ShopService } from '../../../shop/shop.service';
import { DialogService } from '../../../core/services/dialog.service';
import { FilesService } from '../../../core/services/files.service';

@Component({
  selector: 'app-bale',
  imports: [
    SHARED,
    MatToolbarModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatListModule,
  ],
  templateUrl: './bale.component.html',
  styleUrl: './bale.component.scss',
})
export class BaleComponent {
  private readonly http = inject(HttpClient);
  private readonly shopService = inject(ShopService);
  private readonly dialog = inject(DialogService);
  private readonly filesService = inject(FilesService);
  private readonly snack = inject(MatSnackBar);
  private readonly t = inject(TranslateService);

  thirdPartyForm: FormGroup;

  constructor() {
    this.initForm();
  }

  get thirdParty() {
    return this.shopService.data()?.thirdParties?.find((x) => x.app === ThirdPartyApp.Bale);
  }

  initForm() {
    const keys = (this.thirdParty?.keys as BaleBotKeys) || {};
    this.thirdPartyForm = new FormGroup({
      token: new FormControl(this.thirdParty?.token, Validators.required),
      startMessage: new FormControl(keys.start?.message),
      buttonText: new FormControl(keys.start?.buttonText ?? keys.start?.primaryButtonText),
      imageUrl: new FormControl(keys.start?.imageUrl),
    });
    this.thirdPartyForm.disable();
  }

  async uploadWelcomeImage() {
    const res = await this.dialog.imageCropper({
      maintainAspectRatio: false,
      aspectRatio: 1,
    });
    if (!res?.file) return;

    const uploading = this.snack.open(this.t.instant('app.uploading'), '', { duration: 0 });
    try {
      const saved = await this.filesService.upload(res.file, 'baleWelcome');
      if (!saved?.key) {
        this.snack.open(this.t.instant('errors.changeError'), '', { duration: 3000 });
        return;
      }
      const imageFile = await this.filesService.saveFileImage(saved.key, 'baleWelcome');
      if (!imageFile) {
        this.snack.open(this.t.instant('errors.changeError'), '', { duration: 3000 });
        return;
      }
      const url = this.publicImageUrl(imageFile);
      this.thirdPartyForm.patchValue({ imageUrl: url });
      this.thirdPartyForm.markAsDirty();
    } finally {
      uploading.dismiss();
    }
  }

  clearWelcomeImage() {
    this.thirdPartyForm.patchValue({ imageUrl: '' });
    this.thirdPartyForm.markAsDirty();
  }

  private publicImageUrl(image: Image): string {
    const origin = image?.origin?.trim();
    if (!origin) return '';
    if (origin.startsWith('http://') || origin.startsWith('https://')) return origin;
    return this.filesService.getFileUrl(origin);
  }

  async save() {
    if (this.thirdPartyForm.invalid) return;
    const fv = this.thirdPartyForm.getRawValue();

    const dto = new ThirdParty();
    if (this.thirdParty) dto.id = this.thirdParty.id;
    dto.app = ThirdPartyApp.Bale;
    dto.token = fv.token;
    dto.keys = {
      start: {
        message: fv.startMessage,
        buttonText: fv.buttonText,
        imageUrl: fv.imageUrl?.trim() ?? '',
      },
    };

    await lastValueFrom(this.http.post<ThirdParty>(`/thirdParties`, dto));
    await this.shopService.refetchShop();
    this.initForm();
  }
}
