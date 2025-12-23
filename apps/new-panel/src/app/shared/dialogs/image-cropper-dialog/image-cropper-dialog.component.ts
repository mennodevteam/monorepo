import { AfterViewInit, Component, ElementRef, Inject, OnInit, Optional, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { base64ToFile, ImageCroppedEvent, ImageCropperModule } from 'ngx-image-cropper';
import heic2any from 'heic2any';

import { SHARED } from '../..';

@Component({
  selector: 'app-image-cropper-dialog',
  standalone: true,
  templateUrl: './image-cropper-dialog.component.html',
  styleUrls: ['./image-cropper-dialog.component.scss'],
  imports: [SHARED, ImageCropperModule, MatDialogModule],
})
export class ImageCropperDialogComponent implements AfterViewInit {
  imageChangedEvent: any = '';
  result: any;
  @ViewChild('fileInput') fileInput: ElementRef;

  constructor(
    @Inject(MAT_DIALOG_DATA) @Optional() public data: any,
    public dialogRef: MatDialogRef<any>,
  ) {
    // Reset state when dialog opens
    this.imageChangedEvent = '';
    this.result = null;
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.fileInput?.nativeElement) {
        // Reset the file input to allow selecting the same file again
        this.fileInput.nativeElement.value = '';
        this.fileInput.nativeElement.click();
      }
    }, 500);
  }

  async fileChangeEvent(event: any) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    
    // Reset result when new file is selected
    this.result = null;
    
    if (file.type.search('heic') >= 0) {
      const convertedFile: Blob = (await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 1,
      })) as Blob;

      const list = new DataTransfer();
      list.items.add(new File([convertedFile], 'file.jpeg', { type: 'image/jpeg' }));

      this.fileInput.nativeElement.files = list.files;
      this.imageChangedEvent = { target: { files: list.files } };
    } else {
      this.imageChangedEvent = event;
    }
  }
  imageCropped(event: ImageCroppedEvent) {
    if (event.base64) {
      const file = base64ToFile(event.base64);
      this.result = { base64: event.base64, file };
    }
  }
}
