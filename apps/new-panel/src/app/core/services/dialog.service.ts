import { inject, Injectable } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import {
  PromptDialogComponent,
  PromptFields,
} from '../../shared/dialogs/prompt-dialog/prompt-dialog.component';
import { AlertDialogComponent } from '../../shared/dialogs/alert-dialog/alert-dialog.component';
import { ImageCropperDialogComponent } from '../../shared/dialogs/image-cropper-dialog/image-cropper-dialog.component';
import { CropperOptions } from 'ngx-image-cropper';
import { SortDialogComponent, SortItem } from '../../shared/dialogs/sort-dialog/sort-dialog.component';

@Injectable({
  providedIn: 'root',
})
export class DialogService {
  private readonly dialog = inject(MatDialog);

  async prompt(
    title: string,
    fields: PromptFields,
    extra?: { config?: MatDialogConfig; description?: string },
  ) {
    return this.dialog
      .open(PromptDialogComponent, {
        disableClose: true,
        ...extra?.config,
        data: { title, fields, description: extra?.description },
      })
      .afterClosed()
      .toPromise();
  }

  async alert(title: string, description: string, extra?: { config?: MatDialogConfig }) {
    return this.dialog
      .open(AlertDialogComponent, {
        ...extra?.config,
        data: { title, description },
      })
      .afterClosed()
      .toPromise();
  }

  async sort(title: string, items: SortItem[], extra?: { config?: MatDialogConfig }) {
    return this.dialog
      .open(SortDialogComponent, {
        disableClose: true,
        ...extra?.config,
        data: { title, items },
      })
      .afterClosed()
      .toPromise();
  }

  async imageCropper(options?: CropperOptions): Promise<{ base64: string; file: File } | undefined> {
    return this.dialog
      .open(ImageCropperDialogComponent, {
        disableClose: true,
        data: {
          ...options,
        },
      })
      .afterClosed()
      .toPromise();
  }
}
