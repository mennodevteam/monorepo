import { AfterViewInit, Component, ElementRef, Inject, OnInit, Optional, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { base64ToFile, ImageCroppedEvent, ImageCropperModule } from 'ngx-image-cropper';
import heic2any from 'heic2any';
import { CommonModule } from '@angular/common';
import { SHARED } from '../..';

@Component({
  selector: 'app-image-cropper-dialog',
  standalone: true,
  templateUrl: './image-cropper-dialog.component.html',
  styleUrls: ['./image-cropper-dialog.component.scss'],
  imports: [CommonModule, SHARED, ImageCropperModule, MatDialogModule],
})
export class ImageCropperDialogComponent implements AfterViewInit {
  imageChangedEvent: any = '';
  result: any;
  @ViewChild('fileInput') fileInput: ElementRef;

  constructor(
    @Inject(MAT_DIALOG_DATA) @Optional() public data: any,
    public dialogRef: MatDialogRef<any>,
  ) {}

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.fileInput.nativeElement.click();
    }, 500);
  }

  async fileChangeEvent(event: any) {
    const file = event.target.files[0];
    if (file.type.search('heic') >= 0) {
      const convertedFile: Blob = (await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 1,
      })) as Blob;

      const list = new DataTransfer();
      list.items.add(new File([convertedFile], 'file.jpeg', { type: 'image/jpeg' }));

      const newInput = document.createElement('input');
      newInput.files = list.files;

      // this.fileInput.nativeElement.value = convertedFile;
      // // const newFile = new File([convertedFile], 'img.jpg', { type: 'image/jpeg', lastModified: new Date().getTime() });
      // // let container = new DataTransfer();
      // event.target.files = [convertedFile];
      // this.imageChangedEvent = list;
      this.fileInput.nativeElement.files = list.files;
      this.imageChangedEvent = event;
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
